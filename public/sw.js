/* Service worker de CoPadres (PWA).
   Cache básico + soporte de notificaciones push para el futuro. */
const CACHE = "copadres-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

// Estrategia: red primero, caché como respaldo (solo GET de páginas).
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const copia = res.clone();
        caches.open(CACHE).then((c) => c.put(event.request, copia)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});

// Notificaciones push (cuando se configure un servidor de push).
self.addEventListener("push", (event) => {
  const datos = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(datos.titulo || "CoPadres", {
      body: datos.cuerpo || "Tienes una novedad en CoPadres.",
      icon: "/icono-192.png",
      data: { enlace: datos.enlace || "/app/notificaciones" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.enlace || "/app"));
});
