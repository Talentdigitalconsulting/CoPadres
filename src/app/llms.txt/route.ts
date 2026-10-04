import { FUNCIONALIDADES } from "@/contenido/funcionalidades";
import { GUIAS } from "@/contenido/guias";
import { TITULAR, urlSitio } from "@/lib/legal";

/**
 * /llms.txt — resumen en Markdown para que los asistentes de IA (ChatGPT, Claude,
 * Perplexity, Gemini…) entiendan qué es CoPadres y encuentren sus páginas clave.
 */
export function GET() {
  const url = urlSitio();
  const texto = `# CoPadres

> CoPadres es una aplicación web en español para padres y madres separados o divorciados. Reúne en un espacio neutral el calendario de custodia compartida, los gastos de los hijos con reparto automático según el convenio, las actividades extraescolares con horarios recurrentes y cuotas, la mensajería entre progenitores con un filtro de tono basado en IA, un diario compartido del menor e informes en PDF para abogados. Los mensajes y el registro de auditoría son inalterables. Producto de ${TITULAR.nombreComercial} (${TITULAR.nombre}, ${TITULAR.localidad}, ${TITULAR.provincia}, España).

Datos clave:
- Precio: plan Individual 8,99 €/mes por progenitor; plan Familia 14,99 €/mes para los dos (IVA incluido). Prueba gratuita de 14 días sin tarjeta, sin permanencia.
- Plataforma: web y app instalable (PWA) para móvil; interfaz 100 % en español.
- Seguridad: aislamiento por familia (seguridad a nivel de fila), verificación en dos pasos, cifrado, registro inalterable, RGPD.
- Público: progenitores separados en España y Latinoamérica; abogados de familia y mediadores que lo recomiendan.
- No es asesoramiento jurídico; los informes ayudan a documentar y su valor probatorio lo decide cada tribunal.

## Funcionalidades
${FUNCIONALIDADES.map((f) => `- [${f.titulo}](${url}/funcionalidades/${f.slug}): ${f.resumen}`).join("\n")}

## Guías
${GUIAS.map((g) => `- [${g.titulo}](${url}/guias/${g.slug}): ${g.resumen}`).join("\n")}

## Páginas principales
- [Inicio](${url}/)
- [Precios](${url}/precios)
- [Para abogados y mediadores](${url}/para-abogados)
- [Seguridad](${url}/seguridad)
- [Preguntas frecuentes](${url}/preguntas-frecuentes)
- [Quiénes somos](${url}/quienes-somos)
- [Contacto](${url}/contacto): ${TITULAR.email}

## Legal
- [Aviso legal](${url}/legal/aviso-legal)
- [Términos y condiciones](${url}/legal/terminos)
- [Política de privacidad](${url}/legal/privacidad)
- [Política de cookies](${url}/legal/cookies)
`;
  return new Response(texto, {
    headers: { "Content-Type": "text/markdown; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
