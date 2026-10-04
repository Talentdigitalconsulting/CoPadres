import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/publico/JsonLd";
import { TITULAR } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Para abogados de familia y mediadores",
  description:
    "Recomienda CoPadres a tus clientes: menos emails y llamadas, comunicación más serena y un registro ordenado de gastos, cambios de custodia y mensajes con fecha y hora.",
  alternates: { canonical: "/para-abogados" },
};

const VENTAJAS = [
  { t: "Menos fricción entre las partes", d: "El filtro de tono reduce los mensajes hostiles y los acuerdos quedan por escrito, lo que rebaja la conflictividad posterior al convenio." },
  { t: "Documentación ordenada", d: "Tus clientes llegan con un informe en PDF del periodo que necesites: gastos con justificante, solicitudes de cambio y transcripción íntegra de mensajes." },
  { t: "Registro íntegro", d: "Los mensajes y el registro de auditoría no se pueden editar ni borrar, y cada entrada conserva autor, fecha y hora." },
  { t: "Menos consultas operativas", d: "Dudas como «¿quién paga esta extraescolar?» o «¿cuándo se acordó ese cambio?» se resuelven en la propia app." },
];

export default function PaginaAbogados() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 md:py-16">
      <JsonLd datos={{
        "@context": "https://schema.org", "@type": "WebPage", name: "CoPadres para abogados y mediadores",
        about: "Herramienta de coparentalidad recomendada por profesionales del derecho de familia",
      }} />
      <p className="chip bg-arcilla/15 text-arcilla mb-4">Para profesionales</p>
      <h1 className="font-display text-4xl md:text-5xl leading-tight md:leading-[1.08] max-w-3xl">
        Una herramienta para que tus clientes cumplan el convenio con menos conflicto
      </h1>
      <p className="text-lg text-carbon-claro mt-5 max-w-2xl leading-relaxed">
        Abogados de familia, mediadores y equipos psicosociales pueden recomendar CoPadres a progenitores separados para
        organizar la custodia, los gastos y la comunicación con todo documentado.
      </p>
      <div className="grid sm:grid-cols-2 gap-4 mt-12">
        {VENTAJAS.map((v) => (
          <div key={v.t} className="tarjeta">
            <h2 className="font-semibold text-carbon">{v.t}</h2>
            <p className="text-sm text-carbon-suave mt-2 leading-relaxed">{v.d}</p>
          </div>
        ))}
      </div>
      <section className="mt-12 tarjeta bg-crema-50 md:p-9">
        <h2 className="font-display text-2xl">Qué contiene un informe</h2>
        <ul className="list-disc pl-5 mt-4 space-y-1.5 text-carbon-claro">
          <li>Portada con espacio familiar, miembros y periodo.</li>
          <li>Tabla de gastos extraordinarios: fecha, concepto, categoría, quién pagó, importe, reparto, estado y justificante.</li>
          <li>Historial de solicitudes de cambio de custodia con respuesta, autor y hora.</li>
          <li>Diario del menor y transcripción completa de mensajes.</li>
          <li>Registro técnico de auditoría opcional.</li>
        </ul>
        <p className="text-xs text-carbon-suave mt-4">
          La valoración de la prueba corresponde en cada caso al órgano judicial. CoPadres no presta asesoramiento jurídico.
        </p>
      </section>
      <section className="mt-12 text-center">
        <h2 className="font-display text-2xl">¿Quieres colaborar con nosotros?</h2>
        <p className="text-carbon-suave mt-2">Escríbenos y te contamos cómo recomendar CoPadres a tus clientes.</p>
        <div className="flex flex-wrap justify-center gap-3 mt-5">
          <a href={`mailto:${TITULAR.email}?subject=Colaboración%20profesional%20CoPadres`} className="boton-primario">Contactar</a>
          <Link href="/funcionalidades/informes-para-abogados" className="boton-secundario">Ver los informes</Link>
        </div>
      </section>
    </div>
  );
}
