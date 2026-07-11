import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { crearClienteServidor } from "@/lib/supabase/server";

/**
 * Filtro de tono IA: analiza el mensaje antes de enviarlo y, si es agresivo,
 * propone una reformulación serena. Usa el modelo más barato (Haiku):
 * es una tarea sencilla y así se controlan los costes de IA.
 */
const Entrada = z.object({ texto: z.string().min(1).max(2000) });

export async function POST(peticion: Request) {
  // Solo usuarios autenticados.
  const supabase = crearClienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const cuerpo = Entrada.safeParse(await peticion.json());
  if (!cuerpo.success) return NextResponse.json({ error: "Texto no válido" }, { status: 400 });

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const respuesta = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL_RAPIDO || "claude-3-5-haiku-latest",
      max_tokens: 400,
      system: `Eres el filtro de tono de CoPadres, una app de coordinación entre padres separados.
Analiza el mensaje que un progenitor va a enviar al otro. Tu único objetivo es reducir el conflicto
sin cambiar el contenido factual (fechas, importes, peticiones).

Responde SOLO con un JSON válido, sin nada más:
{"agresivo": true|false, "version_serena": "..."}

- "agresivo" es true si el mensaje contiene insultos, reproches, sarcasmo hostil, amenazas,
  acusaciones personales o un tono claramente beligerante.
- Si es agresivo, "version_serena" reformula el mensaje en un tono neutro, respetuoso y centrado
  en los hechos y en el bienestar de los hijos, conservando la petición o información original.
- Si NO es agresivo, "version_serena" debe ser una cadena vacía.`,
      messages: [{ role: "user", content: cuerpo.data.texto }],
    });

    const texto = respuesta.content[0].type === "text" ? respuesta.content[0].text : "{}";
    const inicioJson = texto.indexOf("{");
    const finJson = texto.lastIndexOf("}");
    const datos = JSON.parse(texto.slice(inicioJson, finJson + 1));

    return NextResponse.json({
      agresivo: Boolean(datos.agresivo),
      version_serena: typeof datos.version_serena === "string" ? datos.version_serena : "",
    });
  } catch {
    // Si la IA falla, no bloqueamos nunca el envío del mensaje.
    return NextResponse.json({ agresivo: false, version_serena: "" });
  }
}
