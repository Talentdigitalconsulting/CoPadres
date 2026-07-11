import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { crearClienteServidor } from "@/lib/supabase/server";

/**
 * Asistente IA de CoPadres: responde preguntas sobre la coordinación familiar
 * usando el contexto real del espacio (calendario, gastos, diario y solicitudes).
 * Los datos se consultan con la sesión del usuario, así que la RLS garantiza
 * que solo ve la información de su propia familia.
 */
const Entrada = z.object({
  pregunta: z.string().min(1).max(1000),
  historial: z
    .array(z.object({ rol: z.enum(["usuario", "asistente"]), texto: z.string().max(4000) }))
    .max(12)
    .optional(),
});

export async function POST(peticion: Request) {
  const supabase = crearClienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const cuerpo = Entrada.safeParse(await peticion.json());
  if (!cuerpo.success) return NextResponse.json({ error: "Petición no válida" }, { status: 400 });

  // Contexto del espacio familiar (limitado para controlar costes).
  const { data: miembro } = await supabase
    .from("miembros_familia").select("familia_id").eq("usuario_id", user.id).maybeSingle();
  if (!miembro) return NextResponse.json({ error: "Sin familia" }, { status: 400 });
  const fid = miembro.familia_id;

  const hoy = new Date().toISOString().slice(0, 10);
  const [familia, hijos, eventos, gastos, solicitudes, diario, perfiles] = await Promise.all([
    supabase.from("familias").select("nombre, reparto_gastos").eq("id", fid).single(),
    supabase.from("hijos").select("nombre, fecha_nacimiento").eq("familia_id", fid),
    supabase.from("eventos_custodia").select("titulo, tipo, fecha_inicio, fecha_fin, progenitor_id, notas")
      .eq("familia_id", fid).gte("fecha_fin", hoy).order("fecha_inicio").limit(30),
    supabase.from("gastos").select("concepto, categoria, importe, reparto_pct, estado, pagado_por, creado_en")
      .eq("familia_id", fid).order("creado_en", { ascending: false }).limit(40),
    supabase.from("solicitudes_cambio").select("descripcion, estado, creado_en, solicitado_por")
      .eq("familia_id", fid).order("creado_en", { ascending: false }).limit(15),
    supabase.from("diario").select("categoria, titulo, contenido, creado_en")
      .eq("familia_id", fid).order("creado_en", { ascending: false }).limit(30),
    supabase.from("perfiles").select("id, nombre"),
  ]);

  const nombreDe = (id: string | null) =>
    perfiles.data?.find((p) => p.id === id)?.nombre ?? "un progenitor";

  const contexto = {
    hoy,
    usuario_actual: nombreDe(user.id),
    familia: familia.data,
    hijos: hijos.data,
    proximos_eventos: eventos.data?.map((e) => ({ ...e, con: nombreDe(e.progenitor_id) })),
    gastos_recientes: gastos.data?.map((g) => ({ ...g, pagado_por: nombreDe(g.pagado_por) })),
    solicitudes_cambio: solicitudes.data?.map((s) => ({ ...s, solicitado_por: nombreDe(s.solicitado_por) })),
    diario_reciente: diario.data,
  };

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const historial = (cuerpo.data.historial ?? []).map((m) => ({
      role: m.rol === "usuario" ? ("user" as const) : ("assistant" as const),
      content: m.texto,
    }));

    const respuesta = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL_ASISTENTE || "claude-3-5-haiku-latest",
      max_tokens: 900,
      system: `Eres el asistente de CoPadres, una app española de coordinación para padres separados.
Hablas SIEMPRE en español, con un tono sereno, práctico y neutral: nunca tomas partido por
ninguno de los progenitores y siempre pones el bienestar de los hijos en el centro.

Puedes: resumir la situación (gastos pendientes, saldo, próximos intercambios), ayudar a redactar
mensajes serenos, sugerir cómo organizar vacaciones o gastos, y explicar cómo usar la app.
No eres abogado: si te preguntan cuestiones legales, da orientación general y recomienda
consultar con un abogado de familia o mediador.

Datos actuales del espacio familiar del usuario (JSON):
${JSON.stringify(contexto)}`,
      messages: [...historial, { role: "user", content: cuerpo.data.pregunta }],
    });

    const texto = respuesta.content[0].type === "text" ? respuesta.content[0].text : "";
    return NextResponse.json({ respuesta: texto });
  } catch {
    return NextResponse.json(
      { error: "El asistente no está disponible ahora mismo. Inténtalo en unos minutos." },
      { status: 500 }
    );
  }
}
