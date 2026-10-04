import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { crearClienteServidor } from "@/lib/supabase/server";
import { dentroDelLimite, respuestaLimite } from "@/lib/limites";
import { origenPermitido } from "@/lib/seguridad";

/**
 * RGPD — Derecho de supresión: elimina la cuenta del usuario.
 * Nota jurídica importante: los mensajes y el registro de auditoría de la familia
 * NO se destruyen, porque el otro progenitor tiene interés legítimo en conservar
 * el registro (posible uso judicial). El perfil y el acceso sí se eliminan, y las
 * entradas quedan atribuidas a un usuario dado de baja.
 */
export async function POST(peticion: Request) {
  if (!origenPermitido(peticion)) return NextResponse.json({ error: "Origen no permitido" }, { status: 403 });
  const supabase = await crearClienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (!(await dentroDelLimite(supabase, "eliminar", 5, 3600))) return respuestaLimite();

  // Cliente administrador (service role): solo existe en el servidor.
  const administrador = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // 1) Se anonimiza el perfil (nombre, email y foto) para que no quede ningún dato identificativo.
  await administrador.from("perfiles")
    .update({ nombre: "Usuario dado de baja", email: null, avatar_url: null })
    .eq("id", user.id);
  // 2) Baja "suave" del usuario de autenticación: deja de poder entrar y se liberan su email
  //    y credenciales, pero los registros compartidos (mensajes, gastos) mantienen su integridad.
  const { error } = await administrador.auth.admin.deleteUser(user.id, true);
  if (error) {
    return NextResponse.json({ error: "No se pudo eliminar la cuenta." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
