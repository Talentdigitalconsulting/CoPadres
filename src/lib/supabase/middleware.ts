import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { rutaSegura } from "@/lib/seguridad";

type ListaCookies = { name: string; value: string; options?: CookieOptions }[];

/**
 * Política de seguridad de contenidos (CSP) con "nonce" por petición:
 * solo se ejecutan los scripts que lleva la propia página. Bloquea la
 * inyección de scripts (XSS), el uso de la web dentro de iframes ajenos
 * (clickjacking) y las conexiones a dominios no autorizados.
 */
export function construirCSP(nonce: string) {
  const dev = process.env.NODE_ENV !== "production";
  let supabase = "";
  try {
    supabase = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").origin;
  } catch {
    supabase = "";
  }
  const supabaseWs = supabase.replace(/^http/, "ws");
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    `img-src 'self' data: blob: ${supabase} https://*.googleusercontent.com`.trim(),
    `connect-src 'self' ${supabase} ${supabaseWs} https://api.pwnedpasswords.com${dev ? " ws://localhost:*" : ""}`.replace(/\s+/g, " "),
    "frame-src 'none'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "manifest-src 'self'",
    "worker-src 'self'",
    dev ? "" : "upgrade-insecure-requests",
  ].filter(Boolean).join("; ");
}

/**
 * En cada petición:
 *  1. Genera el nonce y la CSP.
 *  2. Refresca la sesión de Supabase.
 *  3. Protege las rutas privadas (/app y /onboarding): exige sesión y,
 *     si la cuenta tiene verificación en dos pasos, el código 2FA.
 */
export async function actualizarSesion(peticion: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const csp = construirCSP(nonce);

  const cabecerasPeticion = new Headers(peticion.headers);
  cabecerasPeticion.set("x-nonce", nonce);
  cabecerasPeticion.set("Content-Security-Policy", csp);

  const siguiente = () => NextResponse.next({ request: { headers: cabecerasPeticion } });
  let respuesta = siguiente();

  const ruta = peticion.nextUrl.pathname;
  const esPrivada = ruta.startsWith("/app") || ruta.startsWith("/onboarding");

  // Sin Supabase configurado (p. ej. durante el build) no hay sesión que refrescar.
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll: () => peticion.cookies.getAll(),
          setAll: (lista: ListaCookies) => {
            lista.forEach(({ name, value }) => peticion.cookies.set(name, value));
            respuesta = siguiente();
            lista.forEach(({ name, value, options }) => respuesta.cookies.set(name, value, options));
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (esPrivada && !user) {
      const url = peticion.nextUrl.clone();
      url.pathname = "/login";
      url.search = "";
      url.searchParams.set("siguiente", rutaSegura(ruta + peticion.nextUrl.search));
      return NextResponse.redirect(url);
    }

    // Verificación en dos pasos: si la cuenta la tiene activa y aún no se ha
    // introducido el código en esta sesión, se pide antes de entrar.
    if (esPrivada && user) {
      let nivel: { currentLevel: string | null; nextLevel: string | null } | null = null;
      try {
        ({ data: nivel } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel());
      } catch {
        // Token dañado o manipulado: se pide iniciar sesión de nuevo.
        const url = peticion.nextUrl.clone();
        url.pathname = "/login";
        url.search = "";
        return NextResponse.redirect(url);
      }
      if (nivel && nivel.nextLevel === "aal2" && nivel.currentLevel !== "aal2") {
        const url = peticion.nextUrl.clone();
        url.pathname = "/login";
        url.search = "";
        url.searchParams.set("mfa", "1");
        url.searchParams.set("siguiente", rutaSegura(ruta));
        return NextResponse.redirect(url);
      }
    }
  } else if (esPrivada) {
    const url = peticion.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  respuesta.headers.set("Content-Security-Policy", csp);
  return respuesta;
}
