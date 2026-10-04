/** @type {import('next').NextConfig} */

// Cabeceras de seguridad para todas las respuestas.
// (La Content-Security-Policy con nonce se añade en middleware.ts.)
const cabecerasSeguridad = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-site" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(self), microphone=(), geolocation=(), payment=(), usb=(), " +
      "magnetometer=(), gyroscope=(), accelerometer=(), browsing-topics=()",
  },
];

// Las páginas privadas y las API nunca se guardan en cachés intermedias.
const sinCache = [
  { key: "Cache-Control", value: "private, no-store, max-age=0" },
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      // Avatares de Google y ficheros de Supabase Storage
      { protocol: "https", hostname: "**.googleusercontent.com" },
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
  headers: async () => [
    { source: "/(.*)", headers: cabecerasSeguridad },
    { source: "/app/:ruta*", headers: sinCache },
    { source: "/api/:ruta*", headers: sinCache },
    { source: "/auth/:ruta*", headers: sinCache },
    { source: "/onboarding", headers: sinCache },
    { source: "/invitacion", headers: sinCache },
    { source: "/restablecer", headers: sinCache },
  ],
};

export default nextConfig;
