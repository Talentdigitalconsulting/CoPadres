/**
 * Datos legales de CoPadres en un único sitio (Aviso legal, Términos, Privacidad, pie).
 * Si cambia algún dato, se cambia aquí y se actualiza en toda la web.
 */
export const TITULAR = {
  nombre: "Jesús Bordas Reina",
  nif: "45946993P",
  nombreComercial: "Talent & Digital Consulting",
  domicilio: "C/ San Sebastián 15, 1º A",
  codigoPostal: "14500",
  localidad: "Puente Genil",
  provincia: "Córdoba",
  pais: "España",
  email: "contact.tadico@gmail.com",
} as const;

export const DOMICILIO_COMPLETO =
  `${TITULAR.domicilio}, ${TITULAR.codigoPostal} ${TITULAR.localidad} (${TITULAR.provincia}), ${TITULAR.pais}`;

/** Versión vigente de los textos legales (se guarda con cada consentimiento). */
export const VERSION_LEGAL = "2026-10-04";
export const FECHA_LEGAL = "4 de octubre de 2026";

export const ANIO_COPYRIGHT = 2026;

/** URL pública de la web (variable de Vercel NEXT_PUBLIC_SITE_URL). */
export function urlSitio() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://copadres.vercel.app").replace(/\/$/, "");
}
