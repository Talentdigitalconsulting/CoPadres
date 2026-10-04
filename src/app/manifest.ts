import type { MetadataRoute } from "next";

/**
 * Manifiesto de la app instalable (PWA). Es lo que permite «descargar» CoPadres
 * en Android (instalación directa) y en iPhone (Añadir a pantalla de inicio).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "CoPadres — Coordinación para padres separados",
    short_name: "CoPadres",
    description:
      "Calendario de custodia, gastos, mensajería con filtro de tono e informes para abogados.",
    start_url: "/app?source=pwa",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "portrait",
    background_color: "#faf6ee",
    theme_color: "#0b2559",
    lang: "es",
    dir: "ltr",
    categories: ["lifestyle", "productivity", "social"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-256.png", sizes: "256x256", type: "image/png", purpose: "any" },
      { src: "/icons/icon-384.png", sizes: "384x384", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      {
        name: "Calendario",
        short_name: "Calendario",
        url: "/app/calendario?source=pwa",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Gastos",
        short_name: "Gastos",
        url: "/app/gastos?source=pwa",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Mensajes",
        short_name: "Mensajes",
        url: "/app/mensajes?source=pwa",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
