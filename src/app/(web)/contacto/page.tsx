import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/publico/JsonLd";
import { DOMICILIO_COMPLETO, TITULAR, urlSitio } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Contacta con CoPadres para soporte, privacidad, colaboración profesional o comunicar un problema de seguridad.",
  alternates: { canonical: "/contacto" },
};

const MOTIVOS = [
  { t: "Soporte y dudas de uso", a: "Soporte CoPadres" },
  { t: "Privacidad y derechos RGPD", a: "Privacidad CoPadres" },
  { t: "Abogados y mediadores", a: "Colaboración profesional CoPadres" },
  { t: "Seguridad (vulnerabilidades)", a: "Seguridad CoPadres" },
];

export default function PaginaContacto() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 md:py-16">
      <JsonLd datos={{
        "@context": "https://schema.org", "@type": "ContactPage", url: `${urlSitio()}/contacto`,
        mainEntity: { "@id": `${urlSitio()}/#organizacion` },
      }} />
      <h1 className="font-display text-4xl md:text-5xl leading-tight">Contacto</h1>
      <p className="text-lg text-carbon-claro mt-4 leading-relaxed">
        Escríbenos a <a className="text-salvia-700 underline" href={`mailto:${TITULAR.email}`}>{TITULAR.email}</a>. Te responderemos
        lo antes posible. Elige el motivo para que tu correo llegue mejor clasificado:
      </p>
      <div className="grid sm:grid-cols-2 gap-3 mt-8">
        {MOTIVOS.map((m) => (
          <a key={m.t} href={`mailto:${TITULAR.email}?subject=${encodeURIComponent(m.a)}`}
            className="tarjeta hover:shadow-flotante transition-shadow">
            <p className="font-semibold text-sm">{m.t}</p>
            <p className="text-xs text-salvia-700 mt-1">Escribir →</p>
          </a>
        ))}
      </div>
      <div className="mt-10 text-sm text-carbon-suave leading-relaxed">
        <p><strong className="text-carbon">{TITULAR.nombreComercial}</strong> · {TITULAR.nombre} · NIF {TITULAR.nif}</p>
        <p>{DOMICILIO_COMPLETO}</p>
        <p className="mt-3">
          Antes de escribir quizá te ayude <Link href="/preguntas-frecuentes" className="underline">nuestro listado de preguntas frecuentes</Link>.
          Por tu seguridad, nunca te pediremos tu contraseña ni códigos de verificación por email.
        </p>
      </div>
    </div>
  );
}
