import type { Metadata, Viewport } from "next";
import "./globals.css";
import BannerCookies from "@/components/BannerCookies";

export const metadata: Metadata = {
  title: {
    default: "CoPadres — Coordinación serena para padres separados",
    template: "%s · CoPadres",
  },
  description:
    "Calendario de custodia, gastos compartidos, mensajería con filtro de tono e informes para abogados. Todo documentado, todo en paz.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "CoPadres", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#445937",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        {/* Tipografías: Fraunces (títulos) + Inter (texto) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <BannerCookies />
      </body>
    </html>
  );
}
