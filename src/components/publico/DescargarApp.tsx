"use client";

/**
 * Botón «Descargar versión móvil» + hoja de instalación.
 *
 * CoPadres es una app web instalable (PWA): se instala desde el propio navegador,
 * sin tiendas, y queda con su icono en la pantalla de inicio.
 *
 *  - Android (Chrome, Edge, Samsung Internet…): un toque y se instala
 *    (evento `beforeinstallprompt`, capturado pronto en app/layout.tsx).
 *  - iPhone / iPad: Apple no permite instalar por código; se muestran los pasos
 *    de «Añadir a pantalla de inicio», adaptados al navegador.
 *  - Ordenador: código QR para abrir la web en el móvil (y, si el navegador lo
 *    admite, instalarla también en el ordenador).
 *  - Si ya se está usando como app instalada, el botón no aparece.
 */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Plataforma = "ios" | "android" | "escritorio";
type NavegadorIOS = "safari" | "otro" | "integrado";

interface PromptInstalacion extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface Window {
    __copadresPrompt?: PromptInstalacion | null;
  }
}

function detectar(): { plataforma: Plataforma; navegadorIOS: NavegadorIOS } {
  const ua = navigator.userAgent;
  // iPadOS se presenta como un Mac con pantalla táctil.
  const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (ios) {
    // Navegadores dentro de otras apps (Instagram, Facebook, WhatsApp, TikTok…) no pueden instalar.
    const integrado = /FBAN|FBAV|Instagram|Line\/|WhatsApp|TikTok|musical_ly|GSA\//.test(ua);
    const otro = /CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
    return { plataforma: "ios", navegadorIOS: integrado ? "integrado" : otro ? "otro" : "safari" };
  }
  if (/Android/.test(ua)) return { plataforma: "android", navegadorIOS: "safari" };
  return { plataforma: "escritorio", navegadorIOS: "safari" };
}

export default function DescargarApp({ className = "" }: { className?: string }) {
  const [abierto, setAbierto] = useState(false);
  const [plataforma, setPlataforma] = useState<Plataforma>("escritorio");
  const [navegadorIOS, setNavegadorIOS] = useState<NavegadorIOS>("safari");
  const [puedeInstalar, setPuedeInstalar] = useState(false);
  const [yaInstalada, setYaInstalada] = useState(false);
  const [instalada, setInstalada] = useState(false);
  const cerrarRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const d = detectar();
    setPlataforma(d.plataforma);
    setNavegadorIOS(d.navegadorIOS);
    setYaInstalada(
      window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true
    );
    setPuedeInstalar(Boolean(window.__copadresPrompt));

    const alPoderInstalar = () => setPuedeInstalar(true);
    const alInstalar = () => {
      setInstalada(true);
      setPuedeInstalar(false);
    };
    window.addEventListener("copadres:instalable", alPoderInstalar);
    window.addEventListener("appinstalled", alInstalar);
    return () => {
      window.removeEventListener("copadres:instalable", alPoderInstalar);
      window.removeEventListener("appinstalled", alInstalar);
    };
  }, []);

  // Cerrar con Escape y llevar el foco al diálogo al abrirlo.
  useEffect(() => {
    if (!abierto) return;
    cerrarRef.current?.focus();
    const alTeclear = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false);
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [abierto]);

  if (yaInstalada) return null;

  async function instalar(): Promise<boolean> {
    const p = window.__copadresPrompt;
    if (!p) return false;
    window.__copadresPrompt = null;
    setPuedeInstalar(false);
    try {
      await p.prompt();
      const { outcome } = await p.userChoice;
      if (outcome === "accepted") {
        setInstalada(true);
        return true;
      }
    } catch {
      /* el navegador rechazó mostrar el aviso: se enseñan los pasos manuales */
    }
    return false;
  }

  async function alPulsar() {
    // En Android (y navegadores compatibles) la instalación empieza directamente.
    if (plataforma !== "escritorio" && window.__copadresPrompt) {
      const ok = await instalar();
      if (ok) {
        setAbierto(true); // muestra la confirmación
        return;
      }
    }
    setAbierto(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={alPulsar}
        aria-label="Descargar versión móvil"
        aria-haspopup="dialog"
        className={`boton-suave text-xs whitespace-nowrap px-3 sm:px-5 ${className}`}
      >
        <IconoMovil />
        <span className="hidden sm:inline">Descargar versión móvil</span>
        <span className="sm:hidden">App</span>
      </button>

      {/* El diálogo se monta en <body>: la cabecera usa backdrop-blur, que encerraría
          un elemento «fixed» dentro de sus 64 px de alto. */}
      {abierto && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-instalar"
          className="fixed inset-0 z-70 flex items-end justify-center sm:items-center"
        >
          <button
            type="button"
            aria-label="Cerrar"
            tabIndex={-1}
            onClick={() => setAbierto(false)}
            className="absolute inset-0 bg-carbon/40"
          />
          <div className="relative w-full max-w-md max-h-[92dvh] overflow-y-auto rounded-t-3xl bg-crema-50 p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-flotante sm:rounded-3xl">
            <div className="flex items-start gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/icon-192.png" alt="" aria-hidden className="h-14 w-14 flex-none" />
              <div className="flex-1">
                <h2 id="titulo-instalar" className="font-display text-xl text-carbon">
                  {instalada ? "¡CoPadres ya está en tu móvil!" : "CoPadres en tu móvil"}
                </h2>
                <p className="mt-1 text-sm leading-snug text-carbon-suave">
                  {instalada
                    ? "Búscala en tu pantalla de inicio con el icono de CoPadres."
                    : "Se instala como una app más, con su icono en la pantalla de inicio. Gratis, ocupa muy poco y no pasa por ninguna tienda."}
                </p>
              </div>
            </div>

            {!instalada && (
              <div className="mt-6">
                {plataforma === "ios" && <PasosIOS navegador={navegadorIOS} />}
                {plataforma === "android" &&
                  (puedeInstalar ? <BotonInstalar onClick={instalar} /> : <PasosAndroid />)}
                {plataforma === "escritorio" && (
                  <>
                    <CodigoQR />
                    {puedeInstalar && (
                      <div className="mt-4">
                        <BotonInstalar onClick={instalar} texto="Instalar también en este ordenador" />
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            <button
              ref={cerrarRef}
              type="button"
              onClick={() => setAbierto(false)}
              className="mt-5 min-h-[44px] w-full text-sm font-semibold text-salvia-700"
            >
              {instalada ? "Cerrar" : "Ahora no"}
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

function BotonInstalar({ onClick, texto = "Instalar CoPadres" }: { onClick: () => void; texto?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-salvia-700 px-5 text-[15px] font-semibold text-crema-50 transition hover:bg-salvia-800"
    >
      <IconoDescarga />
      {texto}
    </button>
  );
}

function Paso({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3 py-2">
      <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-salvia-100 text-[13px] font-semibold text-salvia-800">
        {n}
      </span>
      <span className="text-[15px] leading-snug text-carbon">{children}</span>
    </li>
  );
}

function Rotulo({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-carbon-suave">{children}</p>;
}

function PasosIOS({ navegador }: { navegador: NavegadorIOS }) {
  if (navegador === "integrado") {
    return (
      <>
        <Rotulo>Primero, ábrela en Safari</Rotulo>
        <p className="text-[15px] leading-snug text-carbon">
          Estás viendo CoPadres dentro de otra app. Toca el menú <strong>···</strong> y elige{" "}
          <strong>Abrir en Safari</strong>; allí vuelve a pulsar <strong>Descargar versión móvil</strong>.
        </p>
      </>
    );
  }
  return (
    <>
      <Rotulo>{navegador === "safari" ? "En iPhone o iPad, con Safari" : "En iPhone o iPad"}</Rotulo>
      <ol className="divide-y divide-carbon-linea/60">
        <Paso n={1}>
          Toca <IconoCompartir /> <strong>Compartir</strong>{" "}
          {navegador === "safari" ? "en la barra inferior." : "junto a la barra de direcciones."}
        </Paso>
        <Paso n={2}>
          Elige <strong>Añadir a pantalla de inicio</strong>
          {" "}(desliza hacia abajo si no la ves).
        </Paso>
        <Paso n={3}>Confirma con <strong>Añadir</strong>.</Paso>
      </ol>
      <p className="mt-3 text-[13px] leading-snug text-carbon-suave">
        Apple no permite instalar apps web con un solo botón: estos tres toques son la vía oficial.
        {navegador === "otro" && " Si no aparece la opción, ábrela en Safari."}
      </p>
    </>
  );
}

function PasosAndroid() {
  return (
    <>
      <Rotulo>En Android</Rotulo>
      <ol className="divide-y divide-carbon-linea/60">
        <Paso n={1}>Abre el menú del navegador (<strong>⋮</strong> arriba o <strong>≡</strong> abajo).</Paso>
        <Paso n={2}>
          Toca <strong>Instalar aplicación</strong> o <strong>Añadir a pantalla de inicio</strong>.
        </Paso>
        <Paso n={3}>Confirma con <strong>Instalar</strong>.</Paso>
      </ol>
    </>
  );
}

/** Código QR con la dirección de la web, para abrirla en el móvil desde el ordenador. */
function CodigoQR() {
  const [qr, setQr] = useState<string | null>(null);
  const [direccion, setDireccion] = useState("");

  useEffect(() => {
    const url = window.location.origin;
    setDireccion(window.location.host);
    import("qrcode")
      .then((m) => m.toDataURL(url, { margin: 1, width: 360, color: { dark: "#0b2559", light: "#ffffff" } }))
      .then(setQr)
      .catch(() => setQr(null));
  }, []);

  return (
    <div className="flex flex-col items-center text-center">
      <Rotulo>Escanéalo con la cámara del móvil</Rotulo>
      <div className="mt-1 rounded-2xl border border-carbon-linea bg-white p-3">
        {qr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qr} alt={`Código QR para abrir ${direccion} en el móvil`} width={180} height={180} />
        ) : (
          <div className="h-[180px] w-[180px] animate-pulse rounded-xl bg-crema-100" aria-hidden />
        )}
      </div>
      <p className="mt-3 text-sm leading-relaxed text-carbon-claro">
        O abre <strong className="text-carbon">{direccion}</strong> en el navegador del móvil y pulsa{" "}
        <strong className="text-carbon">Descargar versión móvil</strong>. Se instala en dos toques.
      </p>
    </div>
  );
}

function IconoMovil() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <path d="M12 18h.01" />
    </svg>
  );
}

function IconoDescarga() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}

function IconoCompartir() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
      className="inline-block align-text-bottom" aria-hidden>
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <path d="m16 6-4-4-4 4" />
      <path d="M12 2v13" />
    </svg>
  );
}
