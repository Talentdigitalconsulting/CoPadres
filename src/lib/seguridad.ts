/**
 * Utilidades de seguridad compartidas.
 */

/**
 * Devuelve una ruta interna segura para redirigir tras iniciar sesión.
 * Evita redirecciones abiertas a otros dominios (p. ej. "//malo.com", "/\\malo.com",
 * "https://malo.com" o "@malo.com").
 */
export function rutaSegura(destino: string | null | undefined, porDefecto = "/app") {
  if (!destino) return porDefecto;
  let d = destino;
  try {
    d = decodeURIComponent(destino);
  } catch {
    return porDefecto;
  }
  if (!d.startsWith("/") || d.startsWith("//") || d.startsWith("/\\") || /[\r\n\t]/.test(d)) return porDefecto;
  if (/^\/[^/]*:/.test(d)) return porDefecto;
  return d;
}

/** Tipos y tamaño máximo permitidos para los comprobantes de gastos. */
export const COMPROBANTE_MAX_BYTES = 10 * 1024 * 1024;
export const COMPROBANTE_TIPOS = [
  "image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "application/pdf",
];

export function validarComprobante(archivo: File): string | null {
  if (archivo.size > COMPROBANTE_MAX_BYTES) return "El comprobante supera los 10 MB.";
  if (archivo.type && !COMPROBANTE_TIPOS.includes(archivo.type))
    return "Formato no admitido. Usa una foto (JPG, PNG, WEBP, HEIC) o un PDF.";
  return null;
}

/**
 * Defensa contra CSRF en las rutas /api que modifican datos: si el navegador
 * envía cabecera Origin, debe ser la misma web. (Además las cookies de sesión
 * son SameSite=Lax, que ya impiden la mayoría de envíos desde otras webs.)
 */
export function origenPermitido(peticion: Request) {
  const origen = peticion.headers.get("origin");
  if (!origen) return true;
  try {
    const host = peticion.headers.get("x-forwarded-host") ?? peticion.headers.get("host");
    return new URL(origen).host === host;
  } catch {
    return false;
  }
}
