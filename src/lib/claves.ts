"use client";

/**
 * Política de contraseñas de CoPadres:
 *  - mínimo 10 caracteres, con letras y números,
 *  - que no contenga tu nombre ni tu email,
 *  - que no aparezca en filtraciones conocidas (Have I Been Pwned).
 *
 * La comprobación de filtraciones usa "k-anonimato": solo se envían los
 * 5 primeros caracteres del hash SHA-1; la contraseña nunca sale del navegador.
 */
export const CLAVE_MINIMA = 10;

const COMUNES = ["copadres", "password", "contraseña", "contrasena", "qwerty", "123456", "abcdef", "iloveyou"];

export function problemasClave(clave: string, datos: { email?: string; nombre?: string } = {}): string[] {
  const problemas: string[] = [];
  if (clave.length < CLAVE_MINIMA) problemas.push(`Al menos ${CLAVE_MINIMA} caracteres.`);
  if (!/[a-zA-ZñÑáéíóúÁÉÍÓÚ]/.test(clave) || !/\d/.test(clave)) problemas.push("Combina letras y números.");
  const minus = clave.toLowerCase();
  const usuario = datos.email?.split("@")[0]?.toLowerCase();
  if (usuario && usuario.length >= 4 && minus.includes(usuario)) problemas.push("No uses tu email en la contraseña.");
  const nombre = datos.nombre?.split(" ")[0]?.toLowerCase();
  if (nombre && nombre.length >= 4 && minus.includes(nombre)) problemas.push("No uses tu nombre en la contraseña.");
  if (COMUNES.some((c) => minus.includes(c))) problemas.push("Evita palabras o secuencias muy comunes.");
  if (/^(.)\1+$/.test(clave)) problemas.push("No repitas el mismo carácter.");
  return problemas;
}

/** Puntuación orientativa 0–4 para el medidor visual. */
export function fuerzaClave(clave: string) {
  let p = 0;
  if (clave.length >= CLAVE_MINIMA) p++;
  if (clave.length >= 14) p++;
  if (/[a-z]/.test(clave) && /[A-Z]/.test(clave)) p++;
  if (/\d/.test(clave) && /[^a-zA-Z0-9]/.test(clave)) p++;
  return Math.min(4, p);
}

/** Número de veces que la contraseña aparece en filtraciones (0 si no aparece o si no hay conexión). */
export async function vecesFiltrada(clave: string): Promise<number> {
  try {
    const datos = new TextEncoder().encode(clave);
    const hash = await crypto.subtle.digest("SHA-1", datos);
    const hex = Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
    const prefijo = hex.slice(0, 5);
    const sufijo = hex.slice(5);
    const r = await fetch(`https://api.pwnedpasswords.com/range/${prefijo}`, { headers: { "Add-Padding": "true" } });
    if (!r.ok) return 0;
    const texto = await r.text();
    for (const linea of texto.split("\n")) {
      const [suf, veces] = linea.trim().split(":");
      if (suf === sufijo) return Number(veces) || 0;
    }
    return 0;
  } catch {
    return 0;
  }
}

/** Valida la contraseña completa; devuelve el primer problema o null si es válida. */
export async function validarClave(clave: string, datos: { email?: string; nombre?: string } = {}) {
  const problemas = problemasClave(clave, datos);
  if (problemas.length) return problemas[0];
  const veces = await vecesFiltrada(clave);
  if (veces > 0)
    return "Esta contraseña aparece en filtraciones de datos conocidas. Elige otra distinta.";
  return null;
}
