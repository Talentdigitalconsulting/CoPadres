"use client";
import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format,
  isSameDay, isSameMonth, isWithinInterval, parseISO, startOfMonth, startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { useFamilia, nombreDe } from "@/lib/useFamilia";
import { fechaCorta, fechaHora } from "@/lib/utils";
import { TIPOS_EVENTO, type EventoCustodia, type SolicitudCambio } from "@/lib/tipos";
import { IconoMas } from "@/components/Iconos";

function Calendario() {
  const params = useSearchParams();
  const { cargando, usuarioId, familia, miembros, hijos } = useFamilia();
  const [mes, setMes] = useState(new Date());
  const [eventos, setEventos] = useState<EventoCustodia[]>([]);
  const [solicitudes, setSolicitudes] = useState<SolicitudCambio[]>([]);
  const [diaSeleccionado, setDiaSeleccionado] = useState<Date>(new Date());
  const [mostrarFormulario, setMostrarFormulario] = useState(params.get("nuevo") === "1");
  const [mostrarSolicitud, setMostrarSolicitud] = useState(false);

  // Formulario de evento
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState<EventoCustodia["tipo"]>("custodia");
  const [inicio, setInicio] = useState(format(new Date(), "yyyy-MM-dd"));
  const [fin, setFin] = useState(format(new Date(), "yyyy-MM-dd"));
  const [progenitor, setProgenitor] = useState("");
  const [hijoId, setHijoId] = useState("");
  const [notas, setNotas] = useState("");

  // Formulario de solicitud de cambio
  const [descripcionSolicitud, setDescripcionSolicitud] = useState("");
  const [propInicio, setPropInicio] = useState("");
  const [propFin, setPropFin] = useState("");

  const cargarDatos = async () => {
    if (!familia) return;
    const supabase = crearClienteNavegador();
    const desde = format(startOfWeek(startOfMonth(mes), { weekStartsOn: 1 }), "yyyy-MM-dd");
    const hasta = format(endOfWeek(endOfMonth(mes), { weekStartsOn: 1 }), "yyyy-MM-dd");
    const [{ data: ev }, { data: sc }] = await Promise.all([
      supabase.from("eventos_custodia").select("*").eq("familia_id", familia.id)
        .lte("fecha_inicio", hasta).gte("fecha_fin", desde).order("fecha_inicio"),
      supabase.from("solicitudes_cambio").select("*").eq("familia_id", familia.id)
        .order("creado_en", { ascending: false }).limit(20),
    ]);
    setEventos((ev as EventoCustodia[]) ?? []);
    setSolicitudes((sc as SolicitudCambio[]) ?? []);
  };

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [familia, mes]);

  const dias = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(startOfMonth(mes), { weekStartsOn: 1 }),
        end: endOfWeek(endOfMonth(mes), { weekStartsOn: 1 }),
      }),
    [mes]
  );

  const eventosDelDia = (d: Date) =>
    eventos.filter((e) =>
      isWithinInterval(d, { start: parseISO(e.fecha_inicio), end: parseISO(e.fecha_fin) })
    );

  const colorEvento = (e: EventoCustodia) => {
    if (e.tipo !== "custodia") return "bg-arcilla/80";
    return e.progenitor_id === usuarioId ? "bg-salvia-600" : "bg-salvia-300";
  };

  const guardarEvento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!familia || !usuarioId) return;
    const supabase = crearClienteNavegador();
    await supabase.from("eventos_custodia").insert({
      familia_id: familia.id,
      titulo,
      tipo,
      fecha_inicio: inicio,
      fecha_fin: fin < inicio ? inicio : fin,
      progenitor_id: progenitor || null,
      hijo_id: hijoId || null,
      notas: notas || null,
      creado_por: usuarioId,
    });
    setTitulo(""); setNotas(""); setMostrarFormulario(false);
    cargarDatos();
  };

  const crearSolicitud = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!familia || !usuarioId) return;
    const supabase = crearClienteNavegador();
    await supabase.from("solicitudes_cambio").insert({
      familia_id: familia.id,
      descripcion: descripcionSolicitud,
      fecha_propuesta_inicio: propInicio || null,
      fecha_propuesta_fin: propFin || null,
      solicitado_por: usuarioId,
    });
    setDescripcionSolicitud(""); setPropInicio(""); setPropFin(""); setMostrarSolicitud(false);
    cargarDatos();
  };

  const responderSolicitud = async (s: SolicitudCambio, estado: "aceptada" | "rechazada") => {
    const supabase = crearClienteNavegador();
    await supabase.from("solicitudes_cambio").update({
      estado,
      respondido_por: usuarioId,
      respondido_en: new Date().toISOString(),
    }).eq("id", s.id);
    // Si se acepta y proponía fechas, se crea el evento correspondiente (sistema enlazado).
    if (estado === "aceptada" && s.fecha_propuesta_inicio && familia && usuarioId) {
      await supabase.from("eventos_custodia").insert({
        familia_id: familia.id,
        titulo: `Cambio acordado: ${s.descripcion.slice(0, 60)}`,
        tipo: "custodia",
        fecha_inicio: s.fecha_propuesta_inicio,
        fecha_fin: s.fecha_propuesta_fin || s.fecha_propuesta_inicio,
        progenitor_id: s.solicitado_por,
        creado_por: usuarioId,
      });
    }
    cargarDatos();
  };

  if (cargando) return <p className="text-sm text-carbon-suave">Cargando…</p>;

  const seleccionados = eventosDelDia(diaSeleccionado);
  const pendientes = solicitudes.filter((s) => s.estado === "pendiente");

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="titulo-seccion">Calendario de custodia</h1>
          <p className="text-sm text-carbon-suave mt-1">
            Cada evento y cada cambio quedan registrados con fecha, hora y autor.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="boton-secundario text-xs" onClick={() => setMostrarSolicitud(true)}>
            Solicitar cambio
          </button>
          <button className="boton-primario text-xs" onClick={() => setMostrarFormulario(true)}>
            <IconoMas className="w-4 h-4" /> Evento
          </button>
        </div>
      </header>

      {/* Solicitudes pendientes */}
      {pendientes.length > 0 && (
        <div className="tarjeta bg-crema-200/70 border-arcilla/30 space-y-3">
          <h2 className="font-semibold text-sm">Solicitudes de cambio pendientes</h2>
          {pendientes.map((s) => (
            <div key={s.id} className="bg-white rounded-xl p-4 border border-carbon-linea/60">
              <p className="text-sm">{s.descripcion}</p>
              <p className="text-xs text-carbon-suave mt-1">
                Solicitado por <strong>{nombreDe(miembros, s.solicitado_por)}</strong> el {fechaHora(s.creado_en)}
                {s.fecha_propuesta_inicio &&
                  ` · propone: ${fechaCorta(s.fecha_propuesta_inicio)}${
                    s.fecha_propuesta_fin ? " – " + fechaCorta(s.fecha_propuesta_fin) : ""
                  }`}
              </p>
              {s.solicitado_por !== usuarioId ? (
                <div className="flex gap-2 mt-3">
                  <button className="boton-primario text-xs" onClick={() => responderSolicitud(s, "aceptada")}>
                    Aceptar
                  </button>
                  <button className="boton-secundario text-xs" onClick={() => responderSolicitud(s, "rechazada")}>
                    Rechazar
                  </button>
                </div>
              ) : (
                <p className="text-xs text-carbon-suave italic mt-2">Esperando respuesta del otro progenitor.</p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Rejilla mensual */}
        <div className="tarjeta lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <button className="boton-secundario text-xs px-3" onClick={() => setMes(addMonths(mes, -1))}>←</button>
            <h2 className="font-display text-lg capitalize">
              {format(mes, "MMMM yyyy", { locale: es })}
            </h2>
            <button className="boton-secundario text-xs px-3" onClick={() => setMes(addMonths(mes, 1))}>→</button>
          </div>
          <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-carbon-suave mb-1">
            {["L", "M", "X", "J", "V", "S", "D"].map((d) => <span key={d}>{d}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {dias.map((d) => {
              const evs = eventosDelDia(d);
              const esHoy = isSameDay(d, new Date());
              const seleccionado = isSameDay(d, diaSeleccionado);
              return (
                <button key={d.toISOString()} onClick={() => setDiaSeleccionado(d)}
                  className={`aspect-square rounded-lg p-1 text-xs flex flex-col items-center gap-0.5 border transition-colors
                    ${seleccionado ? "border-salvia-600 bg-salvia-50" : "border-transparent hover:bg-crema-100"}
                    ${!isSameMonth(d, mes) ? "opacity-35" : ""}`}>
                  <span className={`w-6 h-6 flex items-center justify-center rounded-full
                    ${esHoy ? "bg-salvia-700 text-crema-50 font-bold" : ""}`}>
                    {format(d, "d")}
                  </span>
                  <span className="flex gap-0.5 flex-wrap justify-center">
                    {evs.slice(0, 3).map((e) => (
                      <span key={e.id} className={`w-1.5 h-1.5 rounded-full ${colorEvento(e)}`} />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-4 mt-4 text-xs text-carbon-suave">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-salvia-600" /> Contigo</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-salvia-300" /> Con el otro progenitor</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-arcilla/80" /> Citas y otros</span>
          </div>
        </div>

        {/* Detalle del día */}
        <div className="tarjeta">
          <h2 className="etiqueta">{format(diaSeleccionado, "EEEE d 'de' MMMM", { locale: es })}</h2>
          {seleccionados.length === 0 ? (
            <p className="text-sm text-carbon-suave">Sin eventos este día.</p>
          ) : (
            <ul className="space-y-3">
              {seleccionados.map((e) => (
                <li key={e.id} className="border-l-2 border-salvia-400 pl-3">
                  <p className="text-sm font-medium">{e.titulo}</p>
                  <p className="text-xs text-carbon-suave">
                    {TIPOS_EVENTO[e.tipo]}
                    {e.progenitor_id && ` · con ${nombreDe(miembros, e.progenitor_id).split(" ")[0]}`}
                    {e.hijo_id && ` · ${hijos.find((h) => h.id === e.hijo_id)?.nombre ?? ""}`}
                  </p>
                  {e.notas && <p className="text-xs text-carbon-claro mt-1">{e.notas}</p>}
                  <p className="text-[10px] text-carbon-suave/70 mt-1">
                    Añadido por {nombreDe(miembros, e.creado_por).split(" ")[0]} · {fechaCorta(e.creado_en.slice(0, 10))}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ---------- Formulario: nuevo evento ---------- */}
      {mostrarFormulario && (
        <div className="fixed inset-0 bg-carbon/40 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
          onClick={() => setMostrarFormulario(false)}>
          <form onSubmit={guardarEvento} onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-lg rounded-t-3xl md:rounded-tarjeta p-6 space-y-4 shadow-flotante max-h-[90vh] overflow-y-auto">
            <h2 className="font-display text-xl">Nuevo evento</h2>
            <div>
              <label className="etiqueta">Título</label>
              <input required className="campo" value={titulo} onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ej.: Semana con papá / Pediatra" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="etiqueta">Tipo</label>
                <select className="campo" value={tipo} onChange={(e) => setTipo(e.target.value as EventoCustodia["tipo"])}>
                  {Object.entries(TIPOS_EVENTO).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="etiqueta">¿Con quién?</label>
                <select className="campo" value={progenitor} onChange={(e) => setProgenitor(e.target.value)}>
                  <option value="">—</option>
                  {miembros.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="etiqueta">Desde</label>
                <input type="date" required className="campo" value={inicio} onChange={(e) => setInicio(e.target.value)} />
              </div>
              <div>
                <label className="etiqueta">Hasta</label>
                <input type="date" required className="campo" value={fin} onChange={(e) => setFin(e.target.value)} />
              </div>
            </div>
            {hijos.length > 0 && (
              <div>
                <label className="etiqueta">Hijo (opcional)</label>
                <select className="campo" value={hijoId} onChange={(e) => setHijoId(e.target.value)}>
                  <option value="">Todos</option>
                  {hijos.map((h) => <option key={h.id} value={h.id}>{h.nombre}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="etiqueta">Notas (opcional)</label>
              <textarea className="campo" rows={2} value={notas} onChange={(e) => setNotas(e.target.value)} />
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" className="boton-secundario" onClick={() => setMostrarFormulario(false)}>Cancelar</button>
              <button className="boton-primario">Guardar evento</button>
            </div>
          </form>
        </div>
      )}

      {/* ---------- Formulario: solicitud de cambio ---------- */}
      {mostrarSolicitud && (
        <div className="fixed inset-0 bg-carbon/40 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
          onClick={() => setMostrarSolicitud(false)}>
          <form onSubmit={crearSolicitud} onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-lg rounded-t-3xl md:rounded-tarjeta p-6 space-y-4 shadow-flotante">
            <h2 className="font-display text-xl">Solicitar un cambio</h2>
            <p className="text-xs text-carbon-suave">
              La solicitud quedará registrada con fecha y hora, igual que la respuesta. Si el otro
              progenitor la acepta con fechas propuestas, el evento se creará automáticamente.
            </p>
            <div>
              <label className="etiqueta">¿Qué cambio propones?</label>
              <textarea required className="campo" rows={3} value={descripcionSolicitud}
                onChange={(e) => setDescripcionSolicitud(e.target.value)}
                placeholder="Ej.: Cambiar el fin de semana del 24-25 por el del 31-1 por viaje de trabajo." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="etiqueta">Fecha propuesta (desde)</label>
                <input type="date" className="campo" value={propInicio} onChange={(e) => setPropInicio(e.target.value)} />
              </div>
              <div>
                <label className="etiqueta">Hasta</label>
                <input type="date" className="campo" value={propFin} onChange={(e) => setPropFin(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" className="boton-secundario" onClick={() => setMostrarSolicitud(false)}>Cancelar</button>
              <button className="boton-primario">Enviar solicitud</button>
            </div>
          </form>
        </div>
      )}

      {/* Historial de solicitudes respondidas */}
      {solicitudes.filter((s) => s.estado !== "pendiente").length > 0 && (
        <div className="tarjeta">
          <h2 className="etiqueta">Historial de solicitudes</h2>
          <ul className="divide-y divide-carbon-linea/70">
            {solicitudes.filter((s) => s.estado !== "pendiente").map((s) => (
              <li key={s.id} className="py-2.5 text-sm flex items-start justify-between gap-3">
                <div>
                  <p>{s.descripcion}</p>
                  <p className="text-xs text-carbon-suave mt-0.5">
                    {nombreDe(miembros, s.solicitado_por).split(" ")[0]} pidió el {fechaHora(s.creado_en)}
                    {s.respondido_en &&
                      ` · ${nombreDe(miembros, s.respondido_por).split(" ")[0]} respondió el ${fechaHora(s.respondido_en)}`}
                  </p>
                </div>
                <span className={`chip shrink-0 ${
                  s.estado === "aceptada" ? "bg-salvia-100 text-salvia-800" : "bg-crema-200 text-carbon-suave"
                }`}>
                  {s.estado}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function PaginaCalendario() {
  return (
    <Suspense>
      <Calendario />
    </Suspense>
  );
}
