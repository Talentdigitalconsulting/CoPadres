/* CoPadres — service worker
 * Objetivo: que la app sea instalable y que, sin conexión, muestre una pantalla
 * propia en lugar del error del navegador.
 *
 * Importante: NO se guardan respuestas de Supabase ni páginas con datos del
 * espacio familiar. Un caché de datos personales en el dispositivo sería una
 * superficie de ataque y contradiría la política de privacidad.
 */

const VERSION = "copadres-v2";
const ESTATICOS = [
  "/offline.html",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/marca/copadres-logo.png",
  "/manifest.webmanifest",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(VERSION).then((c) => c.addAll(ESTATICOS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  // Nada de otros orígenes (Supabase, Stripe, API de IA) pasa por el caché.
  if (url.origin !== self.location.origin) return;
  // Ni las API ni la zona privada.
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) return;

  // Navegación: red primero y, si falla, la pantalla «Sin conexión».
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).catch(() => caches.match("/offline.html")));
    return;
  }

  // Imágenes y tipografías propias: caché primero, con actualización en segundo plano.
  if (/\.(png|svg|webp|woff2?|ico)$/.test(url.pathname)) {
    e.respondWith(
      caches.match(req).then((hit) => {
        const red = fetch(req).then((res) => {
          if (res.ok) {
            const copia = res.clone();
            caches.open(VERSION).then((c) => c.put(req, copia));
          }
          return res;
        }).catch(() => hit);
        return hit || red;
      })
    );
  }
});

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
  // Solo se abren rutas de la propia app.
  const enlace = e.notification.data && e.notification.data.enlace;
  const destino = typeof enlace === "string" && enlace.startsWith("/") && !enlace.startsWith("//") ? enlace : "/app";
  e.waitUntil(self.clients.openWindow(destino));
});
