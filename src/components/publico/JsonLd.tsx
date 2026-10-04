import { headers } from "next/headers";

/** Datos estructurados (schema.org) para Google y los buscadores de IA. */
export default async function JsonLd({ datos }: { datos: Record<string, unknown> | Record<string, unknown>[] }) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      // JSON propio (no viene del usuario); se escapa "<" para que no pueda cerrar la etiqueta.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(datos).replace(/</g, "\\u003c") }}
    />
  );
}
