import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CoPadres — Coordinación para padres separados",
    short_name: "CoPadres",
    description:
      "Calendario de custodia, gastos, mensajería con filtro de tono e informes para abogados.",
    start_url: "/app",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0b2559",
    lang: "es",
    icons: [
      { src: "/icono-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icono-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icono-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
