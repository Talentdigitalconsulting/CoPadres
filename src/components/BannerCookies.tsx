"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * Banner de cookies (RGPD / LSSI). CoPadres solo usa cookies técnicas
 * imprescindibles (sesión), así que basta con informar y registrar el "entendido".
 */
export default function BannerCookies() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!document.cookie.includes("cp_cookies=ok")) setVisible(true);
  }, []);

  const aceptar = () => {
    document.cookie = "cp_cookies=ok; path=/; max-age=31536000; SameSite=Lax";
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 md:bottom-4 inset-x-0 md:inset-x-auto md:right-4 md:max-w-sm z-[60] no-imprimir">
      <div className="bg-carbon text-crema-100 md:rounded-tarjeta p-4 shadow-flotante text-xs leading-relaxed">
        <p>
          CoPadres solo usa cookies técnicas imprescindibles para mantener tu sesión iniciada.
          No usamos cookies de publicidad ni de seguimiento.{" "}
          <Link href="/legal/cookies" className="underline">Más información</Link>.
        </p>
        <button onClick={aceptar} className="boton bg-crema-100 text-carbon hover:bg-white mt-3 text-xs px-4 py-1.5">
          Entendido
        </button>
      </div>
    </div>
  );
}
