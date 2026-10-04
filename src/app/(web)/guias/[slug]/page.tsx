import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ArticuloContenido from "@/components/publico/ArticuloContenido";
import { guiaPorSlug } from "@/contenido/guias";
import { TITULAR, urlSitio } from "@/lib/legal";

// Se renderiza en cada petición para aplicar la CSP con nonce.
export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const g = guiaPorSlug(params.slug);
  if (!g) return {};
  const ruta = `/guias/${g.slug}`;
  return {
    title: g.metaTitulo,
    description: g.descripcion,
    alternates: { canonical: ruta },
    openGraph: { title: g.metaTitulo, description: g.descripcion, url: ruta, type: "article", publishedTime: g.publicada },
  };
}

export default function PaginaGuia({ params }: { params: { slug: string } }) {
  const g = guiaPorSlug(params.slug);
  if (!g) notFound();
  const url = urlSitio();
  const relacionadas = (g.relacionadas ?? [])
    .map((s) => guiaPorSlug(s))
    .filter((x): x is NonNullable<typeof x> => Boolean(x))
    .map((r) => ({ href: `/guias/${r.slug}`, titulo: r.titulo, resumen: r.resumen }));
  const fecha = new Date(`${g.publicada}T12:00:00`).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
  return (
    <ArticuloContenido
      pagina={g}
      migas={[
        { nombre: "Inicio", ruta: "/" },
        { nombre: "Guías", ruta: "/guias" },
        { nombre: g.titulo, ruta: `/guias/${g.slug}` },
      ]}
      relacionadas={relacionadas}
      meta={<>{g.categoria} · {g.minutos} min de lectura · Publicada el {fecha} · Contenido orientativo, no es asesoramiento jurídico</>}
      datosExtra={{
        "@type": "Article",
        headline: g.titulo,
        description: g.descripcion,
        datePublished: g.publicada,
        dateModified: g.publicada,
        inLanguage: "es-ES",
        mainEntityOfPage: `${url}/guias/${g.slug}`,
        author: { "@type": "Organization", name: TITULAR.nombreComercial, url },
        publisher: { "@id": `${url}/#organizacion` },
      }}
    />
  );
}
