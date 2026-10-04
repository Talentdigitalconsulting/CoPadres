import type { Metadata } from "next";
import Link from "next/link";
import BotonPlan from "@/components/publico/BotonPlan";
import JsonLd from "@/components/publico/JsonLd";
import { urlSitio } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Precios",
  description:
    "Precios de CoPadres: plan Individual 8,99 €/mes por progenitor o plan Familia 14,99 €/mes para los dos. 14 días de prueba gratis, sin tarjeta y sin permanencia.",
  alternates: { canonical: "/precios" },
};

const PLANES = [
  {
    id: "individual" as const,
    nombre: "Individual",
    precio: "8,99 €",
    valor: "8.99",
    detalle: "por progenitor / mes",
    enlacePago: process.env.NEXT_PUBLIC_STRIPE_LINK_INDIVIDUAL,
    caracteristicas: [
      "Calendario de custodia con solicitudes auditadas",
      "Gastos con comprobantes y reparto automático",
      "Actividades de los hijos y cuotas recurrentes",
      "Mensajería con filtro de tono IA",
      "Diario compartido del menor",
      "Informes PDF para abogados y juzgados",
      "Asistente IA y verificación en dos pasos",
    ],
    destacado: false,
  },
  {
    id: "familia" as const,
    nombre: "Familia",
    precio: "14,99 €",
    valor: "14.99",
    detalle: "los dos progenitores / mes",
    enlacePago: process.env.NEXT_PUBLIC_STRIPE_LINK_FAMILIA,
    caracteristicas: [
      "Todo lo del plan Individual",
      "Cubre a ambos progenitores (17 % de ahorro)",
      "Un solo pago, paz para los dos",
      "Soporte prioritario",
    ],
    destacado: true,
  },
];

export default function PaginaPrecios() {
  const url = urlSitio();
  return (
    <section className="max-w-4xl mx-auto px-4 py-12 md:py-16">
      <JsonLd datos={{
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "CoPadres",
        applicationCategory: "LifestyleApplication",
        operatingSystem: "Web, iOS, Android",
        url,
        offers: PLANES.map((p) => ({
          "@type": "Offer", name: `Plan ${p.nombre}`, price: p.valor, priceCurrency: "EUR",
          url: `${url}/precios`, category: "subscription",
        })),
      }} />
      <div className="text-center mb-10">
        <h1 className="font-display text-3xl md:text-5xl">Un precio que compensa desde el primer día</h1>
        <p className="text-carbon-suave mt-3 max-w-xl mx-auto text-sm md:text-base">
          Menos que un solo email de tu abogado. 14 días de prueba gratuita, sin tarjeta, y cancelas cuando quieras.
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-5 max-w-2xl mx-auto">
        {PLANES.map((plan) => (
          <div key={plan.id}
            className={`tarjeta p-7 flex flex-col ${plan.destacado ? "border-salvia-600 border-2 relative md:order-none order-first" : ""}`}>
            {plan.destacado && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 chip bg-salvia-700 text-crema-50">El más elegido</span>
            )}
            <h2 className="font-display text-xl">{plan.nombre}</h2>
            <p className="mt-3">
              <span className="font-display text-4xl">{plan.precio}</span>
              <span className="text-sm text-carbon-suave"> {plan.detalle}</span>
            </p>
            <ul className="mt-5 space-y-2 text-sm text-carbon-claro flex-1">
              {plan.caracteristicas.map((c) => (
                <li key={c} className="flex gap-2"><span className="text-salvia-600 font-bold">✓</span> {c}</li>
              ))}
            </ul>
            <BotonPlan plan={plan.id} enlacePago={plan.enlacePago} destacado={plan.destacado} />
          </div>
        ))}
      </div>
      <p className="text-center text-xs text-carbon-suave mt-8">
        Pago seguro gestionado por Stripe · IVA incluido · Sin permanencia · Derecho de desistimiento de 14 días ·{" "}
        <Link href="/legal/terminos" className="underline">Términos y condiciones</Link>
      </p>
    </section>
  );
}
