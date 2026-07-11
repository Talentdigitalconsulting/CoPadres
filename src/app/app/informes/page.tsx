"use client";
import { useState } from "react";
import { format, subMonths } from "date-fns";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { useFamilia, nombreDe } from "@/lib/useFamilia";
import { euros, fechaHora, fechaCorta, fechaLarga } from "@/lib/utils";
import {
  CATEGORIAS_GASTO,
  type EntradaDiario, type Gasto, type Mensaje,
  type RegistroAuditoria, type SolicitudCambio,
} from "@/lib/tipos";

type DatosInforme = {
  gastos: Gasto[];
  mensajes: Mensaje[];
  solicitudes: SolicitudCambio[];
  diario: EntradaDiario[];
  auditoria: RegistroAuditoria[];
};

/**
 * Informes exportables: registro íntegro y ordenado para abogados y juzgados.
 * El botón "Descargar PDF" usa la impresión del navegador (Guardar como PDF),
 * con estilos de impresión limpios y formales.
 */
export default function PaginaInformes() {
  const { cargando, familia, miembros } = useFamilia();
  const [desde, setDesde] = useState(format(subMonths(new Date(), 3), "yyyy-MM-dd"));
  const [hasta, setHasta] = useState(format(new Date(), "yyyy-MM-dd"));
  const [secciones, setSecciones] = useState({
    gastos: true, mensajes: true, solicitudes: true, diario: true, auditoria: false,
  });
  const [datos, setDatos] = useState<DatosInforme | null>(null);
  const [generando, setGenerando] = useState(false);

  const generar = async () => {
    if (!familia) return;
    setGenerando(true);
    const supabase = crearClienteNavegador();
    const inicio = `${desde}T00:00:00`;
    const fin = `${hasta}T23:59:59`;
    const [g, m, s, d, a] = await Promise.all([
      supabase.from("gastos").select("*").eq("familia_id", familia.id)
        .gte("creado_en", inicio).lte("creado_en", fin).order("creado_en"),
      supabase.from("mensajes").select("*").eq("familia_id", familia.id)
        .gte("creado_en", inicio).lte("creado_en", fin).order("creado_en"),
      supabase.from("solicitudes_cambio").select("*").eq("familia_id", familia.id)
        .gte("creado_en", inicio).lte("creado_en", fin).order("creado_en"),
      supabase.from("diario").select("*").eq("familia_id", familia.id)
        .gte("creado_en", inicio).lte("creado_en", fin).order("creado_en"),
      supabase.from("registro_auditoria").select("*").eq("familia_id", familia.id)
        .gte("creado_en", inicio).lte("creado_en", fin).order("creado_en"),
    ]);
    setDatos({
      gastos: (g.data as Gasto[]) ?? [],
      mensajes: (m.data as Mensaje[]) ?? [],
      solicitudes: (s.data as SolicitudCambio[]) ?? [],
      diario: (d.data as EntradaDiario[]) ?? [],
      auditoria: (a.data as RegistroAuditoria[]) ?? [],
    });
    setGenerando(false);
  };

  if (cargando) return <p className="text-sm text-carbon-suave">Cargando…</p>;

  const totalGastos = datos?.gastos.reduce((t, g) => t + Number(g.importe), 0) ?? 0;

  return (
    <div className="space-y-6">
      <header className="no-imprimir">
        <h1 className="titulo-seccion">Informes</h1>
        <p className="text-sm text-carbon-suave mt-1">
          Registro íntegro, ordenado y con autoría para tu abogado o el juzgado.
        </p>
      </header>

      {/* Configuración del informe */}
      <div className="tarjeta no-imprimir space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="etiqueta">Desde</label>
            <input type="date" className="campo" value={desde} onChange={(e) => setDesde(e.target.value)} />
          </div>
          <div>
            <label className="etiqueta">Hasta</label>
            <input type="date" className="campo" value={hasta} onChange={(e) => setHasta(e.target.value)} />
          </div>
          <div className="col-span-2 flex items-end gap-2">
            <button className="boton-primario" onClick={generar} disabled={generando}>
              {generando ? "Generando…" : "Generar informe"}
            </button>
            {datos && (
              <button className="boton-secundario" onClick={() => window.print()}>
                Descargar PDF
              </button>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          {(
            [
              ["gastos", "Gastos"],
              ["mensajes", "Mensajes"],
              ["solicitudes", "Cambios de custodia"],
              ["diario", "Diario del menor"],
              ["auditoria", "Registro de auditoría técnico"],
            ] as const
          ).map(([clave, texto]) => (
            <label key={clave} className="flex items-center gap-2">
              <input type="checkbox" className="accent-salvia-700"
                checked={secciones[clave]}
                onChange={(e) => setSecciones({ ...secciones, [clave]: e.target.checked })} />
              {texto}
            </label>
          ))}
        </div>
      </div>

      {/* ---------- Informe ---------- */}
      {datos && (
        <div className="tarjeta bg-white space-y-8 print:shadow-none">
          {/* Portada */}
          <div className="border-b border-carbon-linea pb-5">
            <h2 className="font-display text-2xl">Informe de coparentalidad</h2>
            <p className="text-sm text-carbon-claro mt-2">
              Espacio: <strong>{familia?.nombre}</strong>
              <br />
              Miembros: {miembros.map((m) => m.nombre).join(" y ")}
              <br />
              Periodo: {fechaLarga(desde)} — {fechaLarga(hasta)}
              <br />
              Generado el {fechaLarga(new Date().toISOString().slice(0, 10))} con CoPadres
            </p>
            <p className="text-xs text-carbon-suave mt-3 leading-relaxed">
              Los mensajes y el registro de auditoría de CoPadres son inmutables: no pueden
              editarse ni eliminarse por ninguna de las partes una vez creados. Cada entrada
              incluye autor, fecha y hora.
            </p>
          </div>

          {secciones.gastos && (
            <section>
              <h3 className="font-display text-lg mb-3">
                1. Gastos extraordinarios ({datos.gastos.length}) — total {euros(totalGastos)}
              </h3>
              {datos.gastos.length === 0 ? <p className="text-sm text-carbon-suave">Sin gastos en el periodo.</p> : (
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-carbon-linea text-left text-carbon-suave">
                      <th className="py-1.5 pr-2">Fecha</th><th className="pr-2">Concepto</th>
                      <th className="pr-2">Categoría</th><th className="pr-2">Pagó</th>
                      <th className="pr-2 text-right">Importe</th><th className="pr-2 text-right">% otro</th>
                      <th>Estado</th><th>Justif.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datos.gastos.map((g) => (
                      <tr key={g.id} className="border-b border-carbon-linea/50">
                        <td className="py-1.5 pr-2">{fechaCorta(g.creado_en.slice(0, 10))}</td>
                        <td className="pr-2">{g.concepto}</td>
                        <td className="pr-2">{CATEGORIAS_GASTO[g.categoria]}</td>
                        <td className="pr-2">{nombreDe(miembros, g.pagado_por).split(" ")[0]}</td>
                        <td className="pr-2 text-right">{euros(Number(g.importe))}</td>
                        <td className="pr-2 text-right">{g.reparto_pct} %</td>
                        <td>{g.estado}</td>
                        <td>{g.comprobante_url ? "Sí" : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          )}

          {secciones.solicitudes && (
            <section>
              <h3 className="font-display text-lg mb-3">
                2. Solicitudes de cambio de custodia ({datos.solicitudes.length})
              </h3>
              {datos.solicitudes.length === 0 ? <p className="text-sm text-carbon-suave">Sin solicitudes en el periodo.</p> : (
                <ul className="space-y-3">
                  {datos.solicitudes.map((s) => (
                    <li key={s.id} className="text-sm border-l-2 border-carbon-linea pl-3">
                      <p>{s.descripcion}</p>
                      <p className="text-xs text-carbon-suave mt-0.5">
                        Solicitada por {nombreDe(miembros, s.solicitado_por)} el {fechaHora(s.creado_en)} ·
                        estado: <strong>{s.estado}</strong>
                        {s.respondido_en &&
                          ` · respondida por ${nombreDe(miembros, s.respondido_por)} el ${fechaHora(s.respondido_en)}`}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {secciones.diario && (
            <section>
              <h3 className="font-display text-lg mb-3">3. Diario del menor ({datos.diario.length})</h3>
              {datos.diario.length === 0 ? <p className="text-sm text-carbon-suave">Sin anotaciones en el periodo.</p> : (
                <ul className="space-y-2">
                  {datos.diario.map((d) => (
                    <li key={d.id} className="text-sm">
                      <strong>{fechaHora(d.creado_en)}</strong> · [{d.categoria}] {d.titulo}
                      {d.contenido && ` — ${d.contenido}`}
                      <span className="text-carbon-suave"> ({nombreDe(miembros, d.creado_por).split(" ")[0]})</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {secciones.mensajes && (
            <section className="print:break-before-page">
              <h3 className="font-display text-lg mb-3">4. Transcripción de mensajes ({datos.mensajes.length})</h3>
              {datos.mensajes.length === 0 ? <p className="text-sm text-carbon-suave">Sin mensajes en el periodo.</p> : (
                <ul className="space-y-2">
                  {datos.mensajes.map((m) => (
                    <li key={m.id} className="text-sm">
                      <span className="text-carbon-suave text-xs">[{fechaHora(m.creado_en)}]</span>{" "}
                      <strong>{nombreDe(miembros, m.remitente_id).split(" ")[0]}:</strong> {m.texto}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {secciones.auditoria && (
            <section>
              <h3 className="font-display text-lg mb-3">
                5. Registro de auditoría técnico ({datos.auditoria.length})
              </h3>
              <ul className="space-y-1">
                {datos.auditoria.map((r) => (
                  <li key={r.id} className="text-xs text-carbon-claro font-mono">
                    {fechaHora(r.creado_en)} · {nombreDe(miembros, r.actor_id).split(" ")[0]} · {r.accion} · {r.entidad}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
