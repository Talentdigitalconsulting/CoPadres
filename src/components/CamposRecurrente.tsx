"use client";
import type { GastoRecurrente, Perfil } from "@/lib/tipos";
import { FRECUENCIAS_GASTO } from "@/lib/tipos";
import { SelectorMeses } from "@/components/SelectoresRecurrencia";

/** Datos editables de un gasto recurrente (formulario). */
export type DatosRecurrente = {
  modo: GastoRecurrente["modo"];
  importe: string;
  frecuencia: GastoRecurrente["frecuencia"];
  dia_cobro: number;
  meses_sin_cobro: number[];
  pagado_por: string;
  reparto_pct: number;
  fecha_inicio: string;
  fecha_fin: string;
};

/** Campos de coste de un gasto recurrente (se usan en Actividades y en Gastos). */
export default function CamposRecurrente({
  valor,
  onCambio,
  miembros,
  permitirPorSesion,
  repartoSegunConvenio,
  mostrarFechas = true,
}: {
  valor: DatosRecurrente;
  onCambio: (v: DatosRecurrente) => void;
  miembros: Perfil[];
  permitirPorSesion: boolean;
  repartoSegunConvenio: (pagador: string) => number;
  mostrarFechas?: boolean;
}) {
  const set = (cambios: Partial<DatosRecurrente>) => onCambio({ ...valor, ...cambios });
  const otro = miembros.find((m) => m.id !== valor.pagado_por);

  return (
    <div className="space-y-4">
      {permitirPorSesion && (
        <div>
          <label className="etiqueta">Cómo se paga</label>
          <div className="grid grid-cols-2 gap-1.5 bg-crema-100 p-1 rounded-xl">
            {([
              ["fija", "Cuota fija"],
              ["por_sesion", "Por sesión"],
            ] as const).map(([v, t]) => (
              <button key={v} type="button" onClick={() => set({ modo: v })}
                className={`h-10 rounded-lg text-sm font-semibold transition-colors ${
                  valor.modo === v ? "bg-white shadow-tarjeta text-salvia-800" : "text-carbon-suave"
                }`}>
                {t}
              </button>
            ))}
          </div>
          {valor.modo === "por_sesion" && (
            <p className="text-xs text-carbon-suave mt-1.5">
              Cada mes se calcula solo con las sesiones dadas (sin contar las canceladas) y se registra el día 1 del mes siguiente.
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="etiqueta">{valor.modo === "por_sesion" ? "Precio por sesión (€)" : "Importe (€)"}</label>
          <input type="number" inputMode="decimal" step="0.01" min="0.01" required className="campo"
            value={valor.importe} onChange={(e) => set({ importe: e.target.value })} placeholder="45,00" />
        </div>
        {valor.modo === "fija" ? (
          <div>
            <label className="etiqueta">Frecuencia</label>
            <select className="campo" value={valor.frecuencia}
              onChange={(e) => set({ frecuencia: e.target.value as DatosRecurrente["frecuencia"] })}>
              {Object.entries(FRECUENCIAS_GASTO).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
            </select>
          </div>
        ) : <div />}
        {valor.modo === "fija" && (
          <div>
            <label className="etiqueta">Día de cobro</label>
            <input type="number" min={1} max={31} required className="campo" value={valor.dia_cobro}
              onChange={(e) => set({ dia_cobro: Math.min(31, Math.max(1, Number(e.target.value) || 1)) })} />
          </div>
        )}
      </div>

      {mostrarFechas && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="etiqueta">Primera cuota (desde)</label>
            <input type="date" required className="campo" value={valor.fecha_inicio}
              onChange={(e) => set({ fecha_inicio: e.target.value })} />
          </div>
          <div>
            <label className="etiqueta">Última (opcional)</label>
            <input type="date" className="campo" value={valor.fecha_fin}
              onChange={(e) => set({ fecha_fin: e.target.value })} />
          </div>
        </div>
      )}

      <div>
        <label className="etiqueta">Meses sin cobro</label>
        <SelectorMeses valor={valor.meses_sin_cobro} onCambio={(m) => set({ meses_sin_cobro: m })} />
        <p className="text-xs text-carbon-suave mt-1.5">Esos meses no se genera cuota, todos los años.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="etiqueta">Quién paga al centro</label>
          <select className="campo" value={valor.pagado_por}
            onChange={(e) => set({ pagado_por: e.target.value, reparto_pct: repartoSegunConvenio(e.target.value) })}>
            {miembros.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
          </select>
        </div>
        <div>
          <label className="etiqueta">% para {otro?.nombre?.split(" ")[0] ?? "el otro"}</label>
          <input type="number" min={0} max={100} className="campo" value={valor.reparto_pct}
            onChange={(e) => set({ reparto_pct: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })} />
        </div>
      </div>
      <p className="text-xs text-carbon-suave -mt-2">
        Según vuestro convenio: {repartoSegunConvenio(valor.pagado_por)} %.
      </p>
    </div>
  );
}
