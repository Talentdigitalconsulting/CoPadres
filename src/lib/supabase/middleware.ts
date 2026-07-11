import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type ListaCookies = { name: string; value: string; options?: CookieOptions }[];

/**
 * Refresca la sesión en cada petición y protege las rutas privadas (/app y /onboarding).
 */
export async function actualizarSesion(peticion: NextRequest) {
  let respuesta = NextResponse.next({ request: peticion });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => peticion.cookies.getAll(),
        setAll: (lista: ListaCookies) => {
          lista.forEach(({ name, value }) => peticion.cookies.set(name, value));
          respuesta = NextResponse.next({ request: peticion });
          lista.forEach(({ name, value, options }) => respuesta.cookies.set(name, value, options));
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const ruta = peticion.nextUrl.pathname;
  const esPrivada = ruta.startsWith("/app") || ruta.startsWith("/onboarding");

  if (esPrivada && !user) {
    const url = peticion.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("siguiente", ruta);
    return NextResponse.redirect(url);
  }

  return respuesta;
}
