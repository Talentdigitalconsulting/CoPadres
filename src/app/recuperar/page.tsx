"use client";
import { useState } from "react";
import Link from "next/link";
import MarcoAuth from "@/components/MarcoAuth";
import { crearClienteNavegador } from "@/lib/supabase/client";

export default function PaginaRecuperar() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [cargando, setCargando] = useState(false);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    const supabase = crearClienteNavegador();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?siguiente=/restablecer`,
    });
    setCargando(false);
    setEnviado(true); // Siempre se confirma, exista o no la cuenta (privacidad).
  };

  return (
    <MarcoAuth
      titulo="Recuperar contraseña"
      subtitulo="Te enviaremos un enlace para crear una nueva."
    >
      {enviado ? (
        <div className="space-y-5">
          <p className="text-sm text-carbon-claro leading-relaxed">
            Si existe una cuenta con <strong>{email}</strong>, recibirás en unos minutos un
            correo con el enlace para restablecer tu contraseña. Revisa también la carpeta de spam.
          </p>
          <Link href="/login" className="boton-suave w-full">Volver a entrar</Link>
        </div>
      ) : (
        <form onSubmit={enviar} className="space-y-4">
          <div>
            <label className="etiqueta" htmlFor="email">Email de tu cuenta</label>
            <input id="email" type="email" required className="campo" value={email}
              onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" />
          </div>
          <button className="boton-primario w-full" disabled={cargando}>
            {cargando ? "Enviando…" : "Enviarme el enlace"}
          </button>
          <p className="text-sm text-center">
            <Link href="/login" className="text-salvia-700 hover:underline">Volver a entrar</Link>
          </p>
        </form>
      )}
    </MarcoAuth>
  );
}
