"use client";
import { useEffect, useState, useCallback } from "react";
import { crearClienteNavegador } from "@/lib/supabase/client";
import type { Familia, Hijo, Perfil } from "@/lib/tipos";

/**
 * Hook central: carga el usuario actual, su perfil, su familia,
 * los miembros (con perfil) y los hijos. Lo usan casi todas las pantallas.
 */
export function useFamilia() {
  const [cargando, setCargando] = useState(true);
  const [usuarioId, setUsuarioId] = useState<string | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [familia, setFamilia] = useState<Familia | null>(null);
  const [miembros, setMiembros] = useState<Perfil[]>([]);
  const [hijos, setHijos] = useState<Hijo[]>([]);

  const cargar = useCallback(async () => {
    const supabase = crearClienteNavegador();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setCargando(false);
      return;
    }
    setUsuarioId(user.id);

    const [{ data: p }, { data: miembro }] = await Promise.all([
      supabase.from("perfiles").select("*").eq("id", user.id).single(),
      supabase.from("miembros_familia").select("familia_id").eq("usuario_id", user.id).maybeSingle(),
    ]);
    setPerfil((p as Perfil) ?? null);

    if (miembro?.familia_id) {
      const fid = miembro.familia_id as string;
      const [{ data: f }, { data: ms }, { data: hs }] = await Promise.all([
        supabase.from("familias").select("*").eq("id", fid).single(),
        supabase.from("miembros_familia").select("usuario_id").eq("familia_id", fid),
        supabase.from("hijos").select("*").eq("familia_id", fid).order("nombre"),
      ]);
      setFamilia((f as Familia) ?? null);
      setHijos((hs as Hijo[]) ?? []);
      if (ms && ms.length) {
        const ids = ms.map((m) => m.usuario_id);
        const { data: perfiles } = await supabase.from("perfiles").select("*").in("id", ids);
        setMiembros((perfiles as Perfil[]) ?? []);
      }
    }
    setCargando(false);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  /** El otro progenitor (o null si aún no ha aceptado la invitación). */
  const otroProgenitor = miembros.find((m) => m.id !== usuarioId) ?? null;

  return { cargando, usuarioId, perfil, familia, miembros, hijos, otroProgenitor, recargar: cargar };
}

/** Busca el nombre de un miembro por id (para listados). */
export function nombreDe(miembros: Perfil[], id: string | null | undefined) {
  if (!id) return "—";
  return miembros.find((m) => m.id === id)?.nombre ?? "Miembro";
}
