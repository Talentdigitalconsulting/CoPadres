import { TITULAR, urlSitio } from "@/lib/legal";

/** RFC 9116: cómo comunicar vulnerabilidades de seguridad de forma responsable. */
export function GET() {
  const url = urlSitio();
  const texto = [
    "# Política de divulgación responsable de CoPadres",
    "# Si encuentras una vulnerabilidad, escríbenos antes de hacerla pública.",
    `Contact: mailto:${TITULAR.email}`,
    "Expires: 2027-10-04T00:00:00.000Z",
    "Preferred-Languages: es, en",
    `Canonical: ${url}/.well-known/security.txt`,
    `Policy: ${url}/seguridad`,
    "",
  ].join("\n");
  return new Response(texto, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
