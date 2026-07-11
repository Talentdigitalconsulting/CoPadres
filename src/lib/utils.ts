import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

/** Formatea una fecha ISO como "12 de julio de 2026". */
export function fechaLarga(iso: string) {
  return format(parseISO(iso), "d 'de' MMMM 'de' yyyy", { locale: es });
}

/** Formatea una fecha ISO como "12/07/2026". */
export function fechaCorta(iso: string) {
  return format(parseISO(iso), "dd/MM/yyyy");
}

/** Formatea fecha y hora: "12/07/2026 a las 18:32". */
export function fechaHora(iso: string) {
  return format(parseISO(iso), "dd/MM/yyyy 'a las' HH:mm");
}

/** Formatea un importe en euros. */
export function euros(n: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);
}

/** Devuelve las iniciales de un nombre para el avatar. */
export function iniciales(nombre?: string | null) {
  if (!nombre) return "?";
  return nombre
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
