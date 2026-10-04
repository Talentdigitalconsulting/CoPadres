"use client";
import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { addDays, addWeeks, differenceInYears, format, isSameDay, parseISO, startOfISOWeek } from "date-fns";
import { es } from "date-fns/locale";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { useFamilia, nombreDe } from "@/lib/useFamilia";
import { useActividades } from "@/lib/useActividades";
import { colorHijo } from "@/lib/colores";
import { euros, fechaCorta } from "@/lib/utils";
import {
  aISO, custodiaDelDia, describirHorario, describirMeses, describirRecurrente, quienLleva, repartoConvenio,
  sesionesEnRango, type Sesion,
} from "@/lib/recurrencias";
import {
  CATEGORIAS_ACTIVIDAD, ESTADOS_RECURRENTE, type Actividad, type HorarioDia,
} from "@/lib/tipos";
import { IconoMas, IconoRepetir } from "@/components/Iconos";
import HojaInferior from "@/components/HojaInferior";
import AvisoMigracion from "@/components/AvisoMigracion";
import { SelectorDias, SelectorMeses } from "@/components/SelectoresRecurrencia";
import CamposRecurrente, { type DatosRecurrente } from "@/components/CamposRecurrente";

type Pestana = "agenda" | "diario" | "ficha";

type FormActividad = {
  nombre: string;
  categoria: Actividad["categoria"];
  hijo_id: string;
  horarios: HorarioDia[];
  frecuencia: Actividad["frecuencia"];
  fecha_inicio: string;
  fecha_fin: string;
  meses_sin_actividad: number[];
  lugar: string;
  contacto: string;
  notas: string;
  quien_lleva: string; // "" = según custodia
  conCoste: boolean;
  coste: DatosRecurrente;
};

/** Fechas del curso escolar en curso (15 sep – 20 jun). */
function cursoEscolar(hoy = new Date()) {
  const anio = hoy.getMonth() >= 6 ? hoy.getFullYear() : hoy.getFullYear() - 1;
  return { inicio: `${anio}-09-15`, fin: `${anio + 1}-06-20` };
}

function Hijos() {
  const params = useSearchParams();
  const { cargando, usuarioId, familia, miembros, hijos, otroProgenitor, recargar: recargarFamilia } = useFamilia();
  const { actividades, excepciones, eventos, recurrentes, faltaMigracion, recargar } = useActividades(familia?.id);

  const [hijoSel, setHijoSel] = useState<string>(params.get("hijo") ?? "todos");
  const [pestana, setPestana] = useState<Pestana>((params.get("pestana") as Pestana) ?? "agenda");
  const [semana, setSemana] = useState(startOfISOWeek(new Date()));
  const [aviso, setAviso] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  // Hojas
  const [form, setForm] = useState<FormActividad | null>(null);
  const [edicion, setEdicion] = useState<{ id: string; alcance: "serie" | "desde"; fechaCorte: string } | null>(null);
  const [detalle, setDetalle] = useState<Actividad | null>(null);
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [accionSesion, setAccionSesion] = useState<null | "cancelar" | "mover" | "quien" | "serie">(null);
  const [motivo, setMotivo] = useState("");
  const [mover, setMover] = useState({ fecha: "", inicio: "", fin: "" });
  const [quienNuevo, setQuienNuevo] = useState("");
  const [confirmarBorrar, setConfirmarBorrar] = useState(false);
  const [fechaFinalizar, setFechaFinalizar] = useState("");

  // Ficha del hijo
  const [ficha, setFicha] = useState<{ id: string; nombre: string; fecha_nacimiento: string; notas: string } | null>(null);

  const avisar = (t: string) => {
    setAviso(t);
    setTimeout(() => setAviso(null), 3000);
  };
  const primerNombre = (id: string | null | undefined) =>
    id === usuarioId ? "tú" : nombreDe(miembros, id).split(" ")[0];

  const visibles = useMemo(
    () => actividades.filter((a) => hijoSel === "todos" || a.hijo_id === hijoSel),
    [actividades, hijoSel]
  );
  const dias = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(semana, i)), [semana]);
  const sesiones = useMemo(
    () => sesionesEnRango(visibles, excepciones, semana, addDays(semana, 6)),
    [visibles, excepciones, semana]
  );

  if (cargando) return <p className="text-sm text-carbon-suave">Cargando…</p>;

  const hijoActual = hijos.find((h) => h.id === hijoSel) ?? null;

  /* ------------------------------ Formulario ------------------------------ */
  const costeInicial = (): DatosRecurrente => ({
    modo: "fija",
    importe: "",
    frecuencia: "mensual",
    dia_cobro: 1,
    meses_sin_cobro: [7, 8],
    pagado_por: usuarioId ?? "",
    reparto_pct: repartoConvenio(familia, usuarioId ?? ""),
    fecha_inicio: "",
    fecha_fin: "",
  });

  const abrirNueva = () => {
    const curso = cursoEscolar();
    setEdicion(null);
    setForm({
      nombre: "",
      categoria: "deporte",
      hijo_id: hijoSel !== "todos" ? hijoSel : hijos[0]?.id ?? "",
      horarios: [],
      frecuencia: "semanal",
      fecha_inicio: aISO(new Date()) > curso.inicio ? aISO(new Date()) : curso.inicio,
      fecha_fin: curso.fin,
      meses_sin_actividad: [7, 8],
      lugar: "",
      contacto: "",
      notas: "",
      quien_lleva: "",
      conCoste: false,
      coste: costeInicial(),
    });
  };

  const abrirEdicion = (a: Actividad, alcance: "serie" | "desde" = "serie", fechaCorte = "") => {
    setEdicion({ id: a.id, alcance, fechaCorte });
    setForm({
      nombre: a.nombre,
      categoria: a.categoria,
      hijo_id: a.hijo_id ?? "",
      horarios: a.horarios,
      frecuencia: a.frecuencia,
      fecha_inicio: alcance === "desde" ? fechaCorte : a.fecha_inicio,
      fecha_fin: a.fecha_fin ?? "",
      meses_sin_actividad: a.meses_sin_actividad,
      lugar: a.lugar ?? "",
      contacto: a.contacto ?? "",
      notas: a.notas ?? "",
      quien_lleva: a.quien_lleva ?? "",
      conCoste: false,
      coste: costeInicial(),
    });
  };

  // Mientras no se toquen, los meses sin cobro siguen a los meses sin actividad.
  const cambiarMesesActividad = (m: number[]) => {
    if (!form) return;
    const iguales = form.coste.meses_sin_cobro.join() === form.meses_sin_actividad.join();
    setForm({ ...form, meses_sin_actividad: m, coste: iguales ? { ...form.coste, meses_sin_cobro: m } : form.coste });
  };

  const resumenForm = (f: FormActividad) => {
    const hijo = hijos.find((h) => h.id === f.hijo_id)?.nombre ?? "";
    const partes = [
      f.nombre || "Actividad",
      hijo,
      f.horarios.length ? describirHorario(f.horarios) : "sin días elegidos",
      f.frecuencia === "quincenal" ? "cada 2 semanas" : null,
      `del ${fechaCorta(f.fecha_inicio)}${f.fecha_fin ? ` al ${fechaCorta(f.fecha_fin)}` : " en adelante"}`,
      f.meses_sin_actividad.length ? `sin actividad en ${describirMeses(f.meses_sin_actividad)}` : null,
    ];
    if (f.conCoste && Number(f.coste.importe) > 0) {
      partes.push(
        f.coste.modo === "por_sesion"
          ? `${euros(Number(f.coste.importe))} por sesión`
          : `${euros(Number(f.coste.importe))} ${f.coste.frecuencia === "mensual" ? "al mes" : f.coste.frecuencia} el día ${f.coste.dia_cobro}`
      );
      const otro = miembros.find((m) => m.id !== f.coste.pagado_por);
      if (otro) partes.push(`${otro.nombre?.split(" ")[0]} asume el ${f.coste.reparto_pct} %`);
    }
    return partes.filter(Boolean).join(" · ");
  };

  const guardarActividad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || !familia || !usuarioId) return;
    if (!form.horarios.length) return avisar("Elige al menos un día de la semana.");
    if (form.fecha_fin && form.fecha_fin < form.fecha_inicio) return avisar("La fecha de fin es anterior a la de inicio.");
    if (form.horarios.some((h) => h.fin <= h.inicio)) return avisar("Revisa las horas: el fin debe ser posterior al inicio.");
    setGuardando(true);
    const supabase = crearClienteNavegador();
    const datos = {
      nombre: form.nombre.trim(),
      categoria: form.categoria,
      hijo_id: form.hijo_id || null,
      horarios: form.horarios,
      frecuencia: form.frecuencia,
      fecha_inicio: form.fecha_inicio,
      fecha_fin: form.fecha_fin || null,
      meses_sin_actividad: form.meses_sin_actividad,
      lugar: form.lugar || null,
      contacto: form.contacto || null,
      notas: form.notas || null,
      quien_lleva: form.quien_lleva || null,
    };

    let error: { message: string } | null = null;
    if (edicion) {
      const original = actividades.find((a) => a.id === edicion.id)!;
      if (edicion.alcance === "desde" && edicion.fechaCorte > original.fecha_inicio) {
        // "Esta y las siguientes": se cierra la serie anterior el día antes y se crea una nueva.
        const r1 = await supabase.from("actividades")
          .update({ fecha_fin: aISO(addDays(parseISO(edicion.fechaCorte), -1)) }).eq("id", original.id);
        const r2 = await supabase.from("actividades").insert({
          ...datos, fecha_inicio: edicion.fechaCorte, familia_id: familia.id, creado_por: usuarioId,
        });
        error = r1.error ?? r2.error;
      } else {
        const r = await supabase.from("actividades").update(datos).eq("id", edicion.id);
        error = r.error;
      }
    } else {
      const { data: nueva, error: e1 } = await supabase.from("actividades")
        .insert({ ...datos, familia_id: familia.id, creado_por: usuarioId }).select().single();
      error = e1;
      if (!e1 && nueva && form.conCoste && Number(form.coste.importe) > 0) {
        const hayOtro = Boolean(otroProgenitor);
        const { error: e2 } = await supabase.from("gastos_recurrentes").insert({
          familia_id: familia.id,
          actividad_id: nueva.id,
          hijo_id: form.hijo_id || null,
          concepto: form.nombre.trim(),
          categoria: "actividades",
          modo: form.coste.modo,
          importe: Number(form.coste.importe),
          frecuencia: form.coste.frecuencia,
          dia_cobro: form.coste.dia_cobro,
          meses_sin_cobro: form.coste.meses_sin_cobro,
          fecha_inicio: form.fecha_inicio,
          fecha_fin: form.fecha_fin || null,
          pagado_por: form.coste.pagado_por || usuarioId,
          reparto_pct: form.coste.reparto_pct,
          // Con el otro progenitor dentro, la cuota es una propuesta que debe aceptar.
          estado: hayOtro ? "propuesto" : "activo",
          aprobado_por: hayOtro ? null : usuarioId,
          aprobado_en: hayOtro ? null : new Date().toISOString(),
          creado_por: usuarioId,
        });
        error = e2;
      }
    }
    setGuardando(false);
    if (error) return avisar("No se pudo guardar. Inténtalo de nuevo.");
    avisar(
      edicion
        ? "Actividad actualizada."
        : form.conCoste && otroProgenitor
        ? `Actividad guardada. ${otroProgenitor.nombre?.split(" ")[0]} recibirá la propuesta de cuota.`
        : "Actividad guardada."
    );
    setForm(null);
    setEdicion(null);
    setDetalle(null);
    setSesion(null);
    recargar();
  };

  /* ------------------------------ Sesiones ------------------------------ */
  const cerrarSesion = () => {
    setSesion(null);
    setAccionSesion(null);
    setMotivo("");
  };

  const crearExcepcion = async (extra: Record<string, unknown>) => {
    if (!sesion || !familia || !usuarioId) return;
    const supabase = crearClienteNavegador();
    const { error } = await supabase.from("actividad_excepciones").insert({
      actividad_id: sesion.actividad.id,
      familia_id: familia.id,
      fecha: sesion.fechaOriginal,
      motivo: motivo || null,
      creado_por: usuarioId,
      ...extra,
    });
    if (error) return avisar("No se pudo guardar el cambio.");
    avisar("Cambio registrado. El otro progenitor recibirá un aviso.");
    cerrarSesion();
    recargar();
  };

  const restablecerSesion = async () => {
    if (!sesion?.excepcion) return;
    const supabase = crearClienteNavegador();
    await supabase.from("actividad_excepciones").delete().eq("id", sesion.excepcion.id);
    avisar("Sesión restablecida.");
    cerrarSesion();
    recargar();
  };

  /* ------------------------------ Actividad ------------------------------ */
  const finalizarActividad = async () => {
    if (!detalle || !fechaFinalizar) return;
    if (fechaFinalizar < detalle.fecha_inicio) return avisar("La fecha es anterior al inicio de la actividad.");
    const supabase = crearClienteNavegador();
    await supabase.from("actividades").update({ fecha_fin: fechaFinalizar }).eq("id", detalle.id);
    avisar("Actividad finalizada. Recuerda revisar su cuota en Gastos → Recurrentes.");
    setDetalle(null);
    setFechaFinalizar("");
    recargar();
  };

  const eliminarActividad = async () => {
    if (!detalle) return;
    const supabase = crearClienteNavegador();
    await supabase.from("actividades").delete().eq("id", detalle.id);
    avisar("Actividad eliminada.");
    setDetalle(null);
    setConfirmarBorrar(false);
    recargar();
  };

  const guardarFicha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ficha) return;
    const supabase = crearClienteNavegador();
    await supabase.from("hijos").update({
      nombre: ficha.nombre.trim(),
      fecha_nacimiento: ficha.fecha_nacimiento || null,
      notas: ficha.notas || null,
    }).eq("id", ficha.id);
    setFicha(null);
    avisar("Ficha guardada.");
    recargarFamilia();
  };

  /* ------------------------------ Render ------------------------------ */
  const bloqueSesion = (s: Sesion) => {
    const color = colorHijo(hijos, s.actividad.hijo_id);
    const lleva = quienLleva(s, eventos);
    const hijo = hijos.find((h) => h.id === s.actividad.hijo_id);
    return (
      <button key={s.clave} type="button" onClick={() => setSesion(s)}
        className={`w-full text-left rounded-xl border px-3 py-2 transition-shadow hover:shadow-tarjeta ${color.bloque} ${
          s.estado === "cancelada" ? "opacity-60 bg-[repeating-linear-gradient(135deg,transparent,transparent_6px,rgba(38,37,31,0.05)_6px,rgba(38,37,31,0.05)_12px)]" : ""
        } ${s.estado === "movida" ? "border-dashed" : ""}`}>
        <p className="text-[11px] font-semibold opacity-80">{s.inicio}–{s.fin}</p>
        <p className={`text-sm font-semibold leading-snug ${s.estado === "cancelada" ? "line-through" : ""}`}>
          {s.actividad.nombre}
        </p>
        <p className="text-[11px] opacity-80 mt-0.5">
          {hijoSel === "todos" && hijo ? `${hijo.nombre} · ` : ""}
          {s.estado === "cancelada"
            ? "Cancelada"
            : s.estado === "movida"
            ? `Movida desde ${format(parseISO(s.fechaOriginal), "EEE d", { locale: es })}`
            : lleva
            ? lleva === usuarioId ? "Llevas tú" : `Lleva ${primerNombre(lleva)}`
            : "Sin asignar"}
        </p>
      </button>
    );
  };

  return (
    <div className="space-y-6">
      {aviso && (
        <div className="fixed top-16 md:top-6 right-4 z-[60] bg-salvia-800 text-crema-50 text-sm rounded-xl px-4 py-2.5 shadow-flotante">
          {aviso}
        </div>
      )}

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="titulo-seccion">Hijos</h1>
          <p className="text-sm text-carbon-suave mt-1">
            Sus actividades de cada semana, su diario y su ficha. Todo queda registrado para los dos.
          </p>
        </div>
        {pestana === "agenda" && !faltaMigracion && hijos.length > 0 && (
          <button className="boton-primario text-xs" onClick={abrirNueva}>
            <IconoMas className="w-4 h-4" /> Nueva actividad
          </button>
        )}
      </header>

      {/* Selector de hijo */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {[{ id: "todos", nombre: "Todos" }, ...hijos].map((h) => {
          const activo = hijoSel === h.id;
          const color = h.id === "todos" ? null : colorHijo(hijos, h.id);
          return (
            <button key={h.id} onClick={() => setHijoSel(h.id)}
              className={`flex items-center gap-2 rounded-full pl-1.5 pr-4 py-1.5 border text-sm shrink-0 transition-colors ${
                activo ? "border-salvia-700 bg-white shadow-tarjeta font-semibold" : "border-carbon-linea bg-white/60 text-carbon-suave"
              }`}>
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                color ? color.chip : "bg-carbon-linea text-carbon-claro"}`}>
                {h.nombre.slice(0, 1).toUpperCase()}
              </span>
              {h.nombre}
            </button>
          );
        })}
      </div>

      {/* Pestañas */}
      <div className="grid grid-cols-3 gap-1 bg-crema-200/70 p-1 rounded-xl max-w-md" role="tablist">
        {([
          ["agenda", "Agenda"],
          ["diario", "Diario"],
          ["ficha", "Ficha"],
        ] as const).map(([v, t]) => (
          <button key={v} role="tab" aria-selected={pestana === v} onClick={() => setPestana(v)}
            className={`h-9 rounded-lg text-sm font-semibold transition-colors ${
              pestana === v ? "bg-white shadow-tarjeta text-salvia-800" : "text-carbon-suave"
            }`}>
            {t}
          </button>
        ))}
      </div>

      {hijos.length === 0 && (
        <div className="tarjeta text-center py-10 space-y-3">
          <p className="text-sm text-carbon-suave">Aún no habéis añadido hijos al espacio.</p>
          <Link href="/app/ajustes?seccion=familia" className="boton-suave text-xs">Añadir en Ajustes</Link>
        </div>
      )}

      {/* ======================== AGENDA ======================== */}
      {pestana === "agenda" && hijos.length > 0 && (
        faltaMigracion ? <AvisoMigracion /> : (
          <>
            {/* Navegación de semana */}
            <div className="flex items-center justify-between gap-2">
              <button className="boton-secundario text-xs px-3" aria-label="Semana anterior"
                onClick={() => setSemana(addWeeks(semana, -1))}>←</button>
              <div className="text-center">
                <p className="font-display text-lg capitalize">
                  {format(semana, "d MMM", { locale: es })} – {format(addDays(semana, 6), "d MMM yyyy", { locale: es })}
                </p>
                {!isSameDay(semana, startOfISOWeek(new Date())) && (
                  <button className="text-xs text-salvia-700 font-semibold hover:underline"
                    onClick={() => setSemana(startOfISOWeek(new Date()))}>Volver a esta semana</button>
                )}
              </div>
              <button className="boton-secundario text-xs px-3" aria-label="Semana siguiente"
                onClick={() => setSemana(addWeeks(semana, 1))}>→</button>
            </div>

            {/* Rejilla semanal: columnas en escritorio, lista por días en móvil */}
            <div className="grid md:grid-cols-7 gap-2">
              {dias.map((d) => {
                const fecha = aISO(d);
                const delDia = sesiones.filter((s) => s.fecha === fecha);
                const custodia = custodiaDelDia(eventos, fecha, hijoSel !== "todos" ? hijoSel : null);
                const hoy = isSameDay(d, new Date());
                return (
                  <div key={fecha}
                    className={`rounded-tarjeta bg-white border p-2.5 md:min-h-40 ${
                      hoy ? "border-salvia-600" : "border-carbon-linea/60"} ${delDia.length === 0 ? "hidden md:block" : ""}`}>
                    <div className="flex md:flex-col items-center md:items-start justify-between gap-1 mb-2">
                      <p className={`text-xs font-semibold capitalize ${hoy ? "text-salvia-700" : "text-carbon-claro"}`}>
                        {format(d, "EEEE d", { locale: es })}{hoy && " · hoy"}
                      </p>
                      {custodia && (
                        <span className={`chip text-[10px] ${
                          custodia === usuarioId ? "bg-salvia-600 text-crema-50" : "bg-salvia-200 text-salvia-900"}`}>
                          {custodia === usuarioId ? "Contigo" : `Con ${primerNombre(custodia)}`}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      {delDia.map((s) => bloqueSesion(s))}
                    </div>
                  </div>
                );
              })}
            </div>
            {sesiones.length === 0 && (
              <p className="text-sm text-carbon-suave text-center md:hidden">No hay actividades esta semana.</p>
            )}

            {/* Lista de actividades */}
            <section className="space-y-3">
              <h2 className="etiqueta">Actividades {hijoActual ? `de ${hijoActual.nombre}` : ""}</h2>
              {visibles.length === 0 ? (
                <div className="tarjeta text-center py-10 space-y-3">
                  <p className="text-sm text-carbon-suave max-w-sm mx-auto">
                    Añade sus clases y actividades una sola vez: se repetirán cada semana, con quién lleva según la custodia.
                  </p>
                  <button className="boton-primario text-xs" onClick={abrirNueva}>
                    <IconoMas className="w-4 h-4" /> Nueva actividad
                  </button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-3">
                  {visibles.map((a) => {
                    const color = colorHijo(hijos, a.hijo_id);
                    const coste = recurrentes.filter((r) => r.actividad_id === a.id);
                    const terminada = a.fecha_fin !== null && a.fecha_fin < aISO(new Date());
                    return (
                      <button key={a.id} onClick={() => setDetalle(a)}
                        className={`tarjeta text-left hover:shadow-flotante transition-shadow ${terminada ? "opacity-60" : ""}`}>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`w-2.5 h-2.5 rounded-full ${color.punto}`} />
                          <p className="font-semibold text-sm">{a.nombre}</p>
                          <span className="chip bg-crema-200 text-carbon-suave">{CATEGORIAS_ACTIVIDAD[a.categoria]}</span>
                          {hijoSel === "todos" && (
                            <span className={`chip ${color.chip}`}>{hijos.find((h) => h.id === a.hijo_id)?.nombre}</span>
                          )}
                          {terminada && <span className="chip bg-crema-200 text-carbon-suave">Finalizada</span>}
                        </div>
                        <p className="text-sm text-carbon-claro mt-2">
                          {describirHorario(a.horarios)}{a.frecuencia === "quincenal" && " · cada 2 semanas"}
                        </p>
                        <p className="text-xs text-carbon-suave mt-1">
                          {fechaCorta(a.fecha_inicio)}{a.fecha_fin ? ` – ${fechaCorta(a.fecha_fin)}` : " en adelante"}
                          {a.meses_sin_actividad.length > 0 && ` · sin actividad en ${describirMeses(a.meses_sin_actividad)}`}
                          {a.lugar && ` · ${a.lugar}`}
                        </p>
                        {coste.map((r) => (
                          <p key={r.id} className="text-xs text-salvia-800 mt-2 flex items-center gap-1.5">
                            <IconoRepetir className="w-3.5 h-3.5" />
                            {describirRecurrente(r, euros)} · {ESTADOS_RECURRENTE[r.estado].toLowerCase()}
                          </p>
                        ))}
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )
      )}

      {/* ======================== DIARIO ======================== */}
      {pestana === "diario" && hijos.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-3">
          {(hijoActual ? [hijoActual] : hijos).map((h) => (
            <div key={h.id} className="tarjeta space-y-3">
              <p className="font-semibold text-sm">Diario de {h.nombre}</p>
              <p className="text-xs text-carbon-suave">Salud, medicación, colegio y actividades: los dos siempre al día.</p>
              <div className="flex gap-2 flex-wrap">
                <Link href={`/app/diario?hijo=${h.id}`} className="boton-secundario text-xs">Ver diario</Link>
                <Link href={`/app/diario?hijo=${h.id}&nuevo=1`} className="boton-suave text-xs">Nueva anotación</Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ======================== FICHA ======================== */}
      {pestana === "ficha" && hijos.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-3">
          {(hijoActual ? [hijoActual] : hijos).map((h) => {
            const color = colorHijo(hijos, h.id);
            const edad = h.fecha_nacimiento ? differenceInYears(new Date(), parseISO(h.fecha_nacimiento)) : null;
            return (
              <div key={h.id} className="tarjeta space-y-3">
                <div className="flex items-center gap-3">
                  <span className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${color.chip}`}>
                    {h.nombre.slice(0, 1).toUpperCase()}
                  </span>
                  <div>
                    <p className="font-display text-lg">{h.nombre}</p>
                    <p className="text-xs text-carbon-suave">
                      {h.fecha_nacimiento ? `${fechaCorta(h.fecha_nacimiento)} · ${edad} años` : "Sin fecha de nacimiento"}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-carbon-claro whitespace-pre-wrap">
                  {h.notas || "Sin datos todavía: alergias, medicación habitual, pediatra, colegio, tallas…"}
                </p>
                <p className="text-xs text-carbon-suave">
                  {actividades.filter((a) => a.hijo_id === h.id && (!a.fecha_fin || a.fecha_fin >= aISO(new Date()))).length} actividades en curso
                </p>
                <button className="boton-secundario text-xs" onClick={() => setFicha({
                  id: h.id, nombre: h.nombre, fecha_nacimiento: h.fecha_nacimiento ?? "", notas: h.notas ?? "",
                })}>Editar ficha</button>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================== HOJA: FORMULARIO ACTIVIDAD ======================== */}
      <HojaInferior abierta={form !== null} onCerrar={() => { setForm(null); setEdicion(null); }}
        titulo={edicion ? (edicion.alcance === "desde" ? "Editar desde esta fecha" : "Editar actividad") : "Nueva actividad"}>
        {form && (
          <form onSubmit={guardarActividad} className="space-y-5">
            {edicion?.alcance === "desde" && (
              <p className="text-xs text-carbon-suave bg-crema-100 rounded-xl p-3">
                Los cambios se aplicarán desde el {fechaCorta(edicion.fechaCorte)}. Las sesiones anteriores no cambian.
              </p>
            )}
            <div>
              <label className="etiqueta">Nombre</label>
              <input required className="campo" value={form.nombre} placeholder="Ej.: Judo / Clases particulares / Piano"
                onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            </div>
            <div>
              <label className="etiqueta">Tipo</label>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(CATEGORIAS_ACTIVIDAD).map(([v, t]) => (
                  <button key={v} type="button" onClick={() => setForm({ ...form, categoria: v as Actividad["categoria"] })}
                    className={`chip border py-1.5 px-3 ${form.categoria === v
                      ? "bg-salvia-700 text-crema-50 border-salvia-700"
                      : "bg-white text-carbon-suave border-carbon-linea"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="etiqueta">Hijo</label>
              <select className="campo" value={form.hijo_id} required
                onChange={(e) => setForm({ ...form, hijo_id: e.target.value })}>
                {hijos.map((h) => <option key={h.id} value={h.id}>{h.nombre}</option>)}
              </select>
            </div>

            <div>
              <label className="etiqueta">Días y horario</label>
              <SelectorDias valor={form.horarios} onCambio={(h) => setForm({ ...form, horarios: h })} />
            </div>
            <div>
              <label className="etiqueta">Se repite</label>
              <select className="campo" value={form.frecuencia}
                onChange={(e) => setForm({ ...form, frecuencia: e.target.value as Actividad["frecuencia"] })}>
                <option value="semanal">Cada semana</option>
                <option value="quincenal">Cada 2 semanas</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="etiqueta">Desde</label>
                <input type="date" required className="campo" value={form.fecha_inicio}
                  disabled={edicion?.alcance === "desde"}
                  onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })} />
              </div>
              <div>
                <label className="etiqueta">Hasta (opcional)</label>
                <input type="date" className="campo" value={form.fecha_fin}
                  onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })} />
              </div>
            </div>
            {!edicion && (
              <button type="button" className="text-xs text-salvia-700 font-semibold hover:underline -mt-3"
                onClick={() => { const c = cursoEscolar(); setForm({ ...form, fecha_inicio: c.inicio, fecha_fin: c.fin }); }}>
                Usar el curso escolar (15 sep – 20 jun)
              </button>
            )}
            <div>
              <label className="etiqueta">Meses sin actividad</label>
              <SelectorMeses valor={form.meses_sin_actividad} onCambio={cambiarMesesActividad} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="etiqueta">Lugar</label>
                <input className="campo" value={form.lugar} placeholder="Club, academia…"
                  onChange={(e) => setForm({ ...form, lugar: e.target.value })} />
              </div>
              <div>
                <label className="etiqueta">Contacto</label>
                <input className="campo" value={form.contacto} placeholder="Profesor/a y teléfono"
                  onChange={(e) => setForm({ ...form, contacto: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="etiqueta">¿Quién lleva y recoge?</label>
              <select className="campo" value={form.quien_lleva}
                onChange={(e) => setForm({ ...form, quien_lleva: e.target.value })}>
                <option value="">Según la custodia de cada día</option>
                {miembros.map((m) => <option key={m.id} value={m.id}>Siempre {m.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="etiqueta">Notas (opcional)</label>
              <textarea className="campo" rows={2} value={form.notas} placeholder="Llevar kimono y agua"
                onChange={(e) => setForm({ ...form, notas: e.target.value })} />
            </div>

            {!edicion && (
              <div className="rounded-tarjeta border border-carbon-linea p-4 space-y-4">
                <label className="flex items-center justify-between gap-3 cursor-pointer">
                  <span>
                    <span className="text-sm font-semibold block">¿Tiene coste?</span>
                    <span className="text-xs text-carbon-suave">Se creará una cuota que se registra sola cada periodo.</span>
                  </span>
                  <input type="checkbox" className="w-5 h-5 accent-salvia-700" checked={form.conCoste}
                    onChange={(e) => setForm({
                      ...form, conCoste: e.target.checked,
                      coste: { ...form.coste, meses_sin_cobro: form.meses_sin_actividad },
                    })} />
                </label>
                {form.conCoste && (
                  <CamposRecurrente valor={form.coste} onCambio={(c) => setForm({ ...form, coste: c })}
                    miembros={miembros} permitirPorSesion mostrarFechas={false}
                    repartoSegunConvenio={(p) => repartoConvenio(familia, p)} />
                )}
              </div>
            )}
            {edicion && (
              <p className="text-xs text-carbon-suave">
                Su cuota se gestiona en <Link href="/app/gastos?vista=recurrentes" className="underline">Gastos → Recurrentes</Link>.
              </p>
            )}

            <div className="bg-salvia-50 border border-salvia-200 rounded-xl p-3">
              <p className="etiqueta mb-1">Resumen</p>
              <p className="text-sm text-salvia-900">{resumenForm(form)}</p>
            </div>

            <div className="flex gap-2 justify-end">
              <button type="button" className="boton-secundario" onClick={() => { setForm(null); setEdicion(null); }}>Cancelar</button>
              <button className="boton-primario" disabled={guardando}>{guardando ? "Guardando…" : "Guardar actividad"}</button>
            </div>
          </form>
        )}
      </HojaInferior>

      {/* ======================== HOJA: DETALLE ACTIVIDAD ======================== */}
      <HojaInferior abierta={detalle !== null} onCerrar={() => { setDetalle(null); setConfirmarBorrar(false); setFechaFinalizar(""); }}
        titulo={detalle?.nombre ?? ""}>
        {detalle && (() => {
          const proximas = sesionesEnRango([detalle], excepciones, new Date(), addDays(new Date(), 90)).slice(0, 5);
          const coste = recurrentes.filter((r) => r.actividad_id === detalle.id);
          const tienePorSesion = coste.some((r) => r.modo === "por_sesion");
          return (
            <div className="space-y-4">
              <div className="text-sm space-y-1 text-carbon-claro">
                <p><strong>{hijos.find((h) => h.id === detalle.hijo_id)?.nombre}</strong> · {CATEGORIAS_ACTIVIDAD[detalle.categoria]}</p>
                <p>{describirHorario(detalle.horarios)}{detalle.frecuencia === "quincenal" && " · cada 2 semanas"}</p>
                <p className="text-xs text-carbon-suave">
                  {fechaCorta(detalle.fecha_inicio)}{detalle.fecha_fin ? ` – ${fechaCorta(detalle.fecha_fin)}` : " en adelante"}
                  {detalle.meses_sin_actividad.length > 0 && ` · sin actividad en ${describirMeses(detalle.meses_sin_actividad)}`}
                </p>
                {detalle.lugar && <p>Lugar: {detalle.lugar}</p>}
                {detalle.contacto && <p>Contacto: {detalle.contacto}</p>}
                {detalle.notas && <p className="text-xs">{detalle.notas}</p>}
                <p className="text-xs text-carbon-suave">
                  Lleva: {detalle.quien_lleva ? nombreDe(miembros, detalle.quien_lleva) : "según la custodia de cada día"}
                </p>
              </div>

              <div>
                <p className="etiqueta">Próximas sesiones</p>
                {proximas.length === 0 ? <p className="text-sm text-carbon-suave">No hay sesiones próximas.</p> : (
                  <ul className="divide-y divide-carbon-linea/70">
                    {proximas.map((s) => {
                      const lleva = quienLleva(s, eventos);
                      return (
                        <li key={s.clave} className="py-1.5 text-sm flex justify-between gap-2">
                          <span className={`first-letter:uppercase ${s.estado === "cancelada" ? "line-through text-carbon-suave" : ""}`}>
                            {format(parseISO(s.fecha), "EEE d MMM", { locale: es })} · {s.inicio}
                          </span>
                          <span className="text-xs text-carbon-suave">
                            {s.estado === "cancelada" ? "cancelada" : lleva ? (lleva === usuarioId ? "llevas tú" : `lleva ${primerNombre(lleva)}`) : ""}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div>
                <p className="etiqueta">Coste</p>
                {coste.length === 0 ? (
                  <p className="text-sm text-carbon-suave">
                    Sin cuota. Puedes añadirla en <Link href="/app/gastos?vista=recurrentes&nuevo=1" className="underline">Gastos → Recurrentes</Link>.
                  </p>
                ) : coste.map((r) => (
                  <Link key={r.id} href="/app/gastos?vista=recurrentes"
                    className="flex items-center gap-1.5 text-sm text-salvia-800 hover:underline">
                    <IconoRepetir className="w-4 h-4" /> {describirRecurrente(r, euros)} · {ESTADOS_RECURRENTE[r.estado].toLowerCase()}
                  </Link>
                ))}
              </div>

              <p className="text-[11px] text-carbon-suave">
                Creada por {nombreDe(miembros, detalle.creado_por).split(" ")[0]} · {fechaCorta(detalle.creado_en.slice(0, 10))}
              </p>

              {confirmarBorrar ? (
                <div className="bg-vino/5 border border-vino/30 rounded-xl p-3 space-y-2">
                  <p className="text-sm">
                    Se eliminará la actividad y todas sus sesiones de la agenda. {coste.length > 0 &&
                    "Su cuota no se borra: gestiónala en Gastos → Recurrentes."} El registro de auditoría conserva el historial.
                  </p>
                  <div className="flex gap-2">
                    <button className="boton-peligro text-xs" onClick={eliminarActividad}>Sí, eliminar</button>
                    <button className="boton-secundario text-xs" onClick={() => setConfirmarBorrar(false)}>No</button>
                  </div>
                </div>
              ) : fechaFinalizar !== "" ? (
                <div className="bg-crema-100 rounded-xl p-3 space-y-2">
                  <label className="etiqueta">Último día de actividad</label>
                  <input type="date" className="campo" value={fechaFinalizar} onChange={(e) => setFechaFinalizar(e.target.value)} />
                  <div className="flex gap-2">
                    <button className="boton-primario text-xs" onClick={finalizarActividad}>Finalizar</button>
                    <button className="boton-secundario text-xs" onClick={() => setFechaFinalizar("")}>Cancelar</button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 flex-wrap">
                  <button className="boton-primario text-xs" onClick={() => abrirEdicion(detalle)}>Editar</button>
                  {!tienePorSesion && (
                    <button className="boton-secundario text-xs"
                      onClick={() => abrirEdicion(detalle, "desde", aISO(new Date()) > detalle.fecha_inicio ? aISO(new Date()) : detalle.fecha_inicio)}>
                      Cambiar desde hoy
                    </button>
                  )}
                  <button className="boton-secundario text-xs" onClick={() => setFechaFinalizar(aISO(new Date()))}>Finalizar</button>
                  <button className="boton-secundario text-xs text-vino" onClick={() => setConfirmarBorrar(true)}>Eliminar</button>
                </div>
              )}
            </div>
          );
        })()}
      </HojaInferior>

      {/* ======================== HOJA: SESIÓN ======================== */}
      <HojaInferior abierta={sesion !== null} onCerrar={cerrarSesion} titulo={sesion?.actividad.nombre ?? ""}>
        {sesion && (() => {
          const lleva = quienLleva(sesion, eventos);
          const ex = sesion.excepcion;
          const porSesion = recurrentes.some((r) => r.actividad_id === sesion.actividad.id && r.modo === "por_sesion");
          return (
            <div className="space-y-4">
              <div className="text-sm text-carbon-claro space-y-1">
                <p className="first-letter:uppercase font-semibold">
                  {format(parseISO(sesion.fecha), "EEEE d 'de' MMMM", { locale: es })} · {sesion.inicio}–{sesion.fin}
                </p>
                <p>{hijos.find((h) => h.id === sesion.actividad.hijo_id)?.nombre}{sesion.actividad.lugar && ` · ${sesion.actividad.lugar}`}</p>
                <p>
                  {sesion.estado === "cancelada"
                    ? "Sesión cancelada"
                    : lleva ? (lleva === usuarioId ? "Llevas tú" : `Lleva ${nombreDe(miembros, lleva)}`)
                    : "Sin asignar (no hay custodia registrada ese día)"}
                </p>
                {ex && (
                  <p className="text-xs text-carbon-suave">
                    {ex.tipo === "cancelada" ? "Cancelada" : ex.tipo === "movida" ? `Movida desde el ${fechaCorta(ex.fecha)}` : "Cambio de quién lleva"}
                    {" "}por {nombreDe(miembros, ex.creado_por).split(" ")[0]}{ex.motivo && ` · «${ex.motivo}»`}
                  </p>
                )}
              </div>

              {accionSesion === null && (
                <div className="grid gap-2">
                  {ex ? (
                    <button className="boton-suave" onClick={restablecerSesion}>Restablecer como estaba</button>
                  ) : (
                    <>
                      <button className="boton-secundario justify-start" onClick={() => setAccionSesion("cancelar")}>
                        Cancelar esta sesión
                      </button>
                      <button className="boton-secundario justify-start" onClick={() => {
                        setMover({ fecha: sesion.fecha, inicio: sesion.inicio, fin: sesion.fin });
                        setAccionSesion("mover");
                      }}>Cambiar día u hora solo esta vez</button>
                      <button className="boton-secundario justify-start" onClick={() => {
                        setQuienNuevo(miembros.find((m) => m.id !== lleva)?.id ?? "");
                        setAccionSesion("quien");
                      }}>Cambiar quién lleva esta vez</button>
                    </>
                  )}
                  <button className="boton-secundario justify-start" onClick={() => setAccionSesion("serie")}>
                    Editar la serie…
                  </button>
                </div>
              )}

              {accionSesion === "cancelar" && (
                <div className="space-y-3">
                  <label className="etiqueta">Motivo (opcional, queda registrado)</label>
                  <input className="campo" value={motivo} onChange={(e) => setMotivo(e.target.value)}
                    placeholder="Ej.: Mateo tiene fiebre / festivo / viaje" />
                  {porSesion && (
                    <p className="text-xs text-carbon-suave">Se paga por sesión: la cuota de este mes se recalculará sin esta clase.</p>
                  )}
                  <div className="flex gap-2">
                    <button className="boton-primario text-xs" onClick={() => crearExcepcion({ tipo: "cancelada" })}>Cancelar sesión</button>
                    <button className="boton-secundario text-xs" onClick={() => setAccionSesion(null)}>Volver</button>
                  </div>
                </div>
              )}

              {accionSesion === "mover" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-3">
                      <label className="etiqueta">Nuevo día</label>
                      <input type="date" className="campo" value={mover.fecha} onChange={(e) => setMover({ ...mover, fecha: e.target.value })} />
                    </div>
                    <div className="col-span-3 grid grid-cols-2 gap-2">
                      <input type="time" className="campo" value={mover.inicio} aria-label="Hora de inicio"
                        onChange={(e) => setMover({ ...mover, inicio: e.target.value })} />
                      <input type="time" className="campo" value={mover.fin} aria-label="Hora de fin"
                        onChange={(e) => setMover({ ...mover, fin: e.target.value })} />
                    </div>
                  </div>
                  <input className="campo" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Motivo (opcional)" />
                  <div className="flex gap-2">
                    <button className="boton-primario text-xs" disabled={!mover.fecha || mover.fin <= mover.inicio}
                      onClick={() => crearExcepcion({ tipo: "movida", nueva_fecha: mover.fecha, hora_inicio: mover.inicio, hora_fin: mover.fin })}>
                      Guardar cambio
                    </button>
                    <button className="boton-secundario text-xs" onClick={() => setAccionSesion(null)}>Volver</button>
                  </div>
                </div>
              )}

              {accionSesion === "quien" && (
                <div className="space-y-3">
                  <select className="campo" value={quienNuevo} onChange={(e) => setQuienNuevo(e.target.value)}>
                    {miembros.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                  </select>
                  <input className="campo" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Motivo (opcional)" />
                  <div className="flex gap-2">
                    <button className="boton-primario text-xs" disabled={!quienNuevo}
                      onClick={() => crearExcepcion({ tipo: "cambio_quien_lleva", quien_lleva: quienNuevo })}>Guardar</button>
                    <button className="boton-secundario text-xs" onClick={() => setAccionSesion(null)}>Volver</button>
                  </div>
                </div>
              )}

              {accionSesion === "serie" && (
                <div className="space-y-2">
                  <p className="text-sm text-carbon-claro">¿Qué quieres cambiar?</p>
                  {!porSesion && (
                    <button className="boton-secundario w-full justify-start"
                      onClick={() => { const a = sesion.actividad; cerrarSesion(); abrirEdicion(a, "desde", sesion.fechaOriginal); }}>
                      Esta sesión y las siguientes
                    </button>
                  )}
                  <button className="boton-secundario w-full justify-start"
                    onClick={() => { const a = sesion.actividad; cerrarSesion(); abrirEdicion(a, "serie"); }}>
                    Toda la serie
                  </button>
                  <button className="text-xs text-carbon-suave hover:underline" onClick={() => setAccionSesion(null)}>Volver</button>
                </div>
              )}
            </div>
          );
        })()}
      </HojaInferior>

      {/* ======================== HOJA: FICHA ======================== */}
      <HojaInferior abierta={ficha !== null} onCerrar={() => setFicha(null)} titulo="Ficha del hijo">
        {ficha && (
          <form onSubmit={guardarFicha} className="space-y-4">
            <div>
              <label className="etiqueta">Nombre</label>
              <input required className="campo" value={ficha.nombre} onChange={(e) => setFicha({ ...ficha, nombre: e.target.value })} />
            </div>
            <div>
              <label className="etiqueta">Fecha de nacimiento</label>
              <input type="date" className="campo" value={ficha.fecha_nacimiento}
                onChange={(e) => setFicha({ ...ficha, fecha_nacimiento: e.target.value })} />
            </div>
            <div>
              <label className="etiqueta">Datos importantes</label>
              <textarea className="campo" rows={6} value={ficha.notas} onChange={(e) => setFicha({ ...ficha, notas: e.target.value })}
                placeholder={"Alergias: …\nMedicación habitual: …\nPediatra: …\nColegio y tutor/a: …\nTallas: …"} />
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" className="boton-secundario" onClick={() => setFicha(null)}>Cancelar</button>
              <button className="boton-primario">Guardar</button>
            </div>
          </form>
        )}
      </HojaInferior>
    </div>
  );
}

export default function PaginaHijos() {
  return (
    <Suspense>
      <Hijos />
    </Suspense>
  );
}
