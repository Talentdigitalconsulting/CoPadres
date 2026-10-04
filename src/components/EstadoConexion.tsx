"use client";

/**
 * Aviso de conexión de la app:
 *  - Sin internet: se puede seguir registrando; se guarda cifrado en el
 *    dispositivo y se sube solo después.
 *  - Al volver la conexión: sube los cambios pendientes y lo confirma.
 *  - Si el servidor rechaza algún cambio, lo explica.
 * También pide al service worker que deje preparadas las pantallas de la app
 * para poder abrirlas sin conexión.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { crearClienteNavegador } from "@/lib/supabase/client";
import {
  EVENTO_COLA, contarPendientes, descartarFallidos, listarFallidos, listarPendientes, sincronizar,
  type Fallido, type ResumenPendiente,
} from "@/lib/offline/sinConexion";

const PANTALLAS = [
  "/app", "/app/calendario", "/app/hijos", "/app/gastos", "/app/mensajes",
  "/app/diario", "/app/informes", "/app/asistente", "/app/notificaciones", "/app/ajustes",
];

const hora = (t: number) =>
  new Date(t).toLocaleString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default function EstadoConexion() {
  const [enLinea, setEnLinea] = useState(true);
  const [pendientes, setPendientes] = useState(0);
  const [subiendo, setSubiendo] = useState(false);
  const [subidos, setSubidos] = useState(0);
  const [fallidos, setFallidos] = useState<Fallido[]>([]);
  const [verLista, setVerLista] = useState(false);
  const [lista, setLista] = useState<ResumenPendiente[]>([]);
  const ocupado = useRef(false);

  const refrescar = useCallback(async () => {
    try {
      setPendientes(await contarPendientes());
      setFallidos(await listarFallidos());
    } catch {
      /* IndexedDB no disponible (p. ej. navegación privada antigua) */
    }
  }, []);

  const subir = useCallback(async () => {
    if (ocupado.current || !navigator.onLine) return;
    if ((await contarPendientes().catch(() => 0)) === 0) return;
    ocupado.current = true;
    setSubiendo(true);
    try {
      const supabase = crearClienteNavegador();
      const r = await sincronizar(async () => (await supabase.auth.getSession()).data.session?.access_token ?? null);
      if (r.subidos > 0) setSubidos((n) => n + r.subidos);
    } catch {
      /* se reintenta en el próximo aviso */
    } finally {
      ocupado.current = false;
      setSubiendo(false);
      void refrescar();
    }
  }, [refrescar]);

  useEffect(() => {
    setEnLinea(navigator.onLine);
    void refrescar();
    void subir();

    const alConectar = () => { setEnLinea(true); void subir(); };
    const alDesconectar = () => setEnLinea(false);
    const alVolver = () => { if (document.visibilityState === "visible") void subir(); };
    const alCambiarCola = () => void refrescar();
    window.addEventListener("online", alConectar);
    window.addEventListener("offline", alDesconectar);
    document.addEventListener("visibilitychange", alVolver);
    window.addEventListener(EVENTO_COLA, alCambiarCola);
    const reloj = window.setInterval(() => void subir(), 45_000);

    // Dejar listas las pantallas de la app para abrirlas sin conexión.
    if (navigator.onLine && "serviceWorker" in navigator) {
      navigator.serviceWorker.ready
        .then((reg) => reg.active?.postMessage({ tipo: "precargar", rutas: PANTALLAS }))
        .catch(() => {});
    }

    return () => {
      window.removeEventListener("online", alConectar);
      window.removeEventListener("offline", alDesconectar);
      document.removeEventListener("visibilitychange", alVolver);
      window.removeEventListener(EVENTO_COLA, alCambiarCola);
      window.clearInterval(reloj);
    };
  }, [refrescar, subir]);

  useEffect(() => {
    if (verLista) listarPendientes().then(setLista).catch(() => setLista([]));
  }, [verLista, pendientes]);

  const mostrarPendientes = !enLinea || pendientes > 0;
  if (!mostrarPendientes && subidos === 0 && fallidos.length === 0) return null;

  return (
    <div className="mb-5 space-y-3 no-imprimir" aria-live="polite">
      {mostrarPendientes && (
        <div className={`rounded-tarjeta border p-4 text-sm ${enLinea ? "border-salvia-200 bg-salvia-50" : "border-arcilla/40 bg-[#fbf1ea]"}`}>
          <div className="flex items-start gap-3">
            <span
              className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${enLinea ? "bg-salvia-500 animate-pulse" : "bg-arcilla"}`}
              aria-hidden
            />
            <div className="flex-1">
              {enLinea ? (
                <p className="font-semibold text-carbon">
                  {subiendo ? "Subiendo" : "Pendiente de subir:"} {pendientes} {pendientes === 1 ? "cambio guardado" : "cambios guardados"} sin conexión…
                </p>
              ) : (
                <>
                  <p className="font-semibold text-carbon">Sin conexión</p>
                  <p className="mt-0.5 text-carbon-claro">
                    Puedes seguir registrando gastos, el diario, mensajes o cambios del calendario. Se guardan cifrados en este
                    dispositivo y se subirán solos a tu cuenta en cuanto vuelva internet.
                  </p>
                </>
              )}
              {pendientes > 0 && (
                <button
                  type="button"
                  onClick={() => setVerLista(!verLista)}
                  aria-expanded={verLista}
                  className="mt-2 text-xs font-semibold text-salvia-700 underline underline-offset-2"
                >
                  {verLista ? "Ocultar" : `Ver ${pendientes === 1 ? "el cambio pendiente" : `los ${pendientes} cambios pendientes`}`}
                </button>
              )}
              {verLista && (
                <ul className="mt-2 divide-y divide-carbon-linea/60 rounded-xl bg-white/70 px-3 text-xs">
                  {lista.map((p, i) => (
                    <li key={i} className="flex justify-between gap-3 py-2">
                      <span className="text-carbon">{p.resumen}</span>
                      <span className="shrink-0 text-carbon-suave">{hora(p.creado)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {subidos > 0 && pendientes === 0 && enLinea && (
        <div className="flex flex-wrap items-center gap-3 rounded-tarjeta border border-salvia-200 bg-salvia-50 p-4 text-sm">
          <p className="flex-1 text-carbon">
            <strong>{subidos === 1 ? "1 cambio guardado" : `${subidos} cambios guardados`} online.</strong>{" "}
            <span className="text-carbon-claro">Ya está en tu cuenta y lo ve el otro progenitor. La fecha registrada es la de la subida.</span>
          </p>
          <button type="button" className="boton-suave text-xs" onClick={() => window.location.reload()}>
            Actualizar
          </button>
          <button type="button" className="text-xs text-carbon-suave" onClick={() => setSubidos(0)}>
            Cerrar
          </button>
        </div>
      )}

      {fallidos.length > 0 && (
        <div className="rounded-tarjeta border border-vino/30 bg-[#f8ecea] p-4 text-sm" role="alert">
          <p className="font-semibold text-carbon">
            {fallidos.length === 1 ? "Un cambio no se pudo guardar" : `${fallidos.length} cambios no se pudieron guardar`}
          </p>
          <p className="mt-0.5 text-carbon-claro">
            Se hicieron sin conexión y, al subirlos, la base de datos los rechazó (por ejemplo, porque el otro progenitor ya
            había cambiado lo mismo). Revísalos y vuelve a registrarlos si hace falta.
          </p>
          <ul className="mt-2 space-y-1 text-xs">
            {fallidos.map((f) => (
              <li key={f.id}>
                <span className="text-carbon">{f.resumen}</span>{" "}
                <span className="text-carbon-suave">· {hora(f.creado)} · {f.motivo}</span>
              </li>
            ))}
          </ul>
          <button type="button" className="mt-3 boton-secundario text-xs" onClick={() => void descartarFallidos()}>
            Entendido
          </button>
        </div>
      )}
    </div>
  );
}
