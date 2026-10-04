import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/publico/JsonLd";
import { GUIAS } from "@/contenido/guias";
import { urlSitio } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Guías para padres separados",
  description:
    "Guías prácticas sobre custodia compartida, calendarios de custodia, gastos extraordinarios, convenio regulador, vacaciones y comunicación con tu ex pareja.",
  alternates: { canonical: "/guias" },
};

export default function PaginaGuias() {
  const url = urlSitio();
  return (
    <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
      <JsonLd datos={{
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "Guías para padres separados",
        url: `${url}/guias`,
        hasPart: GUIAS.map((g) => ({ "@type": "Article", headline: g.titulo, url: `${url}/guias/${g.slug}` })),
      }} />
      <header className="max-w-2xl">
        <p className="chip bg-salvia-100 text-salvia-800 mb-4">Guías</p>
        <h1 className="font-display text-4xl md:text-5xl leading-tight">Guías para padres y madres separados</h1>
        <p className="text-carbon-suave mt-4 text-lg leading-relaxed">
          Información práctica y clara para organizar la custodia, los gastos y la comunicación. Contenido orientativo: para tu
          caso concreto, consulta siempre con un abogado de familia o un mediador.
        </p>
      </header>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-12">
        {GUIAS.map((g) => (
          <Link key={g.slug} href={`/guias/${g.slug}`} className="tarjeta hover:shadow-flotante transition-shadow flex flex-col">
            <p className="text-xs text-carbon-suave">{g.categoria} · {g.minutos} min</p>
            <h2 className="font-semibold text-carbon mt-2">{g.titulo}</h2>
            <p className="text-sm text-carbon-suave mt-2 leading-relaxed flex-1">{g.resumen}</p>
            <span className="text-sm text-salvia-700 font-semibold mt-4">Leer la guía →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
