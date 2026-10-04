import Link from "next/link";
import Image from "next/image";
import Logo from "@/components/Logo";
import { ANIO_COPYRIGHT, TITULAR } from "@/lib/legal";

const COLUMNAS = [
  {
    titulo: "Producto",
    enlaces: [
      { href: "/funcionalidades", texto: "Funcionalidades" },
      { href: "/funcionalidades/calendario-custodia", texto: "Calendario de custodia" },
      { href: "/funcionalidades/gastos-compartidos", texto: "Gastos compartidos" },
      { href: "/funcionalidades/mensajes-sin-conflicto", texto: "Mensajes sin conflicto" },
      { href: "/funcionalidades/actividades-extraescolares", texto: "Actividades de los hijos" },
      { href: "/precios", texto: "Precios" },
    ],
  },
  {
    titulo: "Recursos",
    enlaces: [
      { href: "/guias", texto: "Guías para padres separados" },
      { href: "/para-abogados", texto: "Para abogados y mediadores" },
      { href: "/preguntas-frecuentes", texto: "Preguntas frecuentes" },
      { href: "/seguridad", texto: "Seguridad" },
      { href: "/quienes-somos", texto: "Quiénes somos" },
      { href: "/contacto", texto: "Contacto" },
    ],
  },
  {
    titulo: "Legal",
    enlaces: [
      { href: "/legal/aviso-legal", texto: "Aviso legal" },
      { href: "/legal/terminos", texto: "Términos y condiciones" },
      { href: "/legal/privacidad", texto: "Política de privacidad" },
      { href: "/legal/cookies", texto: "Política de cookies" },
    ],
  },
];

/** Pie común de la web pública: enlaces, textos legales y la marca de Talent & Digital Consulting. */
export default function PiePublico() {
  return (
    <footer className="bg-carbon text-crema-200">
      <div className="max-w-6xl mx-auto px-4 py-12 grid gap-10 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div className="space-y-3">
          <Logo claro />
          <p className="text-sm text-crema-300/80 leading-relaxed max-w-xs">
            La app de coordinación para padres y madres separados: calendario de custodia, gastos, mensajes y
            diario del menor, con todo documentado.
          </p>
        </div>
        {COLUMNAS.map((c) => (
          <nav key={c.titulo} aria-label={c.titulo}>
            <p className="text-xs font-semibold uppercase tracking-wide text-crema-400 mb-3">{c.titulo}</p>
            <ul className="space-y-2 text-sm">
              {c.enlaces.map((e) => (
                <li key={e.href}><Link href={e.href} className="hover:text-white">{e.texto}</Link></li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center gap-6 md:justify-between">
          <a href="/quienes-somos" className="shrink-0" aria-label="Talent & Digital Consulting">
            <Image src="/marca/talent-digital-consulting-claro.png" alt="Talent & Digital Consulting" width={397} height={122}
              className="h-14 w-auto" />
          </a>
          <div className="text-xs text-crema-300/80 leading-relaxed text-center md:text-right">
            <p>
              CoPadres es un producto de <strong className="text-crema-100">{TITULAR.nombreComercial}</strong>.
            </p>
            <p>
              © {ANIO_COPYRIGHT} {TITULAR.nombreComercial}. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
