import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { crearClienteServidor } from "@/lib/supabase/server";

/**
 * RGPD — Derecho de supresión: elimina la cuenta del usuario.
 * Nota jurídica importante: los mensajes y el registro de auditoría de la familia
 * NO se destruyen, porque el otro progenitor tiene interés legítimo en conservar
 * el registro (posible uso judicial). El perfil y el acceso sí se eliminan, y las
 * entradas quedan atribuidas a un usuario dado de baja.
 */
export async function POST() {
  const supabase = crearClienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  // Cliente administrador (service role): solo existe en el servidor.
  const administrador = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { error } = await administrador.auth.admin.deleteUser(user.id);
  if (error) {
    return NextResponse.json({ error: "No se pudo eliminar la cuenta." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
