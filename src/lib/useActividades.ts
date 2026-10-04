"use client";
import { useCallback, useEffect, useState } from "react";
import { crearClienteNavegador } from "@/lib/supabase/client";
import type {
  Actividad, EventoCustodia, ExcepcionActividad, Gasto, GastoRecurrente, OmisionCuota,
} from "@/lib/tipos";

/**
 * ¿El error indica que la tabla/función aún no existe en Supabase?
 * (pasa si todavía no se ha ejecutado supabase/migracion_002_…sql)
 */
export function faltaTabla(error: { code?: string; message?: string } | null | undefined) {
  if (!error) return false;
  return (
    error.code === "42P01" ||
    error.code === "42883" ||
    error.code === "PGRST202" ||
    error.code === "PGRST205" ||
    /does not exist|schema cache|Could not find/i.test(error.message ?? "")
  );
}

/** Genera las cuotas de los gastos recurrentes que ya toquen (idempotente). */
export async function generarCuotas(familiaId: string) {
  const supabase = crearClienteNavegador();
  const { data, error } = await supabase.rpc("generar_cuotas", { fid: familiaId });
  if (error) return 0;
  return (data as number) ?? 0;
}

/** Carga actividades, excepciones y eventos de custodia de la familia. */
export function useActividades(familiaId?: string | null) {
  const [cargando, setCargando] = useState(true);
  const [faltaMigracion, setFaltaMigracion] = useState(false);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [excepciones, setExcepciones] = useState<ExcepcionActividad[]>([]);
  const [eventos, setEventos] = useState<EventoCustodia[]>([]);
  const [recurrentes, setRecurrentes] = useState<GastoRecurrente[]>([]);

  const cargar = useCallback(async () => {
    if (!familiaId) return;
    const supabase = crearClienteNavegador();
    const [a, e, ev, r] = await Promise.all([
      supabase.from("actividades").select("*").eq("familia_id", familiaId).order("nombre"),
      supabase.from("actividad_excepciones").select("*").eq("familia_id", familiaId),
      supabase.from("eventos_custodia").select("*").eq("familia_id", familiaId).eq("tipo", "custodia"),
      supabase.from("gastos_recurrentes").select("*").eq("familia_id", familiaId),
    ]);
    setFaltaMigracion(faltaTabla(a.error));
    setActividades(((a.data as Actividad[]) ?? []).map(normalizarActividad));
    setExcepciones((e.data as ExcepcionActividad[]) ?? []);
    setEventos((ev.data as EventoCustodia[]) ?? []);
    setRecurrentes(((r.data as GastoRecurrente[]) ?? []).map(normalizarRecurrente));
    setCargando(false);
  }, [familiaId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return { cargando, faltaMigracion, actividades, excepciones, eventos, recurrentes, recargar: cargar };
}

/** Carga gastos recurrentes, sus omisiones y sus cuotas generadas. */
export function useRecurrentes(familiaId?: string | null) {
  const [cargando, setCargando] = useState(true);
  const [faltaMigracion, setFaltaMigracion] = useState(false);
  const [recurrentes, setRecurrentes] = useState<GastoRecurrente[]>([]);
  const [omisiones, setOmisiones] = useState<OmisionCuota[]>([]);
  const [cuotas, setCuotas] = useState<Gasto[]>([]);

  const cargar = useCallback(async () => {
    if (!familiaId) return;
    const supabase = crearClienteNavegador();
    const [r, o, c] = await Promise.all([
      supabase.from("gastos_recurrentes").select("*").eq("familia_id", familiaId)
        .order("creado_en", { ascending: false }),
      supabase.from("gastos_recurrentes_omisiones").select("*").eq("familia_id", familiaId),
      supabase.from("gastos").select("*").eq("familia_id", familiaId).not("recurrente_id", "is", null),
    ]);
    setFaltaMigracion(faltaTabla(r.error));
    setRecurrentes(((r.data as GastoRecurrente[]) ?? []).map(normalizarRecurrente));
    setOmisiones((o.data as OmisionCuota[]) ?? []);
    setCuotas((c.data as Gasto[]) ?? []);
    setCargando(false);
  }, [familiaId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return { cargando, faltaMigracion, recurrentes, omisiones, cuotas, recargar: cargar };
}

function normalizarActividad(a: Actividad): Actividad {
  return { ...a, horarios: Array.isArray(a.horarios) ? a.horarios : [], meses_sin_actividad: a.meses_sin_actividad ?? [] };
}

function normalizarRecurrente(r: GastoRecurrente): GastoRecurrente {
  return { ...r, importe: Number(r.importe), meses_sin_cobro: r.meses_sin_cobro ?? [] };
}
