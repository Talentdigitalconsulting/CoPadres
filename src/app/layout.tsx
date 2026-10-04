import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "./globals.css";
import BannerCookies from "@/components/BannerCookies";
import JsonLd from "@/components/publico/JsonLd";
import { TITULAR, urlSitio } from "@/lib/legal";

const URL_SITIO = urlSitio();

export const metadata: Metadata = {
  metadataBase: new URL(URL_SITIO),
  title: {
    default: "CoPadres — App de coordinación para padres separados",
    template: "%s · CoPadres",
  },
  description:
    "App para padres y madres separados: calendario de custodia, gastos compartidos con reparto automático, " +
    "mensajes con filtro de tono, diario del menor e informes para abogados. Todo documentado, sin discutir.",
  applicationName: "CoPadres",
  keywords: [
    "app padres separados", "custodia compartida", "calendario de custodia", "gastos extraordinarios hijos",
    "coparentalidad", "convenio regulador", "comunicación con mi ex", "app divorcio", "mediación familiar",
  ],
  authors: [{ name: TITULAR.nombreComercial }],
  creator: TITULAR.nombreComercial,
  publisher: TITULAR.nombreComercial,
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "CoPadres", statusBarStyle: "default" },
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: "CoPadres",
    url: URL_SITIO,
    title: "CoPadres — Coordinaos por vuestros hijos, sin discutir",
    description:
      "Calendario de custodia, gastos, mensajes con filtro de tono y diario del menor en un espacio neutral donde todo queda documentado.",
  },
  twitter: {
    card: "summary_large_image",
    title: "CoPadres — App de coordinación para padres separados",
    description: "Calendario de custodia, gastos compartidos, mensajes sin conflicto e informes para abogados.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#445937",
  width: "device-width",
  initialScale: 1,
};

const ORGANIZACION = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${URL_SITIO}/#organizacion`,
      name: TITULAR.nombreComercial,
      url: URL_SITIO,
      logo: `${URL_SITIO}/marca/talent-digital-consulting.png`,
      email: TITULAR.email,
      founder: { "@type": "Person", name: TITULAR.nombre },
      address: {
        "@type": "PostalAddress",
        streetAddress: TITULAR.domicilio,
        postalCode: TITULAR.codigoPostal,
        addressLocality: TITULAR.localidad,
        addressRegion: TITULAR.provincia,
        addressCountry: "ES",
      },
    },
    {
      "@type": "WebSite",
      "@id": `${URL_SITIO}/#web`,
      url: URL_SITIO,
      name: "CoPadres",
      inLanguage: "es-ES",
      publisher: { "@id": `${URL_SITIO}/#organizacion` },
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Leer el nonce hace que cada página se genere con su propia CSP segura.
  const nonce = headers().get("x-nonce") ?? undefined;
  return (
    <html lang="es">
      <head>
        {/* Tipografías: Fraunces (títulos) + Inter (texto) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
          nonce={nonce}
        />
        <link rel="alternate" type="text/plain" href="/llms.txt" title="Resumen para modelos de IA" />
      </head>
      <body>
        <JsonLd datos={ORGANIZACION} />
        {children}
        <BannerCookies />
      </body>
    </html>
  );
}
