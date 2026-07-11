"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { fechaHora } from "@/lib/utils";
import type { Notificacion } from "@/lib/tipos";

const ICONO_TIPO: Record<string, string> = {
  mensaje: "💬", gasto: "🧾", calendario: "📅", diario: "📔",
};

/** Centro de notificaciones: todo lo que ha pasado, generado automáticamente. */
export default function PaginaNotificaciones() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargar = async () => {
    const supabase = crearClienteNavegador();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("notificaciones").select("*").eq("usuario_id", user.id)
      .order("creado_en", { ascending: false }).limit(100);
    setNotificaciones((data as Notificacion[]) ?? []);
    setCargando(false);
  };

  useEffect(() => {
    cargar();
  }, []);

  const marcarTodas = async () => {
    const supabase = crearClienteNavegador();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("notificaciones").update({ leida: true })
      .eq("usuario_id", user.id).eq("leida", false);
    cargar();
  };

  const marcarUna = async (n: Notificacion) => {
    if (n.leida) return;
    const supabase = crearClienteNavegador();
    await supabase.from("notificaciones").update({ leida: true }).eq("id", n.id);
    cargar();
  };

  if (cargando) return <p className="text-sm text-carbon-suave">Cargando…</p>;

  const sinLeer = notificaciones.filter((n) => !n.leida).length;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="titulo-seccion">Notificaciones</h1>
          <p className="text-sm text-carbon-suave mt-1">
            {sinLeer > 0 ? `${sinLeer} sin leer` : "Estás al día"}
          </p>
        </div>
        {sinLeer > 0 && (
          <button className="boton-secundario text-xs" onClick={marcarTodas}>
            Marcar todas como leídas
          </button>
        )}
      </header>

      {notificaciones.length === 0 ? (
        <div className="tarjeta text-center py-10">
          <p className="text-sm text-carbon-suave">
            Aquí aparecerá cada gasto, mensaje o cambio que registre el otro progenitor.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notificaciones.map((n) => (
            <Link key={n.id} href={n.enlace ?? "/app"} onClick={() => marcarUna(n)}
              className={`tarjeta flex items-start gap-3 hover:shadow-flotante transition-shadow ${
                n.leida ? "opacity-70" : "border-salvia-300 bg-salvia-50/50"
              }`}>
              <span className="text-lg leading-none mt-0.5">{ICONO_TIPO[n.tipo] ?? "🔔"}</span>
              <div className="min-w-0">
                <p className={`text-sm ${n.leida ? "" : "font-semibold"}`}>{n.titulo}</p>
                {n.cuerpo && <p className="text-xs text-carbon-suave mt-0.5 truncate">{n.cuerpo}</p>}
                <p className="text-[11px] text-carbon-suave/80 mt-1">{fechaHora(n.creado_en)}</p>
              </div>
              {!n.leida && <span className="ml-auto mt-1 w-2 h-2 rounded-full bg-arcilla shrink-0" />}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
