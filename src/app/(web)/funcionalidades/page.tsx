import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/publico/JsonLd";
import { FUNCIONALIDADES } from "@/contenido/funcionalidades";
import { urlSitio } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Funcionalidades",
  description:
    "Todo lo que hace CoPadres: calendario de custodia, gastos compartidos, actividades extraescolares, mensajes con filtro de tono, diario del menor, informes y asistente IA.",
  alternates: { canonical: "/funcionalidades" },
};

export default function PaginaFuncionalidades() {
  const url = urlSitio();
  return (
    <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
      <JsonLd datos={{
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Funcionalidades de CoPadres",
        itemListElement: FUNCIONALIDADES.map((f, i) => ({
          "@type": "ListItem", position: i + 1, name: f.titulo, url: `${url}/funcionalidades/${f.slug}`,
        })),
      }} />
      <header className="max-w-2xl">
        <p className="chip bg-salvia-100 text-salvia-800 mb-4">Funcionalidades</p>
        <h1 className="font-display text-4xl md:text-5xl leading-tight">Todo lo que necesitáis para coordinaros, en un solo sitio</h1>
        <p className="text-carbon-suave mt-4 text-lg leading-relaxed">
          Cada función está pensada para quitar un motivo de discusión y dejar constancia de lo acordado.
        </p>
      </header>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-12">
        {FUNCIONALIDADES.map((f) => (
          <Link key={f.slug} href={`/funcionalidades/${f.slug}`} className="tarjeta hover:shadow-flotante transition-shadow flex flex-col">
            <h2 className="font-semibold text-carbon">{f.titulo}</h2>
            <p className="text-sm text-carbon-suave mt-2 leading-relaxed flex-1">{f.resumen}</p>
            <span className="text-sm text-salvia-700 font-semibold mt-4">Ver cómo funciona →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
