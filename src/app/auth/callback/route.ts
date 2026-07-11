import { NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/server";

/**
 * Callback de autenticación: intercambia el código de Google OAuth,
 * de la confirmación de email o de la recuperación de contraseña por una sesión.
 */
export async function GET(peticion: Request) {
  const { searchParams, origin } = new URL(peticion.url);
  const codigo = searchParams.get("code");
  const siguiente = searchParams.get("siguiente") ?? "/app";

  if (codigo) {
    const supabase = crearClienteServidor();
    const { error } = await supabase.auth.exchangeCodeForSession(codigo);
    if (!error) {
      return NextResponse.redirect(`${origin}${siguiente}`);
    }
  }
  return NextResponse.redirect(`${origin}/login?error=enlace_invalido`);
}
