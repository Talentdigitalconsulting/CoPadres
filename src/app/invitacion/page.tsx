"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MarcoAuth from "@/components/MarcoAuth";
import { crearClienteNavegador } from "@/lib/supabase/client";

/** Aceptación de la invitación del otro progenitor mediante el token del enlace. */
function ContenidoInvitacion() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");
  const [estado, setEstado] = useState<"cargando" | "sin_sesion" | "lista" | "error" | "aceptada">("cargando");
  const [nombreFamilia, setNombreFamilia] = useState("");
  const [invitacion, setInvitacion] = useState<{ id: string; familia_id: string } | null>(null);

  useEffect(() => {
    (async () => {
      if (!token) return setEstado("error");
      const supabase = crearClienteNavegador();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return setEstado("sin_sesion");

      const { data: inv } = await supabase
        .from("invitaciones")
        .select("id, familia_id, estado")
        .eq("token", token)
        .eq("estado", "pendiente")
        .maybeSingle();
      if (!inv) return setEstado("error");

      const { data: fam } = await supabase
        .from("familias").select("nombre").eq("id", inv.familia_id).maybeSingle();
      setNombreFamilia(fam?.nombre ?? "un espacio familiar");
      setInvitacion({ id: inv.id, familia_id: inv.familia_id });
      setEstado("lista");
    })();
  }, [token]);

  const aceptar = async () => {
    if (!invitacion) return;
    const supabase = crearClienteNavegador();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from("miembros_familia")
      .insert({ familia_id: invitacion.familia_id, usuario_id: user.id });
    if (error && !error.message.includes("duplicate")) {
      setEstado("error");
      return;
    }
    await supabase.from("invitaciones").update({ estado: "aceptada" }).eq("id", invitacion.id);
    setEstado("aceptada");
    setTimeout(() => router.push("/app"), 1200);
  };

  if (estado === "cargando") return <p className="text-sm text-carbon-suave">Comprobando invitación…</p>;

  if (estado === "sin_sesion")
    return (
      <div className="space-y-4">
        <p className="text-sm text-carbon-claro leading-relaxed">
          Para aceptar la invitación necesitas una cuenta. Crea la tuya o entra, y vuelve a abrir
          el enlace de invitación.
        </p>
        <a href={`/registro`} className="boton-primario w-full">Crear cuenta</a>
        <a href={`/login?siguiente=/invitacion?token=${token}`} className="boton-secundario w-full">
          Ya tengo cuenta
        </a>
      </div>
    );

  if (estado === "error")
    return (
      <p className="text-sm text-vino">
        Esta invitación no es válida o ya fue utilizada. Pide al otro progenitor que genere una nueva
        desde Ajustes.
      </p>
    );

  if (estado === "aceptada")
    return <p className="text-sm text-salvia-700 font-semibold">¡Invitación aceptada! Entrando…</p>;

  return (
    <div className="space-y-5">
      <p className="text-sm text-carbon-claro leading-relaxed">
        Te han invitado a unirte a <strong>{nombreFamilia}</strong> en CoPadres: el espacio neutral
        donde quedará documentado el calendario de custodia, los gastos y la comunicación.
      </p>
      <button onClick={aceptar} className="boton-primario w-full">Aceptar y unirme</button>
    </div>
  );
}

export default function PaginaInvitacion() {
  return (
    <MarcoAuth titulo="Invitación a CoPadres">
      <Suspense>
        <ContenidoInvitacion />
      </Suspense>
    </MarcoAuth>
  );
}
