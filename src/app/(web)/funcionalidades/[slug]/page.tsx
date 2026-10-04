import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ArticuloContenido from "@/components/publico/ArticuloContenido";
import { funcionalidadPorSlug } from "@/contenido/funcionalidades";

// Se renderiza en cada petición para aplicar la CSP con nonce.
export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const f = funcionalidadPorSlug(params.slug);
  if (!f) return {};
  const ruta = `/funcionalidades/${f.slug}`;
  return {
    title: f.metaTitulo,
    description: f.descripcion,
    alternates: { canonical: ruta },
    openGraph: { title: f.metaTitulo, description: f.descripcion, url: ruta, type: "website" },
  };
}

export default function PaginaFuncionalidad({ params }: { params: { slug: string } }) {
  const f = funcionalidadPorSlug(params.slug);
  if (!f) notFound();
  const relacionadas = (f.relacionadas ?? [])
    .map((s) => funcionalidadPorSlug(s))
    .filter((x): x is NonNullable<typeof x> => Boolean(x))
    .map((r) => ({ href: `/funcionalidades/${r.slug}`, titulo: r.titulo, resumen: r.resumen }));
  return (
    <ArticuloContenido
      pagina={f}
      migas={[
        { nombre: "Inicio", ruta: "/" },
        { nombre: "Funcionalidades", ruta: "/funcionalidades" },
        { nombre: f.titulo, ruta: `/funcionalidades/${f.slug}` },
      ]}
      relacionadas={relacionadas}
    />
  );
}
