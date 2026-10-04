import { obtener, poner } from "./idb";

/**
 * Cifrado AES-GCM de 256 bits para todo lo que se guarda en el dispositivo.
 * La clave se genera en el propio navegador como NO exportable: ningún script
 * puede leer su valor, y fuera del navegador los datos guardados son ilegibles.
 */

export type Cifrado = { iv: Uint8Array; datos: ArrayBuffer };

let clave: Promise<CryptoKey> | null = null;

function obtenerClave(): Promise<CryptoKey> {
  if (!clave) {
    clave = (async () => {
      const existente = await obtener<CryptoKey>("meta", "clave");
      if (existente) return existente;
      const nueva = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
      await poner("meta", nueva, "clave");
      return nueva;
    })().catch((e) => {
      clave = null;
      throw e;
    });
  }
  return clave;
}

export async function cifrar(valor: unknown): Promise<Cifrado> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const datos = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    await obtenerClave(),
    new TextEncoder().encode(JSON.stringify(valor))
  );
  return { iv, datos };
}

export async function descifrar<T>(c: Cifrado): Promise<T> {
  const claro = await crypto.subtle.decrypt({ name: "AES-GCM", iv: c.iv as BufferSource }, await obtenerClave(), c.datos);
  return JSON.parse(new TextDecoder().decode(claro)) as T;
}

/** Resumen SHA-256 (para no guardar direcciones con identificadores en claro). */
export async function resumen(texto: string): Promise<string> {
  const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(texto));
  return Array.from(new Uint8Array(h), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function aBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

export function deBase64(b64: string): ArrayBuffer {
  const s = atob(b64);
  const bytes = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i);
  return bytes.buffer;
}
