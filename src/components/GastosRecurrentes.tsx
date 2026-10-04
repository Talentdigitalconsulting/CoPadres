"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { addMonths, endOfMonth, format, parseISO, startOfMonth } from "date-fns";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { nombreDe } from "@/lib/useFamilia";
import { useActividades, useRecurrentes } from "@/lib/useActividades";
import { euros, fechaCorta, fechaHora } from "@/lib/utils";
import {
  aISO, cambioAumentaCoste, describirMeses, describirRecurrente, enPausa, inicioTira, periodoDe,
  prevision12Meses, proximaCuota, repartoConvenio, sesionesDelMes, tiraCuotas, type CuotaMes,
} from "@/lib/recurrencias";
import {
  CATEGORIAS_GASTO, ESTADOS_RECURRENTE, FRECUENCIAS_GASTO, MESES_LARGOS,
  type CambioRecurrente, type Familia, type Gasto, type GastoRecurrente, type Hijo, type Perfil,
} from "@/lib/tipos";
import { colorHijo } from "@/lib/colores";
import HojaInferior from "@/components/HojaInferior";
import AvisoMigracion from "@/components/AvisoMigracion";
import TiraCuotas, { ETIQUETA_CUOTA, LeyendaCuotas } from "@/components/TiraCuotas";
import CamposRecurrente, { type DatosRecurrente } from "@/components/CamposRecurrente";
import { IconoMas, IconoRepetir } from "@/components/Iconos";

export type PrefillRecurrente = { concepto: string; importe: string; categoria: Gasto["categoria"]; hijo_id: string };

const COLOR_ESTADO: Record<GastoRecurrente["estado"], string> = {
  propuesto: "bg-crema-200 text-carbon-claro",
  activo: "bg-salvia-100 text-salvia-800",
  rechazado: "bg-vino/10 text-vino",
  finalizado: "bg-crema-200 text-carbon-suave",
};

const nombreMes = (d: Date) => `${MESES_LARGOS[d.getMonth()]} ${d.getFullYear()}`;

/** Opciones de mes (AAAA-MM) desde un mes dado. */
function opcionesMeses(desde: Date, n: number) {
  return Array.from({ length: n }, (_, i) => {
    const d = addMonths(startOfMonth(desde), i);
    return { valor: periodoDe(d), texto: nombreMes(d) };
  });
}

export default function GastosRecurrentes({
  familia, usuarioId, miembros, hijos, otroProgenitor, abrirNuevo, prefill, onCambio,
}: {
  familia: Familia;
  usuarioId: string;
  miembros: Perfil[];
  hijos: Hijo[];
  otroProgenitor: Perfil | null;
  abrirNuevo?: boolean;
  prefill?: PrefillRecurrente | null;
  onCambio?: () => void;
}) {
  const { cargando, faltaMigracion, recurrentes, omisiones, cuotas, recargar } = useRecurrentes(familia.id);
  const { actividades, excepciones } = useActividades(familia.id);
  const [aviso, setAviso] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  // Hojas
  const [nuevo, setNuevo] = useState<null | {
    concepto: string; hijo_id: string; categoria: Gasto["categoria"]; actividad_id: string; notas: string; datos: DatosRecurrente;
  }>(null);
  const [cuotaSel, setCuotaSel] = useState<{ r: GastoRecurrente; c: CuotaMes } | null>(null);
  const [motivo, setMotivo] = useState("");
  const [gestion, setGestion] = useState<GastoRecurrente | null>(null);
  const [modoGestion, setModoGestion] = useState<null | "editar" | "pausar" | "finalizar" | "eliminar">(null);
  const [edicion, setEdicion] = useState<DatosRecurrente | null>(null);
  const [pausa, setPausa] = useState({ desde: "", hasta: "" });
  const [ultimoMes, setUltimoMes] = useState("");
  const [rechazando, setRechazando] = useState<GastoRecurrente | null>(null);

  const avisar = (t: string) => {
    setAviso(t);
    setTimeout(() => setAviso(null), 3500);
  };
  const refrescar = () => {
    recargar();
    onCambio?.();
  };
  const primerNombre = (id: string | null | undefined) => (id === usuarioId ? "tú" : nombreDe(miembros, id).split(" ")[0]);

  const datosVacios = (): DatosRecurrente => ({
    modo: "fija",
    importe: "",
    frecuencia: "mensual",
    dia_cobro: 1,
    meses_sin_cobro: [],
    pagado_por: usuarioId,
    reparto_pct: repartoConvenio(familia, usuarioId),
    fecha_inicio: aISO(startOfMonth(new Date())),
    fecha_fin: "",
  });

  const abrirFormulario = (p?: PrefillRecurrente | null) =>
    setNuevo({
      concepto: p?.concepto ?? "",
      hijo_id: p?.hijo_id ?? "",
      categoria: p?.categoria ?? "actividades",
      actividad_id: "",
      notas: "",
      datos: { ...datosVacios(), importe: p?.importe ?? "" },
    });

  useEffect(() => {
    if (abrirNuevo || prefill) abrirFormulario(prefill);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abrirNuevo, prefill]);

  /** Importe estimado de un mes para cuotas "por sesión". */
  const estimador = (r: Pick<GastoRecurrente, "modo" | "actividad_id" | "importe">) => (mes: Date) => {
    if (r.modo !== "por_sesion") return Number(r.importe);
    const act = actividades.find((a) => a.id === r.actividad_id);
    return act ? sesionesDelMes(act, excepciones, mes) * Number(r.importe) : null;
  };

  /** Parte de un importe que le corresponde al usuario actual. */
  const miParte = (r: Pick<GastoRecurrente, "pagado_por" | "reparto_pct">, importe: number) =>
    r.pagado_por === usuarioId ? importe * (1 - r.reparto_pct / 100) : importe * (r.reparto_pct / 100);

  const resumen = useMemo(() => {
    const periodo = periodoDe(new Date());
    const delMes = cuotas.filter((g) => g.periodo === periodo && g.estado !== "anulado");
    const totalMes = delMes.reduce((t, g) => t + Number(g.importe), 0);
    const activos = recurrentes.filter((r) => r.estado === "activo" || r.estado === "finalizado");
    let prevision = 0;
    let previsionMia = 0;
    for (const r of activos) {
      const p = prevision12Meses(r, cuotas, omisiones, estimador(r));
      prevision += p;
      previsionMia += miParte(r, p);
    }
    return { cuotasMes: delMes.length, totalMes, prevision, previsionMia };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cuotas, recurrentes, omisiones, actividades, excepciones]);

  if (cargando) return <p className="text-sm text-carbon-suave">Cargando…</p>;
  if (faltaMigracion) return <AvisoMigracion />;

  /* ------------------------------ Acciones ------------------------------ */
  const crear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevo) return;
    if (nuevo.datos.modo === "por_sesion" && !nuevo.actividad_id)
      return avisar("Para pagar por sesión, vincula la cuota a una actividad.");
    setGuardando(true);
    const supabase = crearClienteNavegador();
    const hayOtro = Boolean(otroProgenitor);
    const { error } = await supabase.from("gastos_recurrentes").insert({
      familia_id: familia.id,
      actividad_id: nuevo.actividad_id || null,
      hijo_id: nuevo.hijo_id || null,
      concepto: nuevo.concepto.trim(),
      categoria: nuevo.categoria,
      modo: nuevo.datos.modo,
      importe: Number(nuevo.datos.importe),
      frecuencia: nuevo.datos.frecuencia,
      dia_cobro: nuevo.datos.dia_cobro,
      meses_sin_cobro: nuevo.datos.meses_sin_cobro,
      fecha_inicio: nuevo.datos.fecha_inicio,
      fecha_fin: nuevo.datos.fecha_fin || null,
      pagado_por: nuevo.datos.pagado_por,
      reparto_pct: nuevo.datos.reparto_pct,
      notas: nuevo.notas || null,
      estado: hayOtro ? "propuesto" : "activo",
      aprobado_por: hayOtro ? null : usuarioId,
      aprobado_en: hayOtro ? null : new Date().toISOString(),
      creado_por: usuarioId,
    });
    setGuardando(false);
    if (error) return avisar("No se pudo guardar. Inténtalo de nuevo.");
    setNuevo(null);
    avisar(hayOtro
      ? `Propuesta enviada. Cuando ${otroProgenitor?.nombre?.split(" ")[0]} la acepte, las cuotas se registrarán solas.`
      : "Gasto recurrente creado. Las cuotas se registrarán solas.");
    refrescar();
  };

  const responder = async (r: GastoRecurrente, aceptar: boolean) => {
    const supabase = crearClienteNavegador();
    await supabase.from("gastos_recurrentes").update(
      aceptar
        ? { estado: "activo", aprobado_por: usuarioId, aprobado_en: new Date().toISOString(), motivo_respuesta: null }
        : { estado: "rechazado", motivo_respuesta: motivo || null }
    ).eq("id", r.id);
    if (aceptar) await supabase.rpc("generar_cuotas", { fid: familia.id });
    setRechazando(null);
    setMotivo("");
    avisar(aceptar ? "Aceptado. Las cuotas se registrarán solas cada periodo." : "Propuesta rechazada.");
    refrescar();
  };

  const responderCambio = async (r: GastoRecurrente, aceptar: boolean) => {
    const supabase = crearClienteNavegador();
    await supabase.from("gastos_recurrentes").update({
      ...(aceptar ? r.cambio_propuesto : {}),
      cambio_propuesto: null, cambio_propuesto_por: null, cambio_propuesto_en: null,
    }).eq("id", r.id);
    avisar(aceptar ? "Cambio aceptado." : "Cambio rechazado. Se mantienen las condiciones anteriores.");
    refrescar();
  };

  const retirar = async (r: GastoRecurrente) => {
    const supabase = crearClienteNavegador();
    if (r.estado === "propuesto") await supabase.from("gastos_recurrentes").delete().eq("id", r.id);
    else await supabase.from("gastos_recurrentes")
      .update({ cambio_propuesto: null, cambio_propuesto_por: null, cambio_propuesto_en: null }).eq("id", r.id);
    avisar("Propuesta retirada.");
    refrescar();
  };

  const omitirCuota = async () => {
    if (!cuotaSel) return;
    const supabase = crearClienteNavegador();
    const { error } = await supabase.from("gastos_recurrentes_omisiones").insert({
      recurrente_id: cuotaSel.r.id, familia_id: familia.id, periodo: cuotaSel.c.periodo,
      motivo: motivo || null, creado_por: usuarioId,
    });
    if (error) return avisar("No se pudo guardar.");
    setCuotaSel(null);
    setMotivo("");
    avisar(`La cuota de ${nombreMes(cuotaSel.c.mes)} no se pagará. Se ha avisado al otro progenitor.`);
    refrescar();
  };

  const anularCuota = async () => {
    if (!cuotaSel?.c.gasto) return;
    const supabase = crearClienteNavegador();
    await supabase.from("gastos").update({
      estado: "anulado", motivo_anulacion: motivo || null,
      respondido_por: usuarioId, respondido_en: new Date().toISOString(),
    }).eq("id", cuotaSel.c.gasto.id);
    setCuotaSel(null);
    setMotivo("");
    avisar("Cuota anulada. Sigue visible en el historial, pero ya no cuenta en el saldo.");
    refrescar();
  };

  const abrirGestion = (r: GastoRecurrente) => {
    setGestion(r);
    setModoGestion(null);
    setEdicion({
      modo: r.modo, importe: String(r.importe), frecuencia: r.frecuencia, dia_cobro: r.dia_cobro,
      meses_sin_cobro: r.meses_sin_cobro, pagado_por: r.pagado_por, reparto_pct: r.reparto_pct,
      fecha_inicio: r.fecha_inicio, fecha_fin: r.fecha_fin ?? "",
    });
    setPausa({ desde: periodoDe(new Date()), hasta: "" });
    setUltimoMes(periodoDe(new Date()));
  };
  const cerrarGestion = () => {
    setGestion(null);
    setModoGestion(null);
  };

  const guardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gestion || !edicion) return;
    const nuevo = {
      importe: Number(edicion.importe),
      frecuencia: edicion.frecuencia,
      dia_cobro: edicion.dia_cobro,
      meses_sin_cobro: edicion.meses_sin_cobro,
      fecha_fin: edicion.fecha_fin || null,
      reparto_pct: edicion.reparto_pct,
    };
    const supabase = crearClienteNavegador();
    const necesitaAprobacion =
      gestion.estado === "activo" && Boolean(otroProgenitor) && cambioAumentaCoste(gestion, nuevo, usuarioId);
    if (necesitaAprobacion) {
      // Solo se guardan los campos que cambian; se aplican cuando el otro acepte.
      const cambio: CambioRecurrente = {};
      (Object.keys(nuevo) as (keyof typeof nuevo)[]).forEach((k) => {
        if (JSON.stringify(nuevo[k]) !== JSON.stringify(gestion[k])) (cambio as Record<string, unknown>)[k] = nuevo[k];
      });
      await supabase.from("gastos_recurrentes").update({
        cambio_propuesto: cambio, cambio_propuesto_por: usuarioId, cambio_propuesto_en: new Date().toISOString(),
      }).eq("id", gestion.id);
      avisar(`El cambio aumenta el coste: ${otroProgenitor?.nombre?.split(" ")[0]} debe aceptarlo. Mientras, se mantienen las condiciones actuales.`);
    } else {
      await supabase.from("gastos_recurrentes").update(nuevo).eq("id", gestion.id);
      avisar("Cambios guardados.");
    }
    cerrarGestion();
    refrescar();
  };

  const guardarPausa = async () => {
    if (!gestion || !pausa.desde) return;
    if (pausa.hasta && pausa.hasta < pausa.desde) return avisar("El final de la pausa es anterior al inicio.");
    const supabase = crearClienteNavegador();
    await supabase.from("gastos_recurrentes").update({
      pausa_desde: `${pausa.desde}-01`,
      pausa_hasta: pausa.hasta ? aISO(endOfMonth(parseISO(`${pausa.hasta}-01`))) : null,
    }).eq("id", gestion.id);
    avisar("Pausa guardada. Esos meses no se registrará cuota.");
    cerrarGestion();
    refrescar();
  };

  const reanudar = async (r: GastoRecurrente) => {
    const supabase = crearClienteNavegador();
    const inicioMes = aISO(startOfMonth(new Date()));
    // Si la pausa ya empezó, se cierra el mes anterior (el historial de la pausa se conserva).
    const cambios = r.pausa_desde && r.pausa_desde < inicioMes
      ? { pausa_hasta: aISO(endOfMonth(addMonths(new Date(), -1))) }
      : { pausa_desde: null, pausa_hasta: null };
    await supabase.from("gastos_recurrentes").update(cambios).eq("id", r.id);
    avisar("Cuota reanudada.");
    cerrarGestion();
    refrescar();
  };

  const finalizar = async () => {
    if (!gestion || !ultimoMes) return;
    const supabase = crearClienteNavegador();
    await supabase.from("gastos_recurrentes").update({
      fecha_fin: aISO(endOfMonth(parseISO(`${ultimoMes}-01`))), estado: "finalizado",
    }).eq("id", gestion.id);
    avisar(`Finalizado: la última cuota será la de ${nombreMes(parseISO(`${ultimoMes}-01`))}.`);
    cerrarGestion();
    refrescar();
  };

  const eliminar = async () => {
    if (!gestion) return;
    const supabase = crearClienteNavegador();
    await supabase.from("gastos_recurrentes").delete().eq("id", gestion.id);
    avisar("Gasto recurrente eliminado. Las cuotas ya registradas se conservan en el historial.");
    cerrarGestion();
    refrescar();
  };

  /* ------------------------------ Render ------------------------------ */
  const paraMi = recurrentes.filter(
    (r) => (r.estado === "propuesto" && r.creado_por !== usuarioId) ||
      (r.cambio_propuesto && r.cambio_propuesto_por !== usuarioId)
  );
  const visibles = recurrentes.filter((r) => r.estado !== "rechazado");
  const rechazados = recurrentes.filter((r) => r.estado === "rechazado");

  const describirCambio = (r: GastoRecurrente) => {
    const c = r.cambio_propuesto ?? {};
    const partes: string[] = [];
    if (c.importe !== undefined) partes.push(`Importe: ${euros(r.importe)} → ${euros(Number(c.importe))}`);
    if (c.frecuencia !== undefined) partes.push(`Frecuencia: ${FRECUENCIAS_GASTO[r.frecuencia]} → ${FRECUENCIAS_GASTO[c.frecuencia]}`);
    if (c.dia_cobro !== undefined) partes.push(`Día de cobro: ${r.dia_cobro} → ${c.dia_cobro}`);
    if (c.meses_sin_cobro !== undefined)
      partes.push(`Meses sin cobro: ${describirMeses(r.meses_sin_cobro) || "ninguno"} → ${describirMeses(c.meses_sin_cobro) || "ninguno"}`);
    if (c.fecha_fin !== undefined)
      partes.push(`Hasta: ${r.fecha_fin ? fechaCorta(r.fecha_fin) : "sin fin"} → ${c.fecha_fin ? fechaCorta(c.fecha_fin) : "sin fin"}`);
    if (c.reparto_pct !== undefined) partes.push(`Reparto: ${r.reparto_pct} % → ${c.reparto_pct} %`);
    return partes;
  };

  const previaNuevo = () => {
    if (!nuevo || !(Number(nuevo.datos.importe) > 0)) return null;
    const ficticio = {
      id: "nuevo", modo: nuevo.datos.modo, importe: Number(nuevo.datos.importe), frecuencia: nuevo.datos.frecuencia,
      dia_cobro: nuevo.datos.dia_cobro, meses_sin_cobro: nuevo.datos.meses_sin_cobro, fecha_inicio: nuevo.datos.fecha_inicio,
      fecha_fin: nuevo.datos.fecha_fin || null, pausa_desde: null, pausa_hasta: null, estado: "activo",
      actividad_id: nuevo.actividad_id || null, pagado_por: nuevo.datos.pagado_por, reparto_pct: nuevo.datos.reparto_pct,
    } as GastoRecurrente;
    const tira = tiraCuotas(ficticio, [], [], startOfMonth(parseISO(nuevo.datos.fecha_inicio)), new Date(0), estimador(ficticio));
    const conCuota = tira.filter((c) => c.estado === "proxima");
    const total = conCuota.reduce((t, c) => t + (c.importe ?? 0), 0);
    const otro = miembros.find((m) => m.id !== nuevo.datos.pagado_por);
    const parteOtro = total * (nuevo.datos.reparto_pct / 100);
    return { tira, n: conCuota.length, total, otro, parteOtro };
  };

  return (
    <div className="space-y-5">
      {aviso && (
        <div className="fixed top-16 md:top-6 right-4 left-4 md:left-auto md:max-w-sm z-60 bg-salvia-800 text-crema-50 text-sm rounded-xl px-4 py-2.5 shadow-flotante">
          {aviso}
        </div>
      )}

      {/* Resumen */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="tarjeta">
          <p className="etiqueta">Este mes</p>
          <p className="font-display text-2xl">{euros(resumen.totalMes)}</p>
          <p className="text-xs text-carbon-suave mt-1">
            {resumen.cuotasMes} cuota{resumen.cuotasMes === 1 ? "" : "s"} registrada{resumen.cuotasMes === 1 ? "" : "s"} en {MESES_LARGOS[new Date().getMonth()]}
          </p>
        </div>
        <div className="tarjeta">
          <p className="etiqueta">Previsión próximos 12 meses</p>
          <p className="font-display text-2xl">{euros(resumen.prevision)}</p>
          <p className="text-xs text-carbon-suave mt-1">Tu parte: {euros(resumen.previsionMia)}</p>
        </div>
      </div>

      {/* Pendiente de ti */}
      {paraMi.length > 0 && (
        <div className="tarjeta bg-crema-200/70 border-arcilla/30 space-y-3">
          <h2 className="font-semibold text-sm">Pendiente de ti</h2>
          {paraMi.map((r) => (
            <div key={r.id} className="bg-white rounded-xl p-4 border border-carbon-linea/60 space-y-2">
              {r.estado === "propuesto" ? (
                <>
                  <p className="text-sm">
                    <strong>{primerNombre(r.creado_por)}</strong> propone una cuota recurrente:{" "}
                    <strong>{r.concepto}</strong>
                    {r.hijo_id && ` de ${hijos.find((h) => h.id === r.hijo_id)?.nombre}`}
                  </p>
                  <p className="text-xs text-carbon-claro">
                    {describirRecurrente(r, euros)} · desde {fechaCorta(r.fecha_inicio)}
                    {r.fecha_fin && ` hasta ${fechaCorta(r.fecha_fin)}`} · paga {primerNombre(r.pagado_por)} ·{" "}
                    {r.pagado_por === usuarioId ? `reclamas el ${r.reparto_pct} %` : `te corresponde el ${r.reparto_pct} %`}
                  </p>
                  <p className="text-xs text-carbon-suave">Se aprueba una sola vez: después cada cuota se registra ya aprobada.</p>
                  <div className="flex gap-2 flex-wrap">
                    <button className="boton-primario text-xs" onClick={() => responder(r, true)}>Aceptar</button>
                    <button className="boton-secundario text-xs" onClick={() => { setRechazando(r); setMotivo(""); }}>Rechazar</button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm">
                    <strong>{primerNombre(r.cambio_propuesto_por)}</strong> propone cambiar <strong>{r.concepto}</strong>:
                  </p>
                  <ul className="text-xs text-carbon-claro list-disc pl-4">
                    {describirCambio(r).map((t) => <li key={t}>{t}</li>)}
                  </ul>
                  <div className="flex gap-2 flex-wrap">
                    <button className="boton-primario text-xs" onClick={() => responderCambio(r, true)}>Aceptar cambio</button>
                    <button className="boton-secundario text-xs" onClick={() => responderCambio(r, false)}>Rechazar</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <h2 className="etiqueta mb-0">Gastos recurrentes</h2>
        <button className="boton-primario text-xs" onClick={() => abrirFormulario()}>
          <IconoMas className="w-4 h-4" /> Nuevo recurrente
        </button>
      </div>

      {visibles.length === 0 ? (
        <div className="tarjeta text-center py-10 space-y-2">
          <p className="text-sm text-carbon-suave max-w-sm mx-auto">
            Cuotas que se repiten (judo, academia, comedor…): se configuran una vez y cada mes se registran solas.
          </p>
          <p className="text-xs text-carbon-suave">
            También puedes crearlas al añadir una actividad en <Link href="/app/hijos" className="underline">Hijos</Link>.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibles.map((r) => {
            const tira = tiraCuotas(r, cuotas, omisiones, inicioTira(r), new Date(), estimador(r));
            const prox = proximaCuota(r, omisiones, cuotas);
            const pausadoAhora = enPausa(r, new Date());
            const color = colorHijo(hijos, r.hijo_id);
            return (
              <div key={r.id} className="tarjeta space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <IconoRepetir className="w-4 h-4 text-salvia-700" />
                      <p className="font-semibold text-sm">{r.concepto}</p>
                      <span className={`chip ${COLOR_ESTADO[r.estado]}`}>
                        {pausadoAhora && r.estado === "activo" ? "En pausa" : ESTADOS_RECURRENTE[r.estado]}
                      </span>
                      {r.hijo_id && <span className={`chip ${color.chip}`}>{hijos.find((h) => h.id === r.hijo_id)?.nombre}</span>}
                    </div>
                    <p className="text-xs text-carbon-claro mt-1">{describirRecurrente(r, euros)}</p>
                    <p className="text-xs text-carbon-suave mt-0.5">
                      Paga {primerNombre(r.pagado_por)} ·{" "}
                      {r.pagado_por === usuarioId
                        ? `reclamas el ${r.reparto_pct} %`
                        : `te corresponde el ${r.reparto_pct} %`}
                      {r.estado === "propuesto" && r.creado_por === usuarioId &&
                        ` · esperando a ${otroProgenitor?.nombre?.split(" ")[0] ?? "el otro progenitor"}`}
                      {r.cambio_propuesto && r.cambio_propuesto_por === usuarioId && " · cambio pendiente de aceptar"}
                    </p>
                    {prox && r.estado === "activo" && (
                      <p className="text-xs text-salvia-800 mt-0.5">
                        Próxima cuota: {format(prox.cobro, "dd/MM/yyyy")} ({MESES_LARGOS[prox.mes.getMonth()]})
                      </p>
                    )}
                  </div>
                  <button className="boton-secundario text-xs shrink-0" onClick={() => abrirGestion(r)}>Gestionar</button>
                </div>
                <TiraCuotas cuotas={tira} onSeleccionar={(c) => { setCuotaSel({ r, c }); setMotivo(""); }} />
                {((r.estado === "propuesto" && r.creado_por === usuarioId) ||
                  (r.cambio_propuesto && r.cambio_propuesto_por === usuarioId)) && (
                  <button className="text-xs text-carbon-suave hover:underline" onClick={() => retirar(r)}>
                    Retirar propuesta
                  </button>
                )}
              </div>
            );
          })}
          <LeyendaCuotas />
        </div>
      )}

      {rechazados.length > 0 && (
        <details className="tarjeta">
          <summary className="text-sm font-semibold cursor-pointer">Propuestas rechazadas ({rechazados.length})</summary>
          <ul className="mt-3 space-y-2 text-sm">
            {rechazados.map((r) => (
              <li key={r.id} className="text-carbon-claro">
                {r.concepto} · {describirRecurrente(r, euros)}
                {r.motivo_respuesta && <span className="text-xs text-carbon-suave"> · «{r.motivo_respuesta}»</span>}
              </li>
            ))}
          </ul>
        </details>
      )}

      {/* ================= HOJA: NUEVO RECURRENTE ================= */}
      <HojaInferior abierta={nuevo !== null} onCerrar={() => setNuevo(null)} titulo="Nuevo gasto recurrente">
        {nuevo && (() => {
          const previa = previaNuevo();
          const actividadesHijo = actividades.filter((a) => !nuevo.hijo_id || a.hijo_id === nuevo.hijo_id);
          return (
            <form onSubmit={crear} className="space-y-4">
              <div>
                <label className="etiqueta">Concepto</label>
                <input required className="campo" value={nuevo.concepto} placeholder="Ej.: Cuota de judo / Comedor / Academia"
                  onChange={(e) => setNuevo({ ...nuevo, concepto: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="etiqueta">Hijo</label>
                  <select className="campo" value={nuevo.hijo_id}
                    onChange={(e) => setNuevo({ ...nuevo, hijo_id: e.target.value, actividad_id: "" })}>
                    <option value="">—</option>
                    {hijos.map((h) => <option key={h.id} value={h.id}>{h.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="etiqueta">Categoría</label>
                  <select className="campo" value={nuevo.categoria}
                    onChange={(e) => setNuevo({ ...nuevo, categoria: e.target.value as Gasto["categoria"] })}>
                    {Object.entries(CATEGORIAS_GASTO).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
                  </select>
                </div>
              </div>
              {actividadesHijo.length > 0 && (
                <div>
                  <label className="etiqueta">Actividad vinculada (opcional)</label>
                  <select className="campo" value={nuevo.actividad_id}
                    onChange={(e) => {
                      const act = actividades.find((a) => a.id === e.target.value);
                      setNuevo({
                        ...nuevo,
                        actividad_id: e.target.value,
                        concepto: nuevo.concepto || act?.nombre || "",
                        hijo_id: act?.hijo_id ?? nuevo.hijo_id,
                        datos: act
                          ? { ...nuevo.datos, meses_sin_cobro: act.meses_sin_actividad, fecha_inicio: act.fecha_inicio, fecha_fin: act.fecha_fin ?? "" }
                          : { ...nuevo.datos, modo: "fija" },
                      });
                    }}>
                    <option value="">Ninguna</option>
                    {actividadesHijo.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                  </select>
                </div>
              )}
              <CamposRecurrente valor={nuevo.datos} onCambio={(d) => setNuevo({ ...nuevo, datos: d })} miembros={miembros}
                permitirPorSesion={Boolean(nuevo.actividad_id)} repartoSegunConvenio={(p) => repartoConvenio(familia, p)} />
              <div>
                <label className="etiqueta">Notas (opcional)</label>
                <textarea className="campo" rows={2} value={nuevo.notas} onChange={(e) => setNuevo({ ...nuevo, notas: e.target.value })} />
              </div>
              {previa && (
                <div className="bg-salvia-50 border border-salvia-200 rounded-xl p-3 space-y-2">
                  <p className="etiqueta mb-0">Vista previa · 12 meses desde el inicio</p>
                  <TiraCuotas cuotas={previa.tira} />
                  <p className="text-sm text-salvia-900">
                    {previa.n} cuota{previa.n === 1 ? "" : "s"} · total {euros(previa.total)}
                    {previa.otro && ` · parte de ${previa.otro.nombre?.split(" ")[0]}: ${euros(previa.parteOtro)}`}
                    {nuevo.datos.modo === "por_sesion" && " (estimado según el horario)"}
                  </p>
                </div>
              )}
              {otroProgenitor && (
                <p className="text-xs text-carbon-suave">
                  {otroProgenitor.nombre?.split(" ")[0]} recibirá la propuesta. Cuando la acepte, las cuotas se registrarán solas.
                </p>
              )}
              <div className="flex gap-2 justify-end">
                <button type="button" className="boton-secundario" onClick={() => setNuevo(null)}>Cancelar</button>
                <button className="boton-primario" disabled={guardando}>
                  {guardando ? "Guardando…" : otroProgenitor ? "Enviar propuesta" : "Crear"}
                </button>
              </div>
            </form>
          );
        })()}
      </HojaInferior>

      {/* ================= HOJA: CUOTA DE UN MES ================= */}
      <HojaInferior abierta={cuotaSel !== null} onCerrar={() => setCuotaSel(null)}
        titulo={cuotaSel ? `${cuotaSel.r.concepto} · ${nombreMes(cuotaSel.c.mes)}` : ""}>
        {cuotaSel && (() => {
          const { r, c } = cuotaSel;
          return (
            <div className="space-y-4">
              <p className="text-sm">
                <span className="chip bg-crema-200 text-carbon-claro mr-2">{ETIQUETA_CUOTA[c.estado]}</span>
                {c.importe !== null && <strong>{euros(c.importe)}</strong>}
                {r.modo === "por_sesion" && (c.estado === "proxima" || c.estado === "en_espera") && " (estimado)"}
              </p>

              {c.estado === "registrada" && c.gasto && (
                <>
                  <p className="text-xs text-carbon-suave">
                    Registrada el {fechaHora(c.gasto.creado_en)} · estado: {c.gasto.estado}
                    {c.gasto.notas && ` · ${c.gasto.notas}`}
                  </p>
                  {c.gasto.pagado_por === usuarioId && c.gasto.estado === "aprobado" && (
                    <div className="space-y-2">
                      <label className="etiqueta">¿Se registró por error? Anúlala</label>
                      <input className="campo" value={motivo} onChange={(e) => setMotivo(e.target.value)}
                        placeholder="Motivo (queda registrado)" />
                      <button className="boton-peligro text-xs" onClick={anularCuota}>Anular esta cuota</button>
                      <p className="text-xs text-carbon-suave">No se borra: queda tachada en el historial de los dos y deja de contar en el saldo.</p>
                    </div>
                  )}
                </>
              )}

              {(c.estado === "proxima" || c.estado === "en_espera") && (
                <div className="space-y-2">
                  <label className="etiqueta">¿Este mes no se paga?</label>
                  <input className="campo" value={motivo} onChange={(e) => setMotivo(e.target.value)}
                    placeholder="Motivo (opcional): baja por lesión, el club no cobra…" />
                  <button className="boton-primario text-xs" onClick={omitirCuota}>No se paga este mes</button>
                  <p className="text-xs text-carbon-suave">
                    Solo afecta a {nombreMes(c.mes)}. Para quitar meses todos los años, usa Gestionar → Editar → Meses sin cobro.
                  </p>
                </div>
              )}

              {c.estado === "omitida" && c.omision && (
                <p className="text-sm text-carbon-claro">
                  Marcada como «no se paga» por {primerNombre(c.omision.creado_por)} el {fechaHora(c.omision.creado_en)}
                  {c.omision.motivo && ` · «${c.omision.motivo}»`}.
                </p>
              )}
              {c.estado === "sin_cobro" && (
                <p className="text-sm text-carbon-claro">Mes sin cobro (se repite cada año). Puedes cambiarlo en Gestionar → Editar.</p>
              )}
              {c.estado === "pausa" && <p className="text-sm text-carbon-claro">La cuota está en pausa este mes.</p>}
              {c.estado === "anulada" && c.gasto && (
                <p className="text-sm text-carbon-claro">
                  Cuota anulada{c.gasto.motivo_anulacion && `: «${c.gasto.motivo_anulacion}»`}. Sigue en el historial, pero no cuenta en el saldo.
                </p>
              )}
              {c.estado === "en_espera" && r.estado === "propuesto" && (
                <p className="text-xs text-carbon-suave">Se registrará cuando se acepte la propuesta.</p>
              )}
            </div>
          );
        })()}
      </HojaInferior>

      {/* ================= HOJA: RECHAZAR ================= */}
      <HojaInferior abierta={rechazando !== null} onCerrar={() => setRechazando(null)} titulo="Rechazar propuesta">
        {rechazando && (
          <div className="space-y-3">
            <p className="text-sm text-carbon-claro">{rechazando.concepto} · {describirRecurrente(rechazando, euros)}</p>
            <label className="etiqueta">Motivo (opcional, queda registrado)</label>
            <textarea className="campo" rows={2} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
            <div className="flex gap-2 justify-end">
              <button className="boton-secundario" onClick={() => setRechazando(null)}>Volver</button>
              <button className="boton-primario" onClick={() => responder(rechazando, false)}>Rechazar</button>
            </div>
          </div>
        )}
      </HojaInferior>

      {/* ================= HOJA: GESTIONAR ================= */}
      <HojaInferior abierta={gestion !== null} onCerrar={cerrarGestion} titulo={gestion?.concepto ?? ""}>
        {gestion && (
          <div className="space-y-4">
            <p className="text-sm text-carbon-claro">{describirRecurrente(gestion, euros)}</p>
            {gestion.pausa_desde && (
              <p className="text-xs text-carbon-suave">
                Pausa: desde {nombreMes(parseISO(gestion.pausa_desde))}
                {gestion.pausa_hasta ? ` hasta ${nombreMes(parseISO(gestion.pausa_hasta))}` : " (sin fecha de vuelta)"}
              </p>
            )}

            {modoGestion === null && (
              <div className="grid gap-2">
                {gestion.estado !== "rechazado" && (
                  <button className="boton-secundario justify-start" onClick={() => setModoGestion("editar")}>
                    Editar importe, meses sin cobro o reparto
                  </button>
                )}
                {(gestion.estado === "activo" || gestion.estado === "propuesto") && (
                  enPausa(gestion, new Date()) || (gestion.pausa_desde && gestion.pausa_desde > aISO(new Date())) ? (
                    <button className="boton-secundario justify-start" onClick={() => reanudar(gestion)}>Reanudar (quitar la pausa)</button>
                  ) : (
                    <button className="boton-secundario justify-start" onClick={() => setModoGestion("pausar")}>
                      Pausar unos meses
                    </button>
                  )
                )}
                {gestion.estado === "activo" && (
                  <button className="boton-secundario justify-start" onClick={() => setModoGestion("finalizar")}>
                    Finalizar (dejar de pagar)
                  </button>
                )}
                <button className="boton-secundario justify-start text-vino" onClick={() => setModoGestion("eliminar")}>
                  Eliminar gasto recurrente
                </button>
              </div>
            )}

            {modoGestion === "editar" && edicion && (
              <form onSubmit={guardarEdicion} className="space-y-4">
                <CamposRecurrente valor={edicion} onCambio={setEdicion} miembros={miembros} mostrarFechas={false}
                  permitirPorSesion={false} repartoSegunConvenio={(p) => repartoConvenio(familia, p)} />
                {gestion.estado === "activo" && otroProgenitor && (
                  <p className="text-xs text-carbon-suave">
                    Si el cambio reduce el coste se aplica al momento. Si lo aumenta, {otroProgenitor.nombre?.split(" ")[0]} tendrá que aceptarlo.
                  </p>
                )}
                <div className="flex gap-2 justify-end">
                  <button type="button" className="boton-secundario" onClick={() => setModoGestion(null)}>Volver</button>
                  <button className="boton-primario">Guardar</button>
                </div>
              </form>
            )}

            {modoGestion === "pausar" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="etiqueta">Desde</label>
                    <select className="campo" value={pausa.desde} onChange={(e) => setPausa({ ...pausa, desde: e.target.value })}>
                      {opcionesMeses(new Date(), 18).map((o) => <option key={o.valor} value={o.valor}>{o.texto}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="etiqueta">Hasta</label>
                    <select className="campo" value={pausa.hasta} onChange={(e) => setPausa({ ...pausa, hasta: e.target.value })}>
                      <option value="">Sin fecha (reanudar a mano)</option>
                      {opcionesMeses(new Date(), 24).map((o) => <option key={o.valor} value={o.valor}>{o.texto}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button className="boton-secundario" onClick={() => setModoGestion(null)}>Volver</button>
                  <button className="boton-primario" onClick={guardarPausa}>Guardar pausa</button>
                </div>
              </div>
            )}

            {modoGestion === "finalizar" && (
              <div className="space-y-3">
                <label className="etiqueta">Último mes que se paga</label>
                <select className="campo" value={ultimoMes} onChange={(e) => setUltimoMes(e.target.value)}>
                  {opcionesMeses(addMonths(new Date(), -1), 25)
                    .filter((o) => !gestion.fecha_fin || o.valor <= gestion.fecha_fin.slice(0, 7))
                    .filter((o) => o.valor >= gestion.fecha_inicio.slice(0, 7))
                    .map((o) => <option key={o.valor} value={o.valor}>{o.texto}</option>)}
                </select>
                <p className="text-xs text-carbon-suave">A partir del mes siguiente no se registrarán más cuotas.</p>
                <div className="flex gap-2 justify-end">
                  <button className="boton-secundario" onClick={() => setModoGestion(null)}>Volver</button>
                  <button className="boton-primario" onClick={finalizar}>Finalizar</button>
                </div>
              </div>
            )}

            {modoGestion === "eliminar" && (() => {
              const registradas = cuotas.filter((g) => g.recurrente_id === gestion.id).length;
              return (
                <div className="bg-vino/5 border border-vino/30 rounded-xl p-3 space-y-3">
                  <p className="text-sm">
                    Se eliminará el gasto recurrente y todas sus cuotas futuras.
                    {registradas > 0
                      ? ` Las ${registradas} cuota${registradas === 1 ? "" : "s"} ya registrada${registradas === 1 ? "" : "s"} se conservan en el historial de los dos.`
                      : " No hay cuotas registradas todavía."}
                  </p>
                  <div className="flex gap-2">
                    <button className="boton-peligro text-xs" onClick={eliminar}>Sí, eliminar</button>
                    <button className="boton-secundario text-xs" onClick={() => setModoGestion(null)}>No</button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </HojaInferior>
    </div>
  );
}
