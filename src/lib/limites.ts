import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Límite de uso por usuario (rate limiting) guardado en la base de datos,
 * así funciona igual aunque Vercel reparta las peticiones entre varias instancias.
 * Si la migración 003 aún no está aplicada, no bloquea (falla en abierto).
 */
export async function dentroDelLimite(
  supabase: SupabaseClient,
  accion: string,
  maximo: number,
  segundos: number,
  origen?: string | null
) {
  const { data, error } = await supabase.rpc("consumir_limite", {
    p_accion: accion,
    p_max: maximo,
    p_segundos: segundos,
    p_origen: origen ?? null,
  });
  if (error) return true;
  return data !== false;
}

export function respuestaLimite() {
  return NextResponse.json(
    { error: "Has hecho demasiadas peticiones seguidas. Espera unos minutos y vuelve a intentarlo." },
    { status: 429, headers: { "Retry-After": "600" } }
  );
}
