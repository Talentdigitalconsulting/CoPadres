import { NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/server";

/** RGPD — Derecho de portabilidad: exporta los datos del usuario en JSON. */
export async function GET() {
  const supabase = crearClienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { data: miembro } = await supabase
    .from("miembros_familia").select("familia_id").eq("usuario_id", user.id).maybeSingle();
  const fid = miembro?.familia_id;

  const [perfil, familia, hijos, eventos, solicitudes, gastos, mensajes, diario, notificaciones, auditoria] =
    await Promise.all([
      supabase.from("perfiles").select("*").eq("id", user.id).single(),
      fid ? supabase.from("familias").select("*").eq("id", fid).single() : Promise.resolve({ data: null }),
      fid ? supabase.from("hijos").select("*").eq("familia_id", fid) : Promise.resolve({ data: [] }),
      fid ? supabase.from("eventos_custodia").select("*").eq("familia_id", fid) : Promise.resolve({ data: [] }),
      fid ? supabase.from("solicitudes_cambio").select("*").eq("familia_id", fid) : Promise.resolve({ data: [] }),
      fid ? supabase.from("gastos").select("*").eq("familia_id", fid) : Promise.resolve({ data: [] }),
      fid ? supabase.from("mensajes").select("*").eq("familia_id", fid) : Promise.resolve({ data: [] }),
      fid ? supabase.from("diario").select("*").eq("familia_id", fid) : Promise.resolve({ data: [] }),
      supabase.from("notificaciones").select("*").eq("usuario_id", user.id),
      fid ? supabase.from("registro_auditoria").select("*").eq("familia_id", fid) : Promise.resolve({ data: [] }),
    ]);

  const exportacion = {
    generado_en: new Date().toISOString(),
    aplicacion: "CoPadres",
    perfil: perfil.data,
    familia: familia.data,
    hijos: hijos.data,
    eventos_custodia: eventos.data,
    solicitudes_cambio: solicitudes.data,
    gastos: gastos.data,
    mensajes: mensajes.data,
    diario: diario.data,
    notificaciones: notificaciones.data,
    registro_auditoria: auditoria.data,
  };

  return new NextResponse(JSON.stringify(exportacion, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="copadres-mis-datos.json"',
    },
  });
}
