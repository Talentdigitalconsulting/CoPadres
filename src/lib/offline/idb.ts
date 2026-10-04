/**
 * Envoltorio mínimo de IndexedDB para el modo sin conexión.
 *
 * Almacenes:
 *  - meta:     clave de cifrado (no exportable) y último usuario activo.
 *  - cache:    copias cifradas de las últimas lecturas (para ver datos sin conexión).
 *  - cola:     cambios cifrados pendientes de subir a Supabase.
 *  - fallidos: cambios que el servidor rechazó al subirlos (para avisar al usuario).
 */

export type Almacen = "meta" | "cache" | "cola" | "fallidos";

const NOMBRE = "copadres-sin-conexion";
const VERSION = 1;
let bd: Promise<IDBDatabase> | null = null;

export function disponible() {
  return typeof indexedDB !== "undefined" && typeof crypto !== "undefined" && !!crypto.subtle;
}

function abrir(): Promise<IDBDatabase> {
  if (!bd) {
    bd = new Promise((ok, ko) => {
      const r = indexedDB.open(NOMBRE, VERSION);
      r.onupgradeneeded = () => {
        const db = r.result;
        if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta");
        if (!db.objectStoreNames.contains("cache")) db.createObjectStore("cache");
        if (!db.objectStoreNames.contains("cola")) db.createObjectStore("cola", { keyPath: "id", autoIncrement: true });
        if (!db.objectStoreNames.contains("fallidos")) db.createObjectStore("fallidos", { keyPath: "id", autoIncrement: true });
      };
      r.onsuccess = () => ok(r.result);
      r.onerror = () => {
        bd = null;
        ko(r.error);
      };
    });
  }
  return bd;
}

async function peticion<T>(almacen: Almacen, modo: IDBTransactionMode, hacer: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  const db = await abrir();
  return new Promise<T>((ok, ko) => {
    const t = db.transaction(almacen, modo);
    const r = hacer(t.objectStore(almacen));
    t.oncomplete = () => ok(r.result as T);
    t.onerror = () => ko(t.error);
    t.onabort = () => ko(t.error);
  });
}

export const obtener = <T>(a: Almacen, clave: IDBValidKey) => peticion<T | undefined>(a, "readonly", (s) => s.get(clave));
export const poner = (a: Almacen, valor: unknown, clave?: IDBValidKey) =>
  peticion<IDBValidKey>(a, "readwrite", (s) => (clave === undefined ? s.put(valor) : s.put(valor, clave)));
export const borrar = (a: Almacen, clave: IDBValidKey) => peticion<undefined>(a, "readwrite", (s) => s.delete(clave));
export const todos = <T>(a: Almacen) => peticion<T[]>(a, "readonly", (s) => s.getAll());
export const claves = (a: Almacen) => peticion<IDBValidKey[]>(a, "readonly", (s) => s.getAllKeys());
export const contar = (a: Almacen) => peticion<number>(a, "readonly", (s) => s.count());
export const vaciar = (a: Almacen) => peticion<undefined>(a, "readwrite", (s) => s.clear());
