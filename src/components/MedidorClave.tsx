"use client";
import { fuerzaClave, problemasClave } from "@/lib/claves";

const TEXTOS = ["Muy débil", "Débil", "Aceptable", "Buena", "Muy buena"];
const COLORES = ["bg-vino", "bg-arcilla", "bg-crema-400", "bg-salvia-500", "bg-salvia-700"];

/** Medidor de fortaleza y requisitos de la contraseña. */
export default function MedidorClave({ clave, email, nombre }: { clave: string; email?: string; nombre?: string }) {
  if (!clave) return null;
  const f = fuerzaClave(clave);
  const problemas = problemasClave(clave, { email, nombre });
  return (
    <div className="mt-2 space-y-1.5" aria-live="polite">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full ${i < Math.max(1, f) ? COLORES[f] : "bg-carbon-linea"}`} />
        ))}
      </div>
      <p className="text-xs text-carbon-suave">
        {problemas.length ? problemas[0] : `Fortaleza: ${TEXTOS[f]}`}
      </p>
    </div>
  );
}
