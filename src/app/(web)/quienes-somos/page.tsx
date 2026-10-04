import type { Metadata } from "next";
import Image from "next/image";
import { DOMICILIO_COMPLETO, TITULAR } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Quiénes somos",
  description: `CoPadres es un producto de ${TITULAR.nombreComercial} (${TITULAR.nombre}), con sede en ${TITULAR.localidad} (${TITULAR.provincia}). Conoce quién está detrás de la app.`,
  alternates: { canonical: "/quienes-somos" },
};

export default function PaginaQuienesSomos() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 md:py-16">
      <h1 className="font-display text-4xl md:text-5xl leading-tight md:leading-[1.08]">Quiénes somos</h1>
      <div className="mt-8 bg-carbon rounded-tarjeta p-6 inline-block">
        <Image src="/marca/talent-digital-consulting-claro.png" alt="Talent & Digital Consulting" width={397} height={122} className="h-16 w-auto" />
      </div>
      <div className="mt-8 space-y-4 text-[16px] leading-relaxed text-carbon-claro">
        <p>
          CoPadres es un producto de <strong>{TITULAR.nombreComercial}</strong>, el proyecto de {TITULAR.nombre} dedicado a
          crear soluciones digitales e inteligencia artificial útiles para personas y empresas.
        </p>
        <p>
          Nació de una idea sencilla: en España se separan cada año decenas de miles de familias con hijos, y la mayoría se
          coordina por WhatsApp, un canal que no fue pensado para eso. Las capturas se pierden, los acuerdos se olvidan y cada
          gasto puede convertirse en una discusión.
        </p>
        <p>
          Queríamos una herramienta en español, cálida y neutral, que ayude a los progenitores a hablar de lo que importa —sus
          hijos— y que deje constancia de lo acordado sin tomar partido por nadie.
        </p>
        <h2 className="font-display text-2xl text-carbon pt-4">Nuestros principios</h2>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Neutralidad:</strong> la app no favorece a ninguno de los progenitores.</li>
          <li><strong>Los hijos en el centro:</strong> cada función busca reducir el conflicto que les llega.</li>
          <li><strong>Privacidad:</strong> sin publicidad ni venta de datos; seguridad en cada capa.</li>
          <li><strong>Transparencia:</strong> todo lo que pasa en la app queda registrado para los dos.</li>
        </ul>
        <h2 className="font-display text-2xl text-carbon pt-4">Datos de contacto</h2>
        <p>
          {TITULAR.nombre} ({TITULAR.nombreComercial}) · NIF {TITULAR.nif}
          <br />{DOMICILIO_COMPLETO}
          <br /><a className="text-salvia-700 underline" href={`mailto:${TITULAR.email}`}>{TITULAR.email}</a>
        </p>
      </div>
    </div>
  );
}
