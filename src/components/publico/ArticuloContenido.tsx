import Link from "next/link";
import JsonLd from "@/components/publico/JsonLd";
import type { PaginaContenido } from "@/contenido/tipos";
import { urlSitio } from "@/lib/legal";

type Miga = { nombre: string; ruta: string };

/** Página de contenido (funcionalidad o guía) con migas, FAQ, relacionadas y datos estructurados. */
export default function ArticuloContenido({
  pagina,
  migas,
  relacionadas,
  meta,
  datosExtra,
}: {
  pagina: PaginaContenido;
  migas: Miga[];
  relacionadas: { href: string; titulo: string; resumen: string }[];
  meta?: React.ReactNode;
  datosExtra?: Record<string, unknown>;
}) {
  const url = urlSitio();
  const grafo: Record<string, unknown>[] = [
    {
      "@type": "BreadcrumbList",
      itemListElement: migas.map((m, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: m.nombre,
        item: `${url}${m.ruta}`,
      })),
    },
  ];
  if (pagina.preguntas?.length) {
    grafo.push({
      "@type": "FAQPage",
      mainEntity: pagina.preguntas.map((q) => ({
        "@type": "Question",
        name: q.p,
        acceptedAnswer: { "@type": "Answer", text: q.r },
      })),
    });
  }
  if (datosExtra) grafo.push(datosExtra);

  return (
    <article className="max-w-3xl mx-auto px-4 py-10 md:py-14">
      <JsonLd datos={{ "@context": "https://schema.org", "@graph": grafo }} />
      <nav aria-label="Ruta" className="text-xs text-carbon-suave mb-6">
        <ol className="flex flex-wrap gap-1.5">
          {migas.map((m, i) => (
            <li key={m.ruta} className="flex gap-1.5">
              {i > 0 && <span aria-hidden>/</span>}
              {i < migas.length - 1 ? <Link href={m.ruta} className="hover:underline">{m.nombre}</Link> : <span>{m.nombre}</span>}
            </li>
          ))}
        </ol>
      </nav>

      <h1 className="font-display text-3xl md:text-5xl leading-tight text-carbon">{pagina.titulo}</h1>
      {meta && <div className="mt-3 text-sm text-carbon-suave">{meta}</div>}
      <p className="mt-5 text-lg text-carbon-claro leading-relaxed">{pagina.entradilla}</p>

      <div className="mt-10 space-y-10">
        {pagina.secciones.map((s) => (
          <section key={s.titulo}>
            <h2 className="font-display text-2xl text-carbon mb-3">{s.titulo}</h2>
            <div className="space-y-3 text-[16px] leading-relaxed text-carbon-claro">
              {s.parrafos.map((p) => <p key={p.slice(0, 40)}>{p}</p>)}
              {s.lista && (
                <ul className="list-disc pl-5 space-y-1.5">
                  {s.lista.map((l) => <li key={l.slice(0, 40)}>{l}</li>)}
                </ul>
              )}
            </div>
          </section>
        ))}
      </div>

      {pagina.preguntas && pagina.preguntas.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-2xl text-carbon mb-4">Preguntas frecuentes</h2>
          <div className="space-y-3">
            {pagina.preguntas.map((q) => (
              <details key={q.p} className="tarjeta group">
                <summary className="font-semibold text-sm cursor-pointer list-none flex justify-between items-center gap-3">
                  {q.p}
                  <span className="text-salvia-600 group-open:rotate-45 transition-transform text-lg leading-none">+</span>
                </summary>
                <p className="text-sm text-carbon-suave mt-3 leading-relaxed">{q.r}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      <aside className="mt-12 rounded-tarjeta bg-salvia-900 text-crema-100 p-7 md:p-9">
        <p className="font-display text-2xl leading-snug">Coordinaos por vuestros hijos, sin discutir</p>
        <p className="text-sm text-salvia-200 mt-2">
          Calendario, gastos, actividades, mensajes y diario del menor en un espacio neutral. 14 días gratis, sin tarjeta.
        </p>
        <div className="flex flex-wrap gap-3 mt-5">
          <Link href="/registro" className="boton bg-crema-50 text-salvia-800 hover:bg-white">Empezar gratis</Link>
          <Link href="/funcionalidades" className="boton border border-salvia-600 text-crema-100 hover:bg-salvia-800">
            Ver funcionalidades
          </Link>
        </div>
      </aside>

      {relacionadas.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-xl text-carbon mb-4">También te puede interesar</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {relacionadas.map((r) => (
              <Link key={r.href} href={r.href} className="tarjeta hover:shadow-flotante transition-shadow">
                <p className="font-semibold text-sm text-carbon">{r.titulo}</p>
                <p className="text-xs text-carbon-suave mt-1.5 leading-relaxed">{r.resumen}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
