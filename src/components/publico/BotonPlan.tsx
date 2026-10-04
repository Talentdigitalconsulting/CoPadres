"use client";
import { useState } from "react";

/** Botón de suscripción: Payment Link de Stripe si existe; si no, Checkout integrado. */
export default function BotonPlan({
  plan,
  enlacePago,
  destacado,
}: {
  plan: "individual" | "familia";
  enlacePago?: string;
  destacado: boolean;
}) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const suscribirse = async () => {
    setError(null);
    if (enlacePago && enlacePago.startsWith("https://")) {
      window.location.href = enlacePago;
      return;
    }
    setCargando(true);
    try {
      const respuesta = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const datos = await respuesta.json().catch(() => ({}));
      if (datos.url && String(datos.url).startsWith("https://")) window.location.href = datos.url;
      else if (respuesta.status === 401) window.location.href = "/registro";
      else setError(datos.error ?? "Los pagos aún no están disponibles. Vuelve a intentarlo más tarde.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <>
      <button onClick={suscribirse} disabled={cargando}
        className={`${destacado ? "boton-primario" : "boton-secundario"} w-full mt-6`}>
        {cargando ? "Abriendo pago seguro…" : "Empezar 14 días gratis"}
      </button>
      {error && <p className="text-xs text-vino mt-2" role="alert">{error}</p>}
    </>
  );
}
