import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/publico/JsonLd";

export const metadata: Metadata = {
  title: "Preguntas frecuentes",
  description:
    "Resolvemos las dudas más habituales sobre CoPadres: precio, prueba gratuita, privacidad, valor como prueba, filtro de tono, invitar al otro progenitor y cancelación.",
  alternates: { canonical: "/preguntas-frecuentes" },
};

const GRUPOS: { titulo: string; preguntas: { p: string; r: string }[] }[] = [
  {
    titulo: "Sobre CoPadres",
    preguntas: [
      { p: "¿Qué es CoPadres?", r: "Una aplicación para padres y madres separados que reúne en un espacio neutral el calendario de custodia, los gastos de los hijos, sus actividades, los mensajes entre progenitores y un diario compartido, con todo documentado." },
      { p: "¿Necesito instalar algo?", r: "No. Funciona en el navegador del móvil o del ordenador y puedes añadirla a la pantalla de inicio como una app." },
      { p: "¿El otro progenitor tiene que usarla también?", r: "Funciona mejor con los dos dentro, porque cada gasto, cambio y mensaje queda registrado para ambos. Puedes empezar solo e invitarle después con un enlace personal." },
      { p: "¿Y si el otro progenitor no quiere unirse?", r: "Puedes seguir usando CoPadres para organizar tu calendario, tus gastos y el diario de tus hijos, y generar informes con lo que registres." },
    ],
  },
  {
    titulo: "Precio y suscripción",
    preguntas: [
      { p: "¿Cuánto cuesta?", r: "Plan Individual: 8,99 € al mes por progenitor. Plan Familia: 14,99 € al mes para los dos. IVA incluido." },
      { p: "¿Hay prueba gratuita?", r: "Sí, 14 días gratis sin tarjeta." },
      { p: "¿Hay permanencia?", r: "No. Cancelas cuando quieras desde Ajustes y la suscripción sigue activa hasta el final del periodo pagado." },
    ],
  },
  {
    titulo: "Privacidad y seguridad",
    preguntas: [
      { p: "¿Quién puede ver nuestros datos?", r: "Solo los dos progenitores de vuestro espacio familiar. Cada dato está aislado con seguridad a nivel de fila y viaja cifrado." },
      { p: "¿Puedo proteger mi cuenta con un código?", r: "Sí. Puedes activar la verificación en dos pasos con cualquier app de autenticación." },
      { p: "¿Puedo descargar o borrar mis datos?", r: "Sí, en cualquier momento desde Ajustes → Privacidad y datos." },
    ],
  },
  {
    titulo: "Mensajes, informes e IA",
    preguntas: [
      { p: "¿Los mensajes se pueden borrar o editar?", r: "No. Los mensajes y el registro son inalterables por diseño, para que los dos tengáis siempre la misma versión." },
      { p: "¿Sirve como prueba en un juicio?", r: "CoPadres genera informes con el registro íntegro, con autor, fecha y hora. La admisibilidad y el valor probatorio los decide cada tribunal." },
      { p: "¿Qué hace el filtro de tono?", r: "Antes de enviar, la IA detecta si el mensaje es agresivo y propone una versión serena. Tú decides qué se envía; nunca bloquea la comunicación." },
    ],
  },
];

export default function PaginaPreguntas() {
  const todas = GRUPOS.flatMap((g) => g.preguntas);
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 md:py-16">
      <JsonLd datos={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: todas.map((q) => ({ "@type": "Question", name: q.p, acceptedAnswer: { "@type": "Answer", text: q.r } })),
      }} />
      <h1 className="font-display text-4xl md:text-5xl leading-tight md:leading-[1.08]">Preguntas frecuentes</h1>
      <p className="text-carbon-suave mt-4">¿No encuentras tu respuesta? <Link href="/contacto" className="text-salvia-700 underline">Escríbenos</Link>.</p>
      {GRUPOS.map((g) => (
        <section key={g.titulo} className="mt-10">
          <h2 className="font-display text-2xl mb-4">{g.titulo}</h2>
          <div className="space-y-3">
            {g.preguntas.map((q) => (
              <details key={q.p} className="tarjeta group">
                <summary className="font-semibold text-sm cursor-pointer list-none flex justify-between items-center gap-3">
                  {q.p}
                  <span className="text-salvia-600 group-open:rotate-45 transition-transform text-lg leading-none">+</span>
                </summary>
                <p className="text-sm text-carbon-suave mt-3 leading-relaxed">{q.r}</p>
              </details>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
