import Link from "next/link";
import CabeceraPublica from "@/components/publico/Cabecera";
import PiePublico from "@/components/publico/Pie";

const DOCUMENTOS = [
  { href: "/legal/aviso-legal", texto: "Aviso legal" },
  { href: "/legal/terminos", texto: "Términos y condiciones" },
  { href: "/legal/privacidad", texto: "Privacidad" },
  { href: "/legal/cookies", texto: "Cookies" },
];

/** Marco común de las páginas legales. */
export default function LayoutLegal({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-crema-100 flex flex-col">
      <CabeceraPublica />
      <main className="max-w-3xl w-full mx-auto px-4 py-8 md:py-12 flex-1">
        <nav className="flex flex-wrap gap-2 mb-6" aria-label="Documentos legales">
          {DOCUMENTOS.map((d) => (
            <Link key={d.href} href={d.href}
              className="chip border border-carbon-linea bg-white text-carbon-claro hover:bg-crema-50 px-3 py-1">
              {d.texto}
            </Link>
          ))}
        </nav>
        <article className="tarjeta p-6 md:p-10 text-[15px] leading-relaxed text-carbon-claro space-y-4
          [&_h1]:font-display [&_h1]:text-3xl [&_h1]:text-carbon [&_h1]:leading-tight
          [&_h2]:font-display [&_h2]:text-xl [&_h2]:text-carbon [&_h2]:mt-8 [&_h2]:mb-2
          [&_h3]:font-semibold [&_h3]:text-carbon [&_h3]:mt-4
          [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1.5
          [&_a]:text-salvia-700 [&_a]:underline [&_table]:w-full [&_table]:text-sm
          [&_th]:text-left [&_th]:py-2 [&_th]:pr-3 [&_th]:border-b [&_th]:border-carbon-linea
          [&_td]:py-2 [&_td]:pr-3 [&_td]:border-b [&_td]:border-carbon-linea/60 [&_td]:align-top">
          {children}
        </article>
        <p className="text-xs text-carbon-suave mt-4">
          ¿Dudas sobre estos textos? Escríbenos desde la página de <Link href="/contacto" className="underline">contacto</Link>.
        </p>
      </main>
      <PiePublico />
    </div>
  );
}
