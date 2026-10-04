"use client";
import { useEffect } from "react";

/** Hoja inferior en móvil / ventana centrada en escritorio. */
export default function HojaInferior({
  abierta,
  onCerrar,
  titulo,
  children,
}: {
  abierta: boolean;
  onCerrar: () => void;
  titulo: string;
  children: React.ReactNode;
}) {
  // Cerrar con Escape.
  useEffect(() => {
    if (!abierta) return;
    const alPulsar = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  }, [abierta, onCerrar]);

  if (!abierta) return null;
  return (
    <div className="fixed inset-0 bg-carbon/40 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
      onClick={onCerrar}>
      <div onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={titulo}
        className="bg-white w-full max-w-lg rounded-t-3xl md:rounded-tarjeta shadow-flotante max-h-[92vh] overflow-y-auto">
        <div className="md:hidden flex justify-center pt-2.5">
          <span className="w-10 h-1 rounded-full bg-carbon-linea" />
        </div>
        <div className="p-6 pt-4 md:pt-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-display text-xl">{titulo}</h2>
            <button type="button" onClick={onCerrar} aria-label="Cerrar"
              className="text-carbon-suave hover:text-carbon text-2xl leading-none -mt-1">×</button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
