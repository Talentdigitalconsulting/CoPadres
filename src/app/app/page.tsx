"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { useFamilia, nombreDe } from "@/lib/useFamilia";
import { euros, fechaCorta } from "@/lib/utils";
import type { EventoCustodia, Gasto, SolicitudCambio } from "@/lib/tipos";

/** Panel de inicio: lo importante de un vistazo. */
export default function PaginaInicio() {
  const { cargando, usuarioId, perfil, familia, miembros, otroProgenitor } = useFamilia();
  const [eventos, setEventos] = useState<EventoCustodia[]>([]);
  const [gastosPendientes, setGastosPendientes] = useState<Gasto[]>([]);
  const [solicitudes, setSolicitudes] = useState<SolicitudCambio[]>([]);
  const [saldo, setSaldo] = useState(0);

  useEffect(() => {
    if (!familia) return;
    const supabase = crearClienteNavegador();
    const hoy = new Date().toISOString().slice(0, 10);
    (async () => {
      const [{ data: ev }, { data: gp }, { data: sc }, { data: aprobados }] = await Promise.all([
        supabase.from("eventos_custodia").select("*").eq("familia_id", familia.id)
          .gte("fecha_fin", hoy).order("fecha_inicio").limit(5),
        supabase.from("gastos").select("*").eq("familia_id", familia.id)
          .eq("estado", "pendiente").order("creado_en", { ascending: false }),
        supabase.from("solicitudes_cambio").select("*").eq("familia_id", familia.id)
          .eq("estado", "pendiente"),
        supabase.from("gastos").select("*").eq("familia_id", familia.id).eq("estado", "aprobado"),
      ]);
      setEventos((ev as EventoCustodia[]) ?? []);
      setGastosPendientes((gp as Gasto[]) ?? []);
      setSolicitudes((sc as SolicitudCambio[]) ?? []);

      // Saldo entre progenitores con los gastos aprobados sin reembolsar:
      // positivo → te deben; negativo → debes.
      let s = 0;
      for (const g of (aprobados as Gasto[]) ?? []) {
        const parteOtro = Number(g.importe) * (g.reparto_pct / 100);
        s += g.pagado_por === usuarioId ? parteOtro : -parteOtro;
      }
      setSaldo(s);
    })();
  }, [familia, usuarioId]);

  if (cargando) return <p className="text-carbon-suave text-sm">Cargando tu espacio…</p>;

  const nombrePila = perfil?.nombre?.split(" ")[0] ?? "";
  const paraMi = {
    gastos: gastosPendientes.filter((g) => g.pagado_por !== usuarioId).length,
    solicitudes: solicitudes.filter((s) => s.solicitado_por !== usuarioId).length,
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="titulo-seccion">Hola, {nombrePila}</h1>
        <p className="text-sm text-carbon-suave mt-1">
          {familia?.nombre}
          {otroProgenitor
            ? ` · coordinando con ${otroProgenitor.nombre?.split(" ")[0]}`
            : " · el otro progenitor aún no se ha unido"}
        </p>
      </header>

      {/* Aviso si falta el otro progenitor */}
      {!otroProgenitor && (
        <div className="tarjeta bg-salvia-50 border-salvia-200 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-salvia-800">
            <strong>Invita al otro progenitor</strong> para que todo quede registrado para ambos.
          </p>
          <Link href="/app/ajustes?seccion=familia" className="boton-suave text-xs">Invitar ahora</Link>
        </div>
      )}

      {/* Cosas que requieren tu acción */}
      {(paraMi.gastos > 0 || paraMi.solicitudes > 0) && (
        <div className="tarjeta bg-crema-200/70 border-arcilla/30">
          <h2 className="font-semibold text-sm mb-2">Pendiente de ti</h2>
          <ul className="space-y-1.5 text-sm text-carbon-claro">
            {paraMi.gastos > 0 && (
              <li>
                <Link href="/app/gastos" className="hover:underline">
                  → {paraMi.gastos} gasto{paraMi.gastos > 1 ? "s" : ""} por revisar y aprobar
                </Link>
              </li>
            )}
            {paraMi.solicitudes > 0 && (
              <li>
                <Link href="/app/calendario" className="hover:underline">
                  → {paraMi.solicitudes} solicitud{paraMi.solicitudes > 1 ? "es" : ""} de cambio de custodia por responder
                </Link>
              </li>
            )}
          </ul>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        {/* Saldo */}
        <div className="tarjeta">
          <h2 className="etiqueta">Saldo de gastos aprobados</h2>
          <p className={`font-display text-3xl ${saldo >= 0 ? "text-salvia-700" : "text-arcilla"}`}>
            {euros(Math.abs(saldo))}
          </p>
          <p className="text-xs text-carbon-suave mt-1">
            {saldo === 0
              ? "Estáis en paz."
              : saldo > 0
              ? `A tu favor — ${otroProgenitor?.nombre?.split(" ")[0] ?? "el otro progenitor"} te lo debe.`
              : "Pendiente de que se lo reembolses."}
          </p>
          <Link href="/app/gastos" className="text-xs text-salvia-700 font-semibold hover:underline mt-3 inline-block">
            Ver gastos →
          </Link>
        </div>

        {/* Próximos eventos */}
        <div className="tarjeta md:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="etiqueta mb-0">Próximos días</h2>
            <Link href="/app/calendario" className="text-xs text-salvia-700 font-semibold hover:underline">
              Calendario completo →
            </Link>
          </div>
          {eventos.length === 0 ? (
            <p className="text-sm text-carbon-suave">
              Sin eventos próximos. Añade el calendario de custodia para empezar.
            </p>
          ) : (
            <ul className="divide-y divide-carbon-linea/70">
              {eventos.map((e) => (
                <li key={e.id} className="py-2 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{e.titulo}</p>
                    <p className="text-xs text-carbon-suave">
                      {fechaCorta(e.fecha_inicio)}
                      {e.fecha_fin !== e.fecha_inicio && ` – ${fechaCorta(e.fecha_fin)}`}
                      {e.progenitor_id && ` · con ${nombreDe(miembros, e.progenitor_id).split(" ")[0]}`}
                    </p>
                  </div>
                  <span className="chip bg-salvia-100 text-salvia-800">{e.tipo}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Accesos rápidos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: "/app/gastos?nuevo=1", titulo: "Registrar gasto", desc: "Con comprobante y reparto" },
          { href: "/app/calendario?nuevo=1", titulo: "Añadir evento", desc: "Custodia, médico, colegio…" },
          { href: "/app/diario?nuevo=1", titulo: "Anotar en el diario", desc: "Salud, medicación, cole" },
          { href: "/app/asistente", titulo: "Preguntar al asistente", desc: "Resúmenes y ayuda con IA" },
        ].map((a) => (
          <Link key={a.href} href={a.href}
            className="tarjeta hover:shadow-flotante transition-shadow group">
            <p className="text-sm font-semibold group-hover:text-salvia-700">{a.titulo}</p>
            <p className="text-xs text-carbon-suave mt-1">{a.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
