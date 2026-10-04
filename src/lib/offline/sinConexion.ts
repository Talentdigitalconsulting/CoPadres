/**
 * Modo sin conexión de CoPadres.
 *
 * Se instala como `fetch` del cliente de Supabase en el navegador:
 *  - Lecturas: si hay red, se usan y se guarda una copia CIFRADA; sin red, se
 *    sirve la última copia para poder seguir consultando.
 *  - Escrituras (gastos, diario, mensajes, calendario, actividades…): si no hay
 *    red, se guardan CIFRADAS en una cola del dispositivo y la app sigue como
 *    si se hubieran enviado. En cuanto vuelve internet se suben solas a
 *    Supabase, en el mismo orden, con la sesión vigente.
 *
 * Nunca se guardan tokens de sesión. Al cerrar sesión se borran las copias de
 * lectura; los cambios pendientes se conservan cifrados y solo se suben con la
 * cuenta que los creó.
 */

import { aBase64, cifrar, deBase64, descifrar, resumen, type Cifrado } from "./cifrado";
import { borrar, claves, contar, disponible, obtener, poner, todos, vaciar } from "./idb";

const SUPA = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const MAX_CACHE = 400;
const MAX_ADJUNTO = 15 * 1024 * 1024;

export const EVENTO_COLA = "copadres:cola";

/** Tablas cuyos cambios pueden hacerse sin conexión. (Invitaciones, cuenta y pagos exigen red.) */
const ETIQUETAS: Record<string, string> = {
  gastos: "Gasto",
  mensajes: "Mensaje",
  diario: "Entrada del diario",
  eventos_custodia: "Cambio de custodia",
  solicitudes_cambio: "Solicitud de cambio",
  actividades: "Actividad",
  actividad_excepciones: "Cambio en una sesión",
  gastos_recurrentes: "Gasto recurrente",
  gastos_recurrentes_omisiones: "Mes sin cobro",
  hijos: "Datos de un hijo",
  notificaciones: "Notificación leída",
  perfiles: "Tu perfil",
  familias: "Ajustes de la familia",
};
const BUCKET_OFFLINE = "comprobantes";

type CuerpoSerializado =
  | null
  | { tipo: "texto"; valor: string }
  | { tipo: "bytes"; datos: string; mime?: string }
  | { tipo: "form"; partes: ({ k: string; v: string } | { k: string; datos: string; mime: string; nombre: string })[] };

type Pendiente = {
  url: string;
  metodo: string;
  cabeceras: Record<string, string>;
  cuerpo: CuerpoSerializado;
  usuario: string;
  resumen: string;
  creado: number;
};

type RegistroCola = { id?: number; usuario: string; creado: number; c: Cifrado };
type RegistroFallido = { id?: number; usuario: string; c: Cifrado };
export type Fallido = { id: number; resumen: string; motivo: string; creado: number };
export type ResumenPendiente = { resumen: string; creado: number };

const fetchNativo: typeof fetch = (...a) => globalThis.fetch(...a);

// ----------------------------------------------------------------------------
// Utilidades
// ----------------------------------------------------------------------------

function usuarioDelToken(cabeceras: Headers): string | null {
  const token = cabeceras.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token || token.split(".").length !== 3) return null;
  try {
    const carga = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return carga.role === "authenticated" && typeof carga.sub === "string" ? carga.sub : null;
  } catch {
    return null;
  }
}

let usuarioActivo: string | null = null;
async function recordarUsuario(u: string) {
  if (u === usuarioActivo) return;
  usuarioActivo = u;
  await poner("meta", u, "usuario").catch(() => {});
}
async function usuarioConocido(): Promise<string | null> {
  if (usuarioActivo) return usuarioActivo;
  usuarioActivo = (await obtener<string>("meta", "usuario").catch(() => undefined)) ?? null;
  return usuarioActivo;
}

function avisar() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENTO_COLA));
}

function esErrorDeRed(e: unknown) {
  return e instanceof TypeError || (e instanceof DOMException && e.name === "NetworkError");
}

function sinRed() {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

function respuestaJSON(valor: unknown, estado = 200) {
  return new Response(JSON.stringify(valor), {
    status: estado,
    headers: { "Content-Type": "application/json", "x-copadres-sin-conexion": "1" },
  });
}

/** Qué se puede encolar: tabla de la lista, o subida de un comprobante. */
function destinoEncolable(url: URL, metodo: string): { tabla: string } | { almacenamiento: true } | null {
  const ruta = url.pathname;
  if (ruta.startsWith("/rest/v1/")) {
    const tabla = ruta.slice("/rest/v1/".length);
    if (tabla.startsWith("rpc/") || !(tabla in ETIQUETAS)) return null;
    return ["POST", "PATCH", "DELETE"].includes(metodo) ? { tabla } : null;
  }
  if (ruta.startsWith(`/storage/v1/object/${BUCKET_OFFLINE}/`) && (metodo === "POST" || metodo === "PUT")) {
    return { almacenamiento: true };
  }
  return null;
}

async function serializar(cuerpo: BodyInit | null | undefined): Promise<CuerpoSerializado> {
  if (cuerpo == null) return null;
  if (typeof cuerpo === "string") return { tipo: "texto", valor: cuerpo };
  if (cuerpo instanceof FormData) {
    const partes: Extract<CuerpoSerializado, { tipo: "form" }>["partes"] = [];
    for (const [k, v] of cuerpo.entries()) {
      if (typeof v === "string") partes.push({ k, v });
      else {
        if (v.size > MAX_ADJUNTO) throw new Error("adjunto-demasiado-grande");
        partes.push({ k, datos: aBase64(await v.arrayBuffer()), mime: v.type, nombre: v.name });
      }
    }
    return { tipo: "form", partes };
  }
  if (cuerpo instanceof Blob) {
    if (cuerpo.size > MAX_ADJUNTO) throw new Error("adjunto-demasiado-grande");
    return { tipo: "bytes", datos: aBase64(await cuerpo.arrayBuffer()), mime: cuerpo.type };
  }
  if (cuerpo instanceof ArrayBuffer) return { tipo: "bytes", datos: aBase64(cuerpo) };
  if (ArrayBuffer.isView(cuerpo)) {
    const copia = new Uint8Array(cuerpo.byteLength);
    copia.set(new Uint8Array(cuerpo.buffer, cuerpo.byteOffset, cuerpo.byteLength));
    return { tipo: "bytes", datos: aBase64(copia.buffer) };
  }
  if (cuerpo instanceof URLSearchParams) return { tipo: "texto", valor: cuerpo.toString() };
  throw new Error("cuerpo-no-admitido");
}

function deserializar(c: CuerpoSerializado): BodyInit | null {
  if (!c) return null;
  if (c.tipo === "texto") return c.valor;
  if (c.tipo === "bytes") return new Blob([deBase64(c.datos)], { type: c.mime ?? "" });
  const f = new FormData();
  for (const p of c.partes) {
    if ("v" in p) f.append(p.k, p.v);
    else f.append(p.k, new Blob([deBase64(p.datos)], { type: p.mime }), p.nombre);
  }
  return f;
}

function describir(destino: { tabla: string } | { almacenamiento: true }, metodo: string, datos: unknown): string {
  if ("almacenamiento" in destino) return "Comprobante de un gasto";
  const base = ETIQUETAS[destino.tabla] ?? "Cambio";
  const fila = (Array.isArray(datos) ? datos[0] : datos) as Record<string, unknown> | null;
  const detalle = fila
    ? [fila.concepto, fila.titulo, fila.nombre, typeof fila.texto === "string" ? `«${fila.texto.slice(0, 40)}»` : null]
        .find((x) => typeof x === "string" && x)
    : null;
  const importe = fila && typeof fila.importe === "number" ? ` · ${fila.importe.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €` : "";
  const accion = metodo === "DELETE" ? "Borrado: " : metodo === "PATCH" ? "Cambio: " : "";
  return `${accion}${base}${detalle ? ` — ${detalle}` : ""}${importe}`;
}

// ----------------------------------------------------------------------------
// Copias de lectura
// ----------------------------------------------------------------------------

type CopiaLectura = { estado: number; cabeceras: Record<string, string>; cuerpo: string };

async function claveLectura(usuario: string, metodo: string, url: string, cab: Headers) {
  return resumen([usuario, metodo, url, cab.get("Accept") ?? "", cab.get("Prefer") ?? ""].join("|"));
}

async function guardarLectura(usuario: string, metodo: string, url: string, cab: Headers, res: Response) {
  try {
    const copia: CopiaLectura = {
      estado: res.status,
      cabeceras: Object.fromEntries(
        ["content-type", "content-range"].flatMap((h) => (res.headers.get(h) ? [[h, res.headers.get(h)!]] : []))
      ),
      cuerpo: metodo === "HEAD" ? "" : await res.clone().text(),
    };
    const k = await claveLectura(usuario, metodo, url, cab);
    await poner("cache", { usuario, fecha: Date.now(), c: await cifrar(copia) }, k);
    // Poda: se conservan solo las copias más recientes.
    if ((await contar("cache")) > MAX_CACHE) {
      const ks = await claves("cache");
      const regs = await todos<{ fecha: number }>("cache");
      const orden = ks.map((k2, i) => ({ k: k2, f: regs[i]?.fecha ?? 0 })).sort((a, b) => a.f - b.f);
      for (const { k: viejo } of orden.slice(0, orden.length - MAX_CACHE + 50)) await borrar("cache", viejo);
    }
  } catch {
    /* sin copia: no pasa nada */
  }
}

async function leerCopia(usuario: string, metodo: string, url: string, cab: Headers): Promise<Response | null> {
  try {
    const reg = await obtener<{ usuario: string; c: Cifrado }>("cache", await claveLectura(usuario, metodo, url, cab));
    if (!reg || reg.usuario !== usuario) return null;
    const copia = await descifrar<CopiaLectura>(reg.c);
    return new Response(metodo === "HEAD" ? null : copia.cuerpo, {
      status: copia.estado,
      headers: { ...copia.cabeceras, "x-copadres-sin-conexion": "1" },
    });
  } catch {
    return null;
  }
}

// ----------------------------------------------------------------------------
// Cola de cambios
// ----------------------------------------------------------------------------

async function encolar(
  url: URL,
  metodo: string,
  cab: Headers,
  cuerpo: BodyInit | null | undefined,
  usuario: string,
  destino: { tabla: string } | { almacenamiento: true }
): Promise<Response> {
  let serial = await serializar(cuerpo);
  let filas: unknown = null;

  // Inserciones: se asigna ya el identificador definitivo. Así la app puede
  // usarlo (p. ej. una actividad y su gasto recurrente) y, si el envío original
  // llegó a la base de datos, al repetirlo no se duplica (conflicto = ya estaba).
  if ("tabla" in destino && serial?.tipo === "texto") {
    try {
      filas = JSON.parse(serial.valor);
      if (metodo === "POST") {
        const conId = (f: unknown) =>
          f && typeof f === "object" && !Array.isArray(f) && !("id" in f) ? { id: crypto.randomUUID(), ...f } : f;
        filas = Array.isArray(filas) ? filas.map(conId) : conId(filas);
        serial = { tipo: "texto", valor: JSON.stringify(filas) };
      }
    } catch {
      /* cuerpo no JSON: se envía tal cual */
    }
  }

  const cabeceras: Record<string, string> = {};
  for (const h of ["Content-Type", "Prefer", "Accept", "Content-Profile", "Accept-Profile", "x-upsert", "cache-control"]) {
    const v = cab.get(h);
    if (v) cabeceras[h] = v;
  }
  if (serial?.tipo === "form") delete cabeceras["Content-Type"]; // se regenera con su separador al reenviar

  const pendiente: Pendiente = {
    url: url.toString(),
    metodo,
    cabeceras,
    cuerpo: serial,
    usuario,
    resumen: describir(destino, metodo, filas),
    creado: Date.now(),
  };
  const reg: RegistroCola = { usuario, creado: pendiente.creado, c: await cifrar(pendiente) };
  await poner("cola", reg);
  avisar();

  // Respuesta equivalente a la de Supabase para que la pantalla continúe.
  if ("almacenamiento" in destino) {
    const ruta = url.pathname.replace("/storage/v1/object/", "");
    return respuestaJSON({ Key: ruta, Id: crypto.randomUUID(), path: ruta.slice(BUCKET_OFFLINE.length + 1) }, 200);
  }
  const prefer = cab.get("Prefer") ?? "";
  if (prefer.includes("return=representation")) {
    const lista = metodo === "POST" && filas ? (Array.isArray(filas) ? filas : [filas]) : [];
    if ((cab.get("Accept") ?? "").includes("vnd.pgrst.object")) {
      return lista.length === 1
        ? respuestaJSON(lista[0], 201)
        : respuestaJSON({ code: "OFFLINE", message: "Guardado sin conexión" }, 406);
    }
    return respuestaJSON(lista, metodo === "POST" ? 201 : 200);
  }
  return new Response(null, { status: metodo === "POST" ? 201 : 204, headers: { "x-copadres-sin-conexion": "1" } });
}

/** `fetch` para el cliente de Supabase del navegador. */
export const fetchSinConexion: typeof fetch = async (entrada, opciones) => {
  if (!disponible() || !SUPA) return fetchNativo(entrada, opciones);

  const peticion = entrada instanceof Request ? entrada : null;
  const urlTexto = peticion ? peticion.url : entrada.toString();
  if (!urlTexto.startsWith(SUPA)) return fetchNativo(entrada, opciones);

  const url = new URL(urlTexto);
  const metodo = (opciones?.method ?? peticion?.method ?? "GET").toUpperCase();
  const cab = new Headers(opciones?.headers ?? peticion?.headers);
  const usuarioToken = usuarioDelToken(cab);
  if (usuarioToken) void recordarUsuario(usuarioToken);

  // --- Lecturas de datos y del usuario actual ---
  const esLectura =
    (metodo === "GET" || metodo === "HEAD") &&
    (url.pathname.startsWith("/rest/v1/") || url.pathname === "/auth/v1/user");
  if (esLectura) {
    const usuario = usuarioToken ?? (await usuarioConocido());
    try {
      const res = await fetchNativo(entrada, opciones);
      if (usuario && usuarioToken && res.ok) void guardarLectura(usuario, metodo, urlTexto, cab, res);
      return res;
    } catch (e) {
      if (esErrorDeRed(e) && usuario) {
        const copia = await leerCopia(usuario, metodo, urlTexto, cab);
        if (copia) return copia;
      }
      throw e;
    }
  }

  // --- Escrituras ---
  const destino = destinoEncolable(url, metodo);
  if (!destino) return fetchNativo(entrada, opciones);
  const usuario = usuarioToken ?? (await usuarioConocido());
  if (!usuario) return fetchNativo(entrada, opciones);

  const cuerpo = opciones?.body ?? (peticion ? await peticion.clone().blob() : null);
  if (sinRed()) return encolar(url, metodo, cab, cuerpo, usuario, destino);
  try {
    return await fetchNativo(entrada, opciones);
  } catch (e) {
    if (!esErrorDeRed(e)) throw e;
    return encolar(url, metodo, cab, cuerpo, usuario, destino);
  }
};

// ----------------------------------------------------------------------------
// Sincronización
// ----------------------------------------------------------------------------

export type ResultadoSync = { subidos: number; fallidos: number; pendientes: number };
let enCurso: Promise<ResultadoSync> | null = null;

/**
 * Sube los cambios pendientes del usuario con sesión iniciada. `token` es el
 * access token vigente de Supabase (se pide justo antes para que esté fresco).
 */
export function sincronizar(token: () => Promise<string | null>): Promise<ResultadoSync> {
  if (!enCurso) {
    const tarea = async (): Promise<ResultadoSync> => {
      let subidos = 0;
      let fallidos = 0;
      if (!disponible() || sinRed()) return { subidos, fallidos, pendientes: await contarPendientes() };
      const t = await token();
      const usuario = t ? usuarioDelToken(new Headers({ Authorization: `Bearer ${t}` })) : null;
      if (!t || !usuario) return { subidos, fallidos, pendientes: await contarPendientes() };

      const cola = (await todos<RegistroCola>("cola"))
        .filter((r) => r.usuario === usuario)
        .sort((a, b) => (a.id ?? 0) - (b.id ?? 0));

      for (const reg of cola) {
        let p: Pendiente;
        try {
          p = await descifrar<Pendiente>(reg.c);
        } catch {
          await borrar("cola", reg.id!); // ilegible (clave perdida): no se puede reenviar
          continue;
        }
        let res: Response;
        try {
          res = await fetchNativo(p.url, {
            method: p.metodo,
            headers: { ...p.cabeceras, apikey: ANON, Authorization: `Bearer ${t}` },
            body: deserializar(p.cuerpo),
          });
        } catch {
          break; // sin red otra vez: se reintenta más tarde
        }
        const yaEstaba = res.status === 409 || (res.status === 400 && /already exists|Duplicate/i.test(await res.clone().text()));
        if (res.ok || yaEstaba) {
          await borrar("cola", reg.id!);
          subidos++;
        } else if (res.status === 401 || res.status === 429 || res.status >= 500) {
          break; // sesión caducada o servidor ocupado: se reintenta más tarde
        } else {
          let motivo = `Error ${res.status}`;
          try {
            const j = await res.json();
            motivo = j.message ?? j.error ?? motivo;
          } catch {
            /* sin detalle */
          }
          const fallido = { resumen: p.resumen, motivo, creado: p.creado };
          await poner("fallidos", { usuario, c: await cifrar(fallido) } satisfies RegistroFallido);
          await borrar("cola", reg.id!);
          fallidos++;
        }
        avisar();
      }
      return { subidos, fallidos, pendientes: await contarPendientes() };
    };
    // Un solo envío a la vez aunque haya varias pestañas abiertas.
    const conBloqueo: Promise<ResultadoSync> =
      typeof navigator !== "undefined" && navigator.locks
        ? navigator.locks.request("copadres-sincronizar", () => tarea()).then((r) => r)
        : tarea();
    enCurso = conBloqueo.finally(() => {
      enCurso = null;
      avisar();
    });
  }
  return enCurso as Promise<ResultadoSync>;
}

// ----------------------------------------------------------------------------
// Consultas para la interfaz
// ----------------------------------------------------------------------------

async function usuarioParaListas() {
  return usuarioConocido();
}

export async function contarPendientes(): Promise<number> {
  if (!disponible()) return 0;
  const u = await usuarioParaListas();
  return (await todos<RegistroCola>("cola")).filter((r) => !u || r.usuario === u).length;
}

export async function listarPendientes(): Promise<ResumenPendiente[]> {
  if (!disponible()) return [];
  const u = await usuarioParaListas();
  const regs = (await todos<RegistroCola>("cola")).filter((r) => !u || r.usuario === u);
  const lista: ResumenPendiente[] = [];
  for (const r of regs) {
    try {
      const p = await descifrar<Pendiente>(r.c);
      lista.push({ resumen: p.resumen, creado: p.creado });
    } catch {
      /* ilegible */
    }
  }
  return lista;
}

export async function listarFallidos(): Promise<Fallido[]> {
  if (!disponible()) return [];
  const u = await usuarioParaListas();
  const regs = (await todos<RegistroFallido>("fallidos")).filter((r) => !u || r.usuario === u);
  const lista: Fallido[] = [];
  for (const r of regs) {
    try {
      lista.push({ id: r.id!, ...(await descifrar<Omit<Fallido, "id">>(r.c)) });
    } catch {
      /* ilegible */
    }
  }
  return lista;
}

export async function descartarFallidos() {
  if (!disponible()) return;
  const u = await usuarioParaListas();
  for (const r of await todos<RegistroFallido>("fallidos")) if (!u || r.usuario === u) await borrar("fallidos", r.id!);
  avisar();
}

/**
 * Al cerrar sesión: borra las copias de lectura y las páginas guardadas.
 * Los cambios pendientes se quedan (cifrados) hasta que su autor vuelva a entrar.
 */
export async function limpiarDatosLocales() {
  usuarioActivo = null;
  if (disponible()) {
    await vaciar("cache").catch(() => {});
    await borrar("meta", "usuario").catch(() => {});
  }
  if (typeof navigator !== "undefined" && navigator.serviceWorker?.controller) {
    navigator.serviceWorker.controller.postMessage({ tipo: "limpiar" });
  }
  avisar();
}
