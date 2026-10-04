import { NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/server";
import { rutaSegura } from "@/lib/seguridad";

/**
 * Callback de autenticación: intercambia el código de Google OAuth,
 * de la confirmación de email o de la recuperación de contraseña por una sesión.
 * El destino se valida para impedir redirecciones a webs externas.
 */
export async function GET(peticion: Request) {
  const { searchParams, origin } = new URL(peticion.url);
  const codigo = searchParams.get("code");
  const siguiente = rutaSegura(searchParams.get("siguiente"), "/app");

  if (codigo) {
    const supabase = await crearClienteServidor();
    const { error } = await supabase.auth.exchangeCodeForSession(codigo);
    if (!error) {
      return NextResponse.redirect(new URL(siguiente, origin));
    }
  }
  return NextResponse.redirect(new URL("/login?error=enlace_invalido", origin));
}
