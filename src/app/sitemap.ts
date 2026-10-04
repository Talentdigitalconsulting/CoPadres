import type { MetadataRoute } from "next";
import { FUNCIONALIDADES } from "@/contenido/funcionalidades";
import { GUIAS } from "@/contenido/guias";
import { VERSION_LEGAL, urlSitio } from "@/lib/legal";

export default function sitemap(): MetadataRoute.Sitemap {
  const url = urlSitio();
  const hoy = new Date(VERSION_LEGAL);
  const fijas: [string, number, MetadataRoute.Sitemap[number]["changeFrequency"]][] = [
    ["/", 1, "weekly"],
    ["/funcionalidades", 0.9, "monthly"],
    ["/precios", 0.9, "monthly"],
    ["/guias", 0.8, "weekly"],
    ["/para-abogados", 0.7, "monthly"],
    ["/seguridad", 0.6, "monthly"],
    ["/preguntas-frecuentes", 0.6, "monthly"],
    ["/quienes-somos", 0.4, "yearly"],
    ["/contacto", 0.4, "yearly"],
    ["/registro", 0.5, "yearly"],
    ["/legal/aviso-legal", 0.2, "yearly"],
    ["/legal/terminos", 0.2, "yearly"],
    ["/legal/privacidad", 0.2, "yearly"],
    ["/legal/cookies", 0.1, "yearly"],
  ];
  return [
    ...fijas.map(([ruta, priority, changeFrequency]) => ({ url: `${url}${ruta}`, lastModified: hoy, changeFrequency, priority })),
    ...FUNCIONALIDADES.map((f) => ({
      url: `${url}/funcionalidades/${f.slug}`, lastModified: hoy, changeFrequency: "monthly" as const, priority: 0.8,
    })),
    ...GUIAS.map((g) => ({
      url: `${url}/guias/${g.slug}`, lastModified: new Date(g.publicada), changeFrequency: "monthly" as const, priority: 0.7,
    })),
  ];
}
