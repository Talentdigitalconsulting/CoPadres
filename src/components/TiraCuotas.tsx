"use client";
import { MESES_CORTOS } from "@/lib/tipos";
import type { CuotaMes, EstadoCuota } from "@/lib/recurrencias";
import { euros } from "@/lib/utils";

const ESTILO: Record<EstadoCuota, { circulo: string; signo: string; texto: string }> = {
  registrada: { circulo: "bg-salvia-600 text-crema-50 border-salvia-600", signo: "✓", texto: "Registrada" },
  proxima: { circulo: "bg-white text-salvia-700 border-salvia-600 border-2", signo: "", texto: "Próxima" },
  en_espera: { circulo: "bg-white text-arcilla border-arcilla border-2 border-dashed", signo: "…", texto: "En espera de aprobación" },
  omitida: { circulo: "bg-white text-carbon-suave border-carbon-suave border-2 border-dashed", signo: "–", texto: "No se paga" },
  sin_cobro: { circulo: "bg-crema-300 text-carbon-suave border-crema-300", signo: "–", texto: "Mes sin cobro" },
  pausa: { circulo: "bg-crema-200 text-carbon-suave border-crema-400", signo: "II", texto: "En pausa" },
  anulada: { circulo: "bg-white text-vino border-vino/40 line-through", signo: "×", texto: "Anulada" },
  fuera: { circulo: "bg-transparent text-carbon-linea border-transparent", signo: "·", texto: "No hay cuota" },
};

export const ETIQUETA_CUOTA = Object.fromEntries(
  Object.entries(ESTILO).map(([k, v]) => [k, v.texto])
) as Record<EstadoCuota, string>;

/** Fila de 12 meses con el estado de cada cuota. Tocar un mes abre sus acciones. */
export default function TiraCuotas({
  cuotas,
  onSeleccionar,
}: {
  cuotas: CuotaMes[];
  onSeleccionar?: (c: CuotaMes) => void;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1" role="list">
      {cuotas.map((c, i) => {
        const e = ESTILO[c.estado];
        const mesNum = c.mes.getMonth();
        const tocable = onSeleccionar && c.estado !== "fuera";
        return (
          <button key={c.periodo} type="button" role="listitem" disabled={!tocable}
            onClick={() => tocable && onSeleccionar(c)}
            aria-label={`${MESES_CORTOS[mesNum]} ${c.mes.getFullYear()}: ${e.texto}${c.importe ? `, ${euros(c.importe)}` : ""}`}
            className="flex flex-col items-center gap-1 min-w-[2.6rem] disabled:cursor-default group">
            <span className="text-[10px] uppercase tracking-wide text-carbon-suave">
              {MESES_CORTOS[mesNum]}
              <span className="block text-[9px] -mt-0.5 h-3">{mesNum === 0 || i === 0 ? c.mes.getFullYear() : ""}</span>
            </span>
            <span className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold transition-transform ${
              e.circulo} ${tocable ? "group-hover:scale-110" : ""}`}>
              {e.signo}
            </span>
            <span className="text-[9px] text-carbon-suave h-3 whitespace-nowrap">
              {c.importe && c.estado !== "fuera" ? Math.round(c.importe) + " €" : ""}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Leyenda compacta de la tira. */
export function LeyendaCuotas() {
  const claves: EstadoCuota[] = ["registrada", "proxima", "omitida", "sin_cobro", "pausa", "anulada"];
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-carbon-suave">
      {claves.map((k) => (
        <span key={k} className="flex items-center gap-1">
          <span className={`w-3 h-3 rounded-full border ${ESTILO[k].circulo}`} />
          {ESTILO[k].texto}
        </span>
      ))}
    </div>
  );
}
