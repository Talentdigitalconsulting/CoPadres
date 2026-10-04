"use client";
import { DIAS_SEMANA, MESES_CORTOS, type HorarioDia } from "@/lib/tipos";

/**
 * Selector de recurrencia semanal: chips L–D y, por cada día elegido,
 * su hora de inicio y fin (pueden ser distintas por día).
 */
export function SelectorDias({
  valor,
  onCambio,
}: {
  valor: HorarioDia[];
  onCambio: (h: HorarioDia[]) => void;
}) {
  const ultimo = valor[valor.length - 1];
  const alternar = (dia: number) => {
    if (valor.some((h) => h.dia === dia)) onCambio(valor.filter((h) => h.dia !== dia));
    else
      onCambio(
        [...valor, { dia, inicio: ultimo?.inicio ?? "17:00", fin: ultimo?.fin ?? "18:00" }].sort((a, b) => a.dia - b.dia)
      );
  };
  const cambiarHora = (dia: number, campo: "inicio" | "fin", hora: string) =>
    onCambio(valor.map((h) => (h.dia === dia ? { ...h, [campo]: hora } : h)));
  const igualarTodos = () => {
    if (!valor.length) return;
    onCambio(valor.map((h) => ({ ...h, inicio: valor[0].inicio, fin: valor[0].fin })));
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-1.5">
        {DIAS_SEMANA.map((d) => {
          const activo = valor.some((h) => h.dia === d.dia);
          return (
            <button key={d.dia} type="button" onClick={() => alternar(d.dia)} aria-pressed={activo}
              aria-label={d.nombre}
              className={`flex-1 h-11 rounded-xl text-sm font-semibold border transition-colors ${
                activo
                  ? "bg-salvia-700 text-crema-50 border-salvia-700"
                  : "bg-white text-carbon-suave border-carbon-linea hover:bg-crema-100"
              }`}>
              {d.corto}
            </button>
          );
        })}
      </div>
      {valor.length > 0 && (
        <div className="space-y-2">
          {valor.map((h) => (
            <div key={h.dia} className="flex items-center gap-2">
              <span className="w-20 text-sm text-carbon-claro">{DIAS_SEMANA[h.dia - 1].nombre}</span>
              <input type="time" className="campo py-2" value={h.inicio} required
                onChange={(e) => cambiarHora(h.dia, "inicio", e.target.value)} aria-label="Hora de inicio" />
              <span className="text-carbon-suave">–</span>
              <input type="time" className="campo py-2" value={h.fin} required
                onChange={(e) => cambiarHora(h.dia, "fin", e.target.value)} aria-label="Hora de fin" />
            </div>
          ))}
          {valor.length > 1 && (
            <button type="button" onClick={igualarTodos} className="text-xs text-salvia-700 font-semibold hover:underline">
              Misma hora todos los días
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** Selector de meses (1–12) con atajos; marca los meses SIN actividad / SIN cobro. */
export function SelectorMeses({
  valor,
  onCambio,
}: {
  valor: number[];
  onCambio: (m: number[]) => void;
}) {
  const alternar = (m: number) =>
    onCambio(valor.includes(m) ? valor.filter((x) => x !== m) : [...valor, m].sort((a, b) => a - b));
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-6 gap-1.5">
        {MESES_CORTOS.map((nombre, i) => {
          const m = i + 1;
          const marcado = valor.includes(m);
          return (
            <button key={m} type="button" onClick={() => alternar(m)} aria-pressed={marcado}
              className={`h-10 rounded-xl text-xs font-semibold border capitalize transition-colors ${
                marcado
                  ? "bg-crema-300 text-carbon-suave border-crema-400 line-through"
                  : "bg-white text-carbon border-carbon-linea hover:bg-crema-100"
              }`}>
              {nombre}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-1.5">
        <button type="button" className="chip border border-carbon-linea bg-white text-carbon-suave hover:bg-crema-100"
          onClick={() => onCambio([7, 8])}>Julio y agosto libres</button>
        <button type="button" className="chip border border-carbon-linea bg-white text-carbon-suave hover:bg-crema-100"
          onClick={() => onCambio([])}>Todo el año</button>
      </div>
    </div>
  );
}
