import type { Hijo } from "@/lib/tipos";

/**
 * Color propio de cada hijo (suave y neutro, nunca rojo/verde).
 * Las clases están escritas completas para que Tailwind las incluya.
 */
const PALETA = [
  { bloque: "bg-salvia-100 border-salvia-500 text-salvia-900", punto: "bg-salvia-500", chip: "bg-salvia-100 text-salvia-800" },
  { bloque: "bg-[#f6e6dc] border-arcilla text-[#7a4527]", punto: "bg-arcilla", chip: "bg-[#f6e6dc] text-[#7a4527]" },
  { bloque: "bg-[#e3eaee] border-[#8fa3ad] text-[#3e5562]", punto: "bg-[#8fa3ad]", chip: "bg-[#e3eaee] text-[#3e5562]" },
  { bloque: "bg-[#efe6ea] border-[#b49aa6] text-[#634a56]", punto: "bg-[#b49aa6]", chip: "bg-[#efe6ea] text-[#634a56]" },
  { bloque: "bg-crema-200 border-crema-400 text-carbon-claro", punto: "bg-crema-400", chip: "bg-crema-200 text-carbon-claro" },
];

export function colorHijo(hijos: Hijo[], hijoId: string | null | undefined) {
  const i = hijos.findIndex((h) => h.id === hijoId);
  return PALETA[(i < 0 ? 4 : i) % PALETA.length];
}
