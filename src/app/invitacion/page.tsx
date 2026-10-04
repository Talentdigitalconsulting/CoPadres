"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MarcoAuth from "@/components/MarcoAuth";
import { crearClienteNavegador } from "@/lib/supabase/client";

type Info = { familia_nombre: string; invitado_por: string; email_enmascarado: string; estado: string; caducada: boolean };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Aceptación de la invitación del otro progenitor.
 * La validación real (token, caducidad, email invitado y plazas) la hace la
 * función segura `aceptar_invitacion` de la base de datos.
 */
function ContenidoInvitacion() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");
  const [estado, setEstado] = useState<"cargando" | "sin_sesion" | "lista" | "error" | "aceptada">("cargando");
  const [info, setInfo] = useState<Info | null>(null);
  const [mensaje, setMensaje] = useState("Esta invitación no es válida o ya fue utilizada.");
  const [aceptando, setAceptando] = useState(false);

  useEffect(() => {
    (async () => {
      if (!token || !UUID.test(token)) return setEstado("error");
      const supabase = crearClienteNavegador();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return setEstado("sin_sesion");

      const { data } = await supabase.rpc("ver_invitacion", { p_token: token });
      const fila = (data as Info[] | null)?.[0];
      if (!fila || fila.estado !== "pendiente") return setEstado("error");
      if (fila.caducada) {
        setMensaje("Esta invitación ha caducado (duran 7 días). Pide al otro progenitor que genere una nueva desde Ajustes.");
        return setEstado("error");
      }
      setInfo(fila);
      setEstado("lista");
    })();
  }, [token]);

  const aceptar = async () => {
    if (!token) return;
    setAceptando(true);
    const supabase = crearClienteNavegador();
    const { error } = await supabase.rpc("aceptar_invitacion", { p_token: token });
    setAceptando(false);
    if (error) {
      setMensaje(error.message || "No se pudo aceptar la invitación.");
      setEstado("error");
      return;
    }
    setEstado("aceptada");
    setTimeout(() => router.push("/app"), 1200);
  };

  if (estado === "cargando") return <p className="text-sm text-carbon-suave">Comprobando invitación…</p>;

  if (estado === "sin_sesion") {
    const volver = encodeURIComponent(`/invitacion?token=${token}`);
    return (
      <div className="space-y-4">
        <p className="text-sm text-carbon-claro leading-relaxed">
          Para aceptar la invitación necesitas una cuenta con el <strong>mismo email</strong> al que te la enviaron.
          Crea la tuya o entra, y vuelve a abrir el enlace.
        </p>
        <a href="/registro" className="boton-primario w-full">Crear cuenta</a>
        <a href={`/login?siguiente=${volver}`} className="boton-secundario w-full">Ya tengo cuenta</a>
      </div>
    );
  }

  if (estado === "error") return <p className="text-sm text-vino" role="alert">{mensaje}</p>;

  if (estado === "aceptada")
    return <p className="text-sm text-salvia-700 font-semibold">Invitación aceptada. Entrando…</p>;

  return (
    <div className="space-y-5">
      <p className="text-sm text-carbon-claro leading-relaxed">
        <strong>{info?.invitado_por}</strong> te invita a unirte a <strong>{info?.familia_nombre}</strong> en CoPadres:
        el espacio neutral donde quedan documentados el calendario de custodia, los gastos y la comunicación.
      </p>
      <ul className="text-xs text-carbon-suave space-y-1.5">
        <li>· Los dos veis exactamente la misma información.</li>
        <li>· Nadie puede borrar ni editar los mensajes enviados.</li>
        <li>· Puedes descargar tus datos o eliminar tu cuenta cuando quieras.</li>
      </ul>
      <p className="text-xs text-carbon-suave">Invitación para {info?.email_enmascarado}.</p>
      <button onClick={aceptar} disabled={aceptando} className="boton-primario w-full">
        {aceptando ? "Uniéndote…" : "Aceptar y unirme"}
      </button>
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
