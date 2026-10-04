/* CoPadres — service worker
 *
 * - Hace la app instalable.
 * - Deja preparadas las pantallas de la app (/app/…) y su código para poder
 *   abrirlas sin conexión. Esas páginas solo contienen la «estructura»: los
 *   datos se cargan desde el navegador (cifrados en el dispositivo por el modo
 *   sin conexión, nunca aquí).
 * - Nunca guarda respuestas de Supabase, de la API ni de otros orígenes
 *   (salvo las tipografías públicas de Google Fonts).
 * - Al cerrar sesión, la app pide borrar las páginas guardadas.
 */

const VERSION = "v3";
const ESTATICOS = `copadres-estaticos-${VERSION}`;
const RECURSOS = `copadres-recursos-${VERSION}`;
const PAGINAS = "copadres-paginas";
const MAX_RECURSOS = 300;
const PRECARGA = [
  "/offline.html",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/marca/copadres-logo.png",
  "/manifest.webmanifest",
];
const FUENTES = ["https://fonts.googleapis.com", "https://fonts.gstatic.com"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(ESTATICOS).then((c) => c.addAll(PRECARGA)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  const vigentes = [ESTATICOS, RECURSOS, PAGINAS];
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => !vigentes.includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ---------------------------------------------------------------------------

function esPaginaGuardable(res) {
  return res && res.ok && !res.redirected && (res.headers.get("content-type") || "").includes("text/html");
}

async function podar(nombre, maximo) {
  const c = await caches.open(nombre);
  const ks = await c.keys();
  for (const k of ks.slice(0, Math.max(0, ks.length - maximo))) await c.delete(k);
}

/** Guarda el código (JS/CSS) que necesita una página para funcionar sin conexión. */
async function guardarRecursosDe(html) {
  const urls = new Set(html.match(/\/_next\/static\/[^"'\\\s)<>]+/g) || []);
  const c = await caches.open(RECURSOS);
  for (const u of urls) {
    if (await c.match(u)) continue;
    try {
      const r = await fetch(u);
      if (r.ok) await c.put(u, r);
    } catch {
      /* se intentará en otra ocasión */
    }
  }
  await podar(RECURSOS, MAX_RECURSOS);
}

async function guardarPagina(url, res) {
  const c = await caches.open(PAGINAS);
  await c.put(url, res.clone());
  await guardarRecursosDe(await res.text());
}

async function precargar(rutas) {
  const c = await caches.open(PAGINAS);
  for (const ruta of rutas) {
    if (await c.match(ruta)) continue;
    try {
      const res = await fetch(ruta, { credentials: "same-origin" });
      if (esPaginaGuardable(res)) await guardarPagina(ruta, res);
    } catch {
      return; // sin red: se reintenta en la próxima visita
    }
  }
}

self.addEventListener("message", (e) => {
  const d = e.data || {};
  if (d.tipo === "limpiar") {
    e.waitUntil(caches.delete(PAGINAS));
  } else if (d.tipo === "precargar" && Array.isArray(d.rutas)) {
    const rutas = d.rutas.filter((r) => typeof r === "string" && /^\/app(\/[a-z-]+)?$/.test(r)).slice(0, 20);
    e.waitUntil(precargar(rutas));
  }
});

// ---------------------------------------------------------------------------

async function primeroCache(req, nombre) {
  const hit = await caches.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok || res.type === "opaque") {
    const copia = res.clone();
    caches.open(nombre).then((c) => c.put(req, copia));
  }
  return res;
}

function cacheYActualiza(e, req) {
  const red = fetch(req).then((res) => {
    if (res.ok) {
      const copia = res.clone();
      caches.open(RECURSOS).then((c) => c.put(req, copia));
    }
    return res;
  });
  e.respondWith(caches.match(req).then((hit) => hit || red).catch(() => red));
  e.waitUntil(red.catch(() => {}));
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Tipografías públicas (sin datos personales).
  if (FUENTES.includes(url.origin)) {
    e.respondWith(primeroCache(req, RECURSOS));
    return;
  }
  // Nada más de otros orígenes (Supabase, Stripe, IA) pasa por aquí.
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) return;

  // Navegación.
  if (req.mode === "navigate") {
    if (url.pathname === "/app" || url.pathname.startsWith("/app/")) {
      // Red primero; sin red, la última versión guardada de esa pantalla.
      e.respondWith(
        fetch(req)
          .then((res) => {
            if (esPaginaGuardable(res)) e.waitUntil(guardarPagina(url.pathname + url.search, res.clone()));
            return res;
          })
          .catch(async () => {
            const c = await caches.open(PAGINAS);
            return (
              (await c.match(url.pathname + url.search)) ||
              (await c.match(url.pathname, { ignoreSearch: true })) ||
              (await caches.match("/offline.html"))
            );
          })
      );
    } else {
      e.respondWith(fetch(req).catch(() => caches.match("/offline.html")));
    }
    return;
  }

  // Código de la app (nombres con huella: no cambian nunca).
  if (url.pathname.startsWith("/_next/static/")) {
    e.respondWith(primeroCache(req, RECURSOS));
    return;
  }

  // Imágenes propias.
  if (url.pathname.startsWith("/_next/image") || /\.(png|svg|webp|jpg|jpeg|ico|woff2?)$/.test(url.pathname)) {
    cacheYActualiza(e, req);
  }
});

// ---------------------------------------------------------------------------
// Notificaciones push (cuando se configure un servidor de push).

self.addEventListener("push", (e) => {
  let datos = {};
  try { datos = e.data ? e.data.json() : {}; } catch { datos = {}; }
  e.waitUntil(
    self.registration.showNotification(datos.titulo || "CoPadres", {
      body: datos.cuerpo || "Tienes una novedad en CoPadres.",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-maskable-192.png",
      data: { enlace: datos.enlace || "/app/notificaciones" },
    })
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const enlace = e.notification.data && e.notification.data.enlace;
  const destino = typeof enlace === "string" && enlace.startsWith("/") && !enlace.startsWith("//") ? enlace : "/app";
  e.waitUntil(self.clients.openWindow(destino));
});
