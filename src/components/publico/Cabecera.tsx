"use client";
import { useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import DescargarApp from "@/components/publico/DescargarApp";

const ENLACES = [
  { href: "/funcionalidades", texto: "Funcionalidades" },
  { href: "/precios", texto: "Precios" },
  { href: "/guias", texto: "Guías" },
  { href: "/para-abogados", texto: "Para abogados" },
  { href: "/seguridad", texto: "Seguridad" },
];

/** Cabecera de las páginas públicas. */
export default function CabeceraPublica() {
  const [abierto, setAbierto] = useState(false);
  return (
    <header className="bg-crema-100/90 backdrop-blur sticky top-0 z-40 border-b border-carbon-linea/50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-2 sm:gap-4">
        <Link href="/" aria-label="CoPadres, inicio" className="shrink-0"><Logo adaptable /></Link>
        <nav className="hidden lg:flex items-center gap-6 text-sm" aria-label="Principal">
          {ENLACES.map((e) => (
            <Link key={e.href} href={e.href} className="text-carbon-suave hover:text-carbon">{e.texto}</Link>
          ))}
        </nav>
        <div className="flex items-center gap-1.5 sm:gap-3">
          <Link href="/login" className="text-sm text-carbon-suave hover:text-carbon hidden sm:block">Entrar</Link>
          <DescargarApp />
          <Link href="/registro" className="boton-primario text-xs whitespace-nowrap px-3 sm:px-5">Prueba gratis</Link>
          <button type="button" className="lg:hidden p-1.5 -mr-1.5 text-carbon" aria-label="Abrir menú"
            aria-expanded={abierto} onClick={() => setAbierto(!abierto)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              {abierto ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>
      {abierto && (
        <nav className="lg:hidden border-t border-carbon-linea/60 bg-crema-50 px-4 py-3 grid gap-1" aria-label="Móvil">
          {ENLACES.map((e) => (
            <Link key={e.href} href={e.href} onClick={() => setAbierto(false)}
              className="py-2.5 text-sm text-carbon">{e.texto}</Link>
          ))}
          <Link href="/login" onClick={() => setAbierto(false)} className="py-2.5 text-sm text-carbon">Entrar</Link>
        </nav>
      )}
    </header>
  );
}
