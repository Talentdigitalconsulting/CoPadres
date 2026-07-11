"use client";
import { useEffect, useRef, useState } from "react";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { useFamilia, nombreDe } from "@/lib/useFamilia";
import { fechaHora } from "@/lib/utils";
import type { Mensaje } from "@/lib/tipos";

/**
 * Mensajería con filtro de tono IA:
 * antes de enviar, Claude revisa el mensaje y, si detecta un tono agresivo,
 * propone una versión serena. Tú decides cuál enviar. Los mensajes son
 * inmutables (no se pueden editar ni borrar): valor probatorio.
 */
export default function PaginaMensajes() {
  const { cargando, usuarioId, perfil, familia, miembros, otroProgenitor } = useFamilia();
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [sugerencia, setSugerencia] = useState<{ original: string; serena: string } | null>(null);
  const finLista = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!familia) return;
    const supabase = crearClienteNavegador();

    const cargar = async () => {
      const { data } = await supabase
        .from("mensajes").select("*").eq("familia_id", familia.id)
        .order("creado_en").limit(300);
      setMensajes((data as Mensaje[]) ?? []);
    };
    cargar();

    // Tiempo real: los mensajes nuevos aparecen al instante.
    const canal = supabase
      .channel("mensajes-chat")
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "mensajes", filter: `familia_id=eq.${familia.id}` },
        (payload) => setMensajes((previos) => [...previos, payload.new as Mensaje]))
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [familia]);

  useEffect(() => {
    finLista.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  const insertarMensaje = async (contenido: string, filtrado: boolean) => {
    if (!familia || !usuarioId) return;
    const supabase = crearClienteNavegador();
    await supabase.from("mensajes").insert({
      familia_id: familia.id,
      remitente_id: usuarioId,
      texto: contenido,
      filtrado_ia: filtrado,
    });
    setTexto("");
    setSugerencia(null);
  };

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    const contenido = texto.trim();
    if (!contenido || enviando) return;
    setEnviando(true);

    // Filtro de tono (si está activado en Ajustes).
    if (perfil?.filtro_tono) {
      try {
        const respuesta = await fetch("/api/ai/tono", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ texto: contenido }),
        });
        if (respuesta.ok) {
          const datos = await respuesta.json();
          if (datos.agresivo && datos.version_serena) {
            setSugerencia({ original: contenido, serena: datos.version_serena });
            setEnviando(false);
            return; // El usuario decide cuál enviar.
          }
        }
      } catch {
        // Si la IA no responde, el mensaje se envía tal cual: nunca bloqueamos la comunicación.
      }
    }

    await insertarMensaje(contenido, false);
    setEnviando(false);
  };

  if (cargando) return <p className="text-sm text-carbon-suave">Cargando…</p>;

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] md:h-[calc(100vh-5rem)]">
      <header className="pb-4">
        <h1 className="titulo-seccion">Mensajes</h1>
        <p className="text-sm text-carbon-suave mt-1">
          {otroProgenitor
            ? `Conversación con ${otroProgenitor.nombre}. Registro íntegro e inalterable.`
            : "Cuando el otro progenitor se una, podréis conversar aquí."}
          {perfil?.filtro_tono && " · Filtro de tono activado"}
        </p>
      </header>

      {/* Hilo de mensajes */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {mensajes.length === 0 && (
          <div className="tarjeta text-center py-10">
            <p className="text-sm text-carbon-suave">
              Aún no hay mensajes. Este canal deja constancia escrita de todos los acuerdos.
            </p>
          </div>
        )}
        {mensajes.map((m) => {
          const mio = m.remitente_id === usuarioId;
          return (
            <div key={m.id} className={`flex ${mio ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-tarjeta ${
                mio ? "bg-salvia-700 text-crema-50 rounded-br-md" : "bg-white text-carbon rounded-bl-md"
              }`}>
                <p className="text-sm whitespace-pre-wrap break-words">{m.texto}</p>
                <p className={`text-[10px] mt-1 ${mio ? "text-salvia-200" : "text-carbon-suave"}`}>
                  {!mio && `${nombreDe(miembros, m.remitente_id).split(" ")[0]} · `}
                  {fechaHora(m.creado_en)}
                  {m.filtrado_ia && " · redactado con ayuda del filtro de tono"}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={finLista} />
      </div>

      {/* Sugerencia del filtro de tono */}
      {sugerencia && (
        <div className="tarjeta bg-salvia-50 border-salvia-300 my-3 space-y-3">
          <p className="text-xs font-semibold text-salvia-800">
            El filtro de tono sugiere una versión más serena. Piénsalo un segundo: todo queda registrado.
          </p>
          <div className="text-sm bg-white rounded-xl p-3 border border-carbon-linea/60">
            {sugerencia.serena}
          </div>
          <div className="flex gap-2 flex-wrap">
            <button className="boton-primario text-xs" onClick={() => insertarMensaje(sugerencia.serena, true)}>
              Enviar versión serena
            </button>
            <button className="boton-secundario text-xs" onClick={() => insertarMensaje(sugerencia.original, false)}>
              Enviar mi versión original
            </button>
            <button className="boton-secundario text-xs" onClick={() => setSugerencia(null)}>
              Seguir editando
            </button>
          </div>
        </div>
      )}

      {/* Caja de envío */}
      <form onSubmit={enviar} className="flex gap-2 pt-3">
        <input className="campo" value={texto} onChange={(e) => setTexto(e.target.value)}
          placeholder="Escribe un mensaje…" disabled={!otroProgenitor && mensajes.length === 0 && false} />
        <button className="boton-primario shrink-0" disabled={enviando || !texto.trim()}>
          {enviando ? "…" : "Enviar"}
        </button>
      </form>
    </div>
  );
}
