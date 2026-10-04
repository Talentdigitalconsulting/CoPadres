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
  themeColor: "#0b2559",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/**
 * App instalable (PWA): se guarda el aviso de instalación en cuanto el navegador
 * lo ofrece (puede llegar antes de que React cargue) para que el botón
 * «Descargar versión móvil» instale con un toque, y se registra el service worker.
 */
const SCRIPT_PWA = `window.__copadresPrompt=null;
window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();window.__copadresPrompt=e;window.dispatchEvent(new Event("copadres:instalable"));});
window.addEventListener("appinstalled",function(){window.__copadresPrompt=null;});
if("serviceWorker" in navigator&&window.isSecureContext){window.addEventListener("load",function(){navigator.serviceWorker.register("/sw.js").catch(function(){});});}`;

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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Leer el nonce hace que cada página se genere con su propia CSP segura.
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html lang="es">
      <head>
        {/* Tipografías: Fredoka (logotipo y títulos) + Inter (texto) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
          nonce={nonce}
        />
        <link rel="alternate" type="text/plain" href="/llms.txt" title="Resumen para modelos de IA" />
        <meta name="mobile-web-app-capable" content="yes" />
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: SCRIPT_PWA }} />
      </head>
      <body>
        <JsonLd datos={ORGANIZACION} />
        {children}
        <BannerCookies />
      </body>
    </html>
  );
}
