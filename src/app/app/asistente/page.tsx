"use client";
import { useRef, useState, useEffect } from "react";
import { IconoAsistente } from "@/components/Iconos";

type Turno = { rol: "usuario" | "asistente"; texto: string };

const SUGERENCIAS = [
  "Resúmeme cómo está la situación de gastos",
  "¿Qué intercambios de custodia hay esta semana?",
  "Ayúdame a redactar un mensaje para proponer un cambio de fin de semana",
  "¿Cómo exporto un informe para mi abogada?",
];

/** Asistente IA: entiende el contexto real del espacio familiar (con RLS). */
export default function PaginaAsistente() {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [texto, setTexto] = useState("");
  const [pensando, setPensando] = useState(false);
  const finLista = useRef<HTMLDivElement>(null);

  useEffect(() => {
    finLista.current?.scrollIntoView({ behavior: "smooth" });
  }, [turnos, pensando]);

  const preguntar = async (pregunta: string) => {
    if (!pregunta.trim() || pensando) return;
    const nuevos: Turno[] = [...turnos, { rol: "usuario", texto: pregunta }];
    setTurnos(nuevos);
    setTexto("");
    setPensando(true);
    try {
      const respuesta = await fetch("/api/ai/asistente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pregunta, historial: nuevos.slice(-10, -1) }),
      });
      const datos = await respuesta.json();
      setTurnos([...nuevos, {
        rol: "asistente",
        texto: datos.respuesta ?? datos.error ?? "No he podido responder. Inténtalo de nuevo.",
      }]);
    } catch {
      setTurnos([...nuevos, { rol: "asistente", texto: "Error de conexión. Inténtalo de nuevo." }]);
    }
    setPensando(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] md:h-[calc(100vh-5rem)]">
      <header className="pb-4">
        <h1 className="titulo-seccion">Asistente</h1>
        <p className="text-sm text-carbon-suave mt-1">
          Conoce vuestro calendario, gastos y diario. Neutral, práctico y disponible siempre.
        </p>
      </header>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {turnos.length === 0 && (
          <div className="tarjeta text-center py-8 space-y-4">
            <IconoAsistente className="w-8 h-8 mx-auto text-salvia-600" />
            <p className="text-sm text-carbon-suave max-w-md mx-auto">
              Pregúntame lo que quieras sobre vuestra coordinación. Algunos ejemplos:
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGERENCIAS.map((s) => (
                <button key={s} onClick={() => preguntar(s)}
                  className="chip bg-salvia-50 text-salvia-800 border border-salvia-200 hover:bg-salvia-100 py-1.5">
                  {s}
                </button>
              ))}
            </div>
            <p className="text-xs text-carbon-suave/80 max-w-md mx-auto">
              El asistente no es un abogado. Para decisiones legales, consulta con un profesional.
            </p>
          </div>
        )}
        {turnos.map((t, i) => (
          <div key={i} className={`flex ${t.rol === "usuario" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-tarjeta text-sm whitespace-pre-wrap ${
              t.rol === "usuario"
                ? "bg-salvia-700 text-crema-50 rounded-br-md"
                : "bg-white text-carbon rounded-bl-md"
            }`}>
              {t.texto}
            </div>
          </div>
        ))}
        {pensando && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl rounded-bl-md px-4 py-2.5 shadow-tarjeta text-sm text-carbon-suave">
              Pensando…
            </div>
          </div>
        )}
        <div ref={finLista} />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); preguntar(texto); }} className="flex gap-2 pt-3">
        <input className="campo" value={texto} onChange={(e) => setTexto(e.target.value)}
          placeholder="Escribe tu pregunta…" />
        <button className="boton-primario shrink-0" disabled={pensando || !texto.trim()}>
          Preguntar
        </button>
      </form>
    </div>
  );
}
