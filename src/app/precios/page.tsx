"use client";
import { useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";

const PLANES = [
  {
    id: "individual" as const,
    nombre: "Individual",
    precio: "8,99 €",
    detalle: "por progenitor / mes",
    enlacePago: process.env.NEXT_PUBLIC_STRIPE_LINK_INDIVIDUAL,
    caracteristicas: [
      "Calendario de custodia con solicitudes auditadas",
      "Gastos con comprobantes y reparto automático",
      "Mensajería con filtro de tono IA",
      "Diario compartido del menor",
      "Informes PDF para abogados y juzgados",
      "Asistente IA",
    ],
    destacado: false,
  },
  {
    id: "familia" as const,
    nombre: "Familia",
    precio: "14,99 €",
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

/** Página de precios: usa tus Payment Links de Stripe si están configurados;
 *  si no, crea una sesión de Checkout integrada. */
export default function PaginaPrecios() {
  const [cargando, setCargando] = useState<string | null>(null);

  const suscribirse = async (plan: (typeof PLANES)[number]) => {
    // Opción A: Payment Link pegado en el .env — redirección directa.
    if (plan.enlacePago) {
      window.location.href = plan.enlacePago;
      return;
    }
    // Opción B: Checkout integrado con los price IDs.
    setCargando(plan.id);
    try {
      const respuesta = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: plan.id }),
      });
      const datos = await respuesta.json();
      if (datos.url) window.location.href = datos.url;
      else if (respuesta.status === 401) window.location.href = "/registro";
      else alert("Los pagos aún no están configurados. Vuelve a intentarlo más tarde.");
    } finally {
      setCargando(null);
    }
  };

  return (
    <main className="min-h-screen bg-crema-100">
      <header className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
        <Link href="/"><Logo /></Link>
        <Link href="/login" className="text-sm text-salvia-700 font-semibold hover:underline">Entrar</Link>
      </header>

      <section className="max-w-4xl mx-auto px-4 pb-16">
        <div className="text-center mb-10">
          <h1 className="font-display text-3xl md:text-4xl">Un precio que compensa desde el primer día</h1>
          <p className="text-carbon-suave mt-3 max-w-xl mx-auto text-sm md:text-base">
            Menos que un solo email de tu abogado. 14 días de prueba gratuita, sin tarjeta,
            y cancelas cuando quieras.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5 max-w-2xl mx-auto">
          {PLANES.map((plan) => (
            <div key={plan.id}
              className={`tarjeta p-7 flex flex-col ${plan.destacado ? "border-salvia-600 border-2 relative" : ""}`}>
              {plan.destacado && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 chip bg-salvia-700 text-crema-50">
                  El más elegido
                </span>
              )}
              <h2 className="font-display text-xl">{plan.nombre}</h2>
              <p className="mt-3">
                <span className="font-display text-4xl">{plan.precio}</span>
                <span className="text-sm text-carbon-suave"> {plan.detalle}</span>
              </p>
              <ul className="mt-5 space-y-2 text-sm text-carbon-claro flex-1">
                {plan.caracteristicas.map((c) => (
                  <li key={c} className="flex gap-2">
                    <span className="text-salvia-600 font-bold">✓</span> {c}
                  </li>
                ))}
              </ul>
              <button onClick={() => suscribirse(plan)} disabled={cargando === plan.id}
                className={`${plan.destacado ? "boton-primario" : "boton-secundario"} w-full mt-6`}>
                {cargando === plan.id ? "Abriendo pago seguro…" : "Empezar 14 días gratis"}
              </button>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-carbon-suave mt-8">
          Pago seguro gestionado por Stripe · IVA incluido · Sin permanencia
        </p>
      </section>
    </main>
  );
}
