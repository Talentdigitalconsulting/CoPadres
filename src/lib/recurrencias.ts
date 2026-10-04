/**
 * Lógica de recurrencias de CoPadres:
 *  - sesiones de las actividades de los hijos (horario semanal + excepciones),
 *  - quién lleva a cada sesión (según la custodia de ese día),
 *  - estado de las cuotas de los gastos recurrentes mes a mes.
 *
 * Las reglas de las cuotas son las mismas que aplica la función SQL
 * `generar_cuotas` de Supabase (ver supabase/migracion_002_…sql).
 */
import {
  addDays, addMonths, differenceInCalendarDays, differenceInCalendarMonths, eachDayOfInterval,
  endOfMonth, format, getISODay, max as maxFecha, min as minFecha, parseISO, startOfISOWeek, startOfMonth,
} from "date-fns";
import type {
  Actividad, EventoCustodia, ExcepcionActividad, Gasto, GastoRecurrente, HorarioDia, OmisionCuota,
} from "@/lib/tipos";
import { DIAS_SEMANA, FRECUENCIAS_GASTO, MESES_CORTOS } from "@/lib/tipos";

export const aISO = (d: Date) => format(d, "yyyy-MM-dd");
export const periodoDe = (d: Date) => format(d, "yyyy-MM");

/* ============================== Actividades ============================== */

export type Sesion = {
  /** Identificador estable: actividad + fecha original. */
  clave: string;
  actividad: Actividad;
  /** Fecha en la que se celebra (la nueva si se ha movido). */
  fecha: string;
  /** Fecha que le correspondía según el horario. */
  fechaOriginal: string;
  inicio: string;
  fin: string;
  estado: "normal" | "cancelada" | "movida";
  excepcion: ExcepcionActividad | null;
  /** Progenitor fijado para esta sesión (excepción o actividad); null = según custodia. */
  quienLlevaFijo: string | null;
};

/** ¿Hay actividad ese día según horario, vigencia, meses sin actividad y frecuencia? */
export function tocaElDia(a: Actividad, dia: Date): HorarioDia | null {
  const iso = aISO(dia);
  if (iso < a.fecha_inicio) return null;
  if (a.fecha_fin && iso > a.fecha_fin) return null;
  if (a.meses_sin_actividad?.includes(dia.getMonth() + 1)) return null;
  const h = a.horarios.find((x) => x.dia === getISODay(dia));
  if (!h) return null;
  if (a.frecuencia === "quincenal") {
    const ancla = startOfISOWeek(parseISO(a.fecha_inicio));
    const semanas = Math.floor(differenceInCalendarDays(dia, ancla) / 7);
    if (semanas % 2 !== 0) return null;
  }
  return h;
}

/** Sesiones de un conjunto de actividades entre dos fechas (incluidas). */
export function sesionesEnRango(
  actividades: Actividad[],
  excepciones: ExcepcionActividad[],
  desde: Date,
  hasta: Date
): Sesion[] {
  const resultado: Sesion[] = [];
  const desdeISO = aISO(desde);
  const hastaISO = aISO(hasta);
  const porClave = new Map(excepciones.map((e) => [`${e.actividad_id}|${e.fecha}`, e]));

  for (const a of actividades) {
    // 1) Sesiones del horario dentro del rango.
    for (const dia of eachDayOfInterval({ start: desde, end: hasta })) {
      const h = tocaElDia(a, dia);
      if (!h) continue;
      const fecha = aISO(dia);
      const ex = porClave.get(`${a.id}|${fecha}`) ?? null;
      if (ex?.tipo === "movida") continue; // se pinta en su nueva fecha (paso 2)
      resultado.push({
        clave: `${a.id}|${fecha}`,
        actividad: a,
        fecha,
        fechaOriginal: fecha,
        inicio: h.inicio,
        fin: h.fin,
        estado: ex?.tipo === "cancelada" ? "cancelada" : "normal",
        excepcion: ex,
        quienLlevaFijo: ex?.quien_lleva ?? a.quien_lleva ?? null,
      });
    }
    // 2) Sesiones movidas que caen dentro del rango.
    for (const ex of excepciones) {
      if (ex.actividad_id !== a.id || ex.tipo !== "movida") continue;
      const nueva = ex.nueva_fecha ?? ex.fecha;
      if (nueva < desdeISO || nueva > hastaISO) continue;
      const original = tocaElDia(a, parseISO(ex.fecha));
      resultado.push({
        clave: `${a.id}|${ex.fecha}`,
        actividad: a,
        fecha: nueva,
        fechaOriginal: ex.fecha,
        inicio: ex.hora_inicio ?? original?.inicio ?? "00:00",
        fin: ex.hora_fin ?? original?.fin ?? "00:00",
        estado: "movida",
        excepcion: ex,
        quienLlevaFijo: ex.quien_lleva ?? a.quien_lleva ?? null,
      });
    }
  }
  return resultado.sort((x, y) => (x.fecha + x.inicio).localeCompare(y.fecha + y.inicio));
}

/** Progenitor con quien están los hijos ese día según el calendario de custodia. */
export function custodiaDelDia(eventos: EventoCustodia[], fecha: string, hijoId?: string | null) {
  const candidatos = eventos.filter(
    (e) =>
      e.tipo === "custodia" &&
      e.progenitor_id &&
      e.fecha_inicio <= fecha &&
      e.fecha_fin >= fecha &&
      (!e.hijo_id || !hijoId || e.hijo_id === hijoId)
  );
  if (!candidatos.length) return null;
  // Si hay varios (p. ej. un cambio acordado encima del régimen general), manda el más reciente.
  candidatos.sort((a, b) => b.creado_en.localeCompare(a.creado_en));
  return candidatos[0].progenitor_id;
}

/** Quién lleva a la sesión: fijado en la sesión o en la actividad, o según la custodia. */
export function quienLleva(s: Sesion, eventos: EventoCustodia[]) {
  return s.quienLlevaFijo ?? custodiaDelDia(eventos, s.fecha, s.actividad.hijo_id);
}

/** "L · X · J 17:00–18:00 · M 18:00–19:00" (agrupa los días con la misma hora). */
export function describirHorario(horarios: HorarioDia[]) {
  const grupos = new Map<string, number[]>();
  for (const h of [...horarios].sort((a, b) => a.dia - b.dia)) {
    const k = `${h.inicio}–${h.fin}`;
    grupos.set(k, [...(grupos.get(k) ?? []), h.dia]);
  }
  return Array.from(grupos.entries())
    .map(([horas, dias]) => `${dias.map((d) => DIAS_SEMANA[d - 1].corto).join(" · ")} ${horas}`)
    .join("  ·  ");
}

/** "jul, ago" a partir de [7, 8]. */
export function describirMeses(meses: number[]) {
  return [...meses].sort((a, b) => a - b).map((m) => MESES_CORTOS[m - 1]).join(", ");
}

/* ============================ Gastos recurrentes ============================ */

export function pasoMeses(r: Pick<GastoRecurrente, "frecuencia" | "modo">) {
  if (r.modo === "por_sesion") return 1;
  return { mensual: 1, bimestral: 2, trimestral: 3, anual: 12 }[r.frecuencia];
}

/** Fecha en la que se registra la cuota de un mes (igual que en SQL). */
export function fechaCobro(r: GastoRecurrente, mes: Date) {
  if (r.modo === "por_sesion") return addDays(endOfMonth(mes), 1);
  const ultimo = endOfMonth(mes).getDate();
  return addDays(startOfMonth(mes), Math.min(r.dia_cobro, ultimo) - 1);
}

export type EstadoCuota =
  | "fuera"        // ese mes no es un periodo de cobro (fuera de vigencia o no toca por frecuencia)
  | "sin_cobro"    // mes marcado como "sin cobro"
  | "pausa"        // dentro de una pausa
  | "omitida"      // cuota concreta que no se paga
  | "registrada"   // cuota generada (aprobada o reembolsada)
  | "anulada"      // cuota generada y anulada después
  | "proxima"      // aún no ha llegado su fecha de cobro
  | "en_espera";   // ya debería existir pero el gasto aún no está activo (propuesta pendiente)

export type CuotaMes = {
  periodo: string;
  mes: Date;
  estado: EstadoCuota;
  gasto: Gasto | null;
  omision: OmisionCuota | null;
  importe: number | null;
};

/** ¿Cae el mes dentro de la pausa? */
export function enPausa(r: GastoRecurrente, mes: Date) {
  if (!r.pausa_desde) return false;
  const finMes = aISO(endOfMonth(mes));
  const iniMes = aISO(startOfMonth(mes));
  return finMes >= r.pausa_desde && (!r.pausa_hasta || iniMes <= r.pausa_hasta);
}

/** Estado de la cuota de cada mes de una ventana de 12 meses. */
export function tiraCuotas(
  r: GastoRecurrente,
  cuotas: Gasto[],
  omisiones: OmisionCuota[],
  inicio: Date,
  hoy = new Date(),
  importeEstimado?: (mes: Date) => number | null
): CuotaMes[] {
  const paso = pasoMeses(r);
  const primerMes = startOfMonth(parseISO(r.fecha_inicio));
  const meses: CuotaMes[] = [];
  for (let i = 0; i < 12; i++) {
    const mes = addMonths(startOfMonth(inicio), i);
    const periodo = periodoDe(mes);
    const gasto = cuotas.find((g) => g.recurrente_id === r.id && g.periodo === periodo) ?? null;
    const omision = omisiones.find((o) => o.recurrente_id === r.id && o.periodo === periodo) ?? null;
    const diff = differenceInCalendarMonths(mes, primerMes);
    const fueraVigencia = diff < 0 || (r.fecha_fin !== null && aISO(mes) > r.fecha_fin);
    let estado: EstadoCuota;
    if (gasto) estado = gasto.estado === "anulado" ? "anulada" : "registrada";
    else if (fueraVigencia || diff % paso !== 0) estado = "fuera";
    else if (r.meses_sin_cobro.includes(mes.getMonth() + 1)) estado = "sin_cobro";
    else if (omision) estado = "omitida";
    else if (enPausa(r, mes)) estado = "pausa";
    else if (fechaCobro(r, mes) > hoy) estado = "proxima";
    else estado = "en_espera";
    const importe = gasto
      ? Number(gasto.importe)
      : estado === "proxima" || estado === "en_espera"
      ? importeEstimado
        ? importeEstimado(mes)
        : r.modo === "fija"
        ? Number(r.importe)
        : null
      : null;
    meses.push({ periodo, mes, estado, gasto, omision, importe });
  }
  return meses;
}

/** Primer mes de la tira: el inicio del gasto si es reciente; si no, 3 meses atrás. */
export function inicioTira(r: GastoRecurrente, hoy = new Date()) {
  const inicio = startOfMonth(parseISO(r.fecha_inicio));
  const tresAtras = startOfMonth(addMonths(hoy, -3));
  return maxFecha([minFecha([inicio, startOfMonth(hoy)]), tresAtras]);
}

/** Próxima cuota que se registrará (o null si ya no habrá más). */
export function proximaCuota(r: GastoRecurrente, omisiones: OmisionCuota[], cuotas: Gasto[], hoy = new Date()) {
  if (r.estado === "rechazado" || r.estado === "finalizado") return null;
  const paso = pasoMeses(r);
  let mes = startOfMonth(parseISO(r.fecha_inicio));
  for (let i = 0; i < 60; i++) {
    if (r.fecha_fin && aISO(mes) > r.fecha_fin) return null;
    const periodo = periodoDe(mes);
    const cobro = fechaCobro(r, mes);
    const yaExiste = cuotas.some((g) => g.recurrente_id === r.id && g.periodo === periodo);
    const saltar =
      r.meses_sin_cobro.includes(mes.getMonth() + 1) ||
      omisiones.some((o) => o.recurrente_id === r.id && o.periodo === periodo) ||
      enPausa(r, mes);
    if (!yaExiste && !saltar && aISO(cobro) >= aISO(hoy)) {
      return { periodo, mes, cobro };
    }
    mes = addMonths(mes, paso);
  }
  return null;
}

/** Nº de sesiones de una actividad en un mes (para cuotas "por sesión"). */
export function sesionesDelMes(a: Actividad, excepciones: ExcepcionActividad[], mes: Date) {
  return sesionesEnRango([a], excepciones, startOfMonth(mes), endOfMonth(mes)).filter(
    (s) => s.estado !== "cancelada" && s.fechaOriginal.slice(0, 7) === periodoDe(mes)
  ).length;
}

/** Previsión de lo que costará en los próximos 12 meses (incluye este mes). */
export function prevision12Meses(
  r: GastoRecurrente,
  cuotas: Gasto[],
  omisiones: OmisionCuota[],
  importeEstimado?: (mes: Date) => number | null,
  hoy = new Date()
) {
  const tira = tiraCuotas(r, cuotas, omisiones, startOfMonth(hoy), hoy, importeEstimado);
  return tira.reduce(
    (t, c) => t + (c.estado === "proxima" || c.estado === "registrada" ? c.importe ?? 0 : 0),
    0
  );
}

/** "45,00 € al mes · día 1 · sin cobro en jul, ago". */
export function describirRecurrente(r: GastoRecurrente, euros: (n: number) => string) {
  const partes: string[] = [];
  if (r.modo === "por_sesion") partes.push(`${euros(Number(r.importe))} por sesión · se liquida a mes vencido`);
  else
    partes.push(
      `${euros(Number(r.importe))} ${
        r.frecuencia === "mensual" ? "al mes" : `· ${FRECUENCIAS_GASTO[r.frecuencia].toLowerCase()}`
      } · día ${r.dia_cobro}`
    );
  if (r.meses_sin_cobro.length) partes.push(`sin cobro en ${describirMeses(r.meses_sin_cobro)}`);
  return partes.join(" · ");
}

/**
 * % que el pagador reclama al otro progenitor según el convenio.
 * familia.reparto_gastos es la parte que asume quien creó el espacio.
 */
export function repartoConvenio(familia: { creado_por: string; reparto_gastos: number } | null, pagador: string) {
  if (!familia) return 50;
  return pagador === familia.creado_por ? 100 - familia.reparto_gastos : familia.reparto_gastos;
}

/** ¿El cambio aumenta el coste para el otro progenitor? (entonces necesita su aprobación) */
export function cambioAumentaCoste(
  r: GastoRecurrente,
  nuevo: { importe: number; meses_sin_cobro: number[]; fecha_fin: string | null; reparto_pct: number; frecuencia: GastoRecurrente["frecuencia"]; dia_cobro: number },
  usuarioId: string
) {
  // El % que se reclama al otro solo "aumenta su coste" si paga quien edita.
  const repartoSube =
    r.pagado_por === usuarioId ? nuevo.reparto_pct > r.reparto_pct : nuevo.reparto_pct < r.reparto_pct;
  const quitaMesesSinCobro = r.meses_sin_cobro.some((m) => !nuevo.meses_sin_cobro.includes(m));
  const alarga =
    (r.fecha_fin !== null && nuevo.fecha_fin === null) ||
    (r.fecha_fin !== null && nuevo.fecha_fin !== null && nuevo.fecha_fin > r.fecha_fin);
  const masFrecuente = pasoMeses({ ...r, frecuencia: nuevo.frecuencia }) < pasoMeses(r);
  return Number(nuevo.importe) > Number(r.importe) || repartoSube || quitaMesesSinCobro || alarga || masFrecuente;
}
