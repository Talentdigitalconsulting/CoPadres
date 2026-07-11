"use client";
import { useState } from "react";
import Link from "next/link";
import MarcoAuth from "@/components/MarcoAuth";
import BotonGoogle from "@/components/BotonGoogle";
import { crearClienteNavegador } from "@/lib/supabase/client";

export default function PaginaRegistro() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [aceptaPrivacidad, setAceptaPrivacidad] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);
  const [cargando, setCargando] = useState(false);

  const registrarse = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (clave.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (!aceptaPrivacidad) {
      setError("Debes aceptar la política de privacidad para continuar.");
      return;
    }
    setCargando(true);
    const supabase = crearClienteNavegador();
    const { error } = await supabase.auth.signUp({
      email,
      password: clave,
      options: {
        data: { full_name: nombre },
        emailRedirectTo: `${window.location.origin}/auth/callback?siguiente=/onboarding`,
      },
    });
    setCargando(false);
    if (error) {
      setError(
        error.message.includes("already registered")
          ? "Ya existe una cuenta con este email. Prueba a entrar."
          : "No se ha podido crear la cuenta. Inténtalo de nuevo."
      );
      return;
    }
    setEnviado(true);
  };

  if (enviado) {
    return (
      <MarcoAuth titulo="Revisa tu correo" subtitulo="Un último paso para activar tu cuenta.">
        <p className="text-sm text-carbon-claro leading-relaxed">
          Te hemos enviado un email a <strong>{email}</strong> con un enlace de confirmación.
          Ábrelo para activar tu cuenta y empezar a usar CoPadres.
        </p>
        <Link href="/login" className="boton-suave w-full mt-6">Volver a entrar</Link>
      </MarcoAuth>
    );
  }

  return (
    <MarcoAuth
      titulo="Crea tu cuenta"
      subtitulo="Empieza a coordinar con calma. Prueba gratuita de 14 días, sin tarjeta."
    >
      <BotonGoogle texto="Registrarme con Google" />
      <div className="flex items-center gap-3 my-5">
        <span className="h-px flex-1 bg-carbon-linea" />
        <span className="text-xs text-carbon-suave">o con tu email</span>
        <span className="h-px flex-1 bg-carbon-linea" />
      </div>
      <form onSubmit={registrarse} className="space-y-4">
        <div>
          <label className="etiqueta" htmlFor="nombre">Tu nombre</label>
          <input id="nombre" required className="campo" value={nombre}
            onChange={(e) => setNombre(e.target.value)} placeholder="María García" />
        </div>
        <div>
          <label className="etiqueta" htmlFor="email">Email</label>
          <input id="email" type="email" required className="campo" value={email}
            onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" />
        </div>
        <div>
          <label className="etiqueta" htmlFor="clave">Contraseña</label>
          <input id="clave" type="password" required minLength={8} className="campo" value={clave}
            onChange={(e) => setClave(e.target.value)} placeholder="Mínimo 8 caracteres" />
        </div>
        <label className="flex items-start gap-2.5 text-xs text-carbon-suave leading-relaxed">
          <input type="checkbox" checked={aceptaPrivacidad}
            onChange={(e) => setAceptaPrivacidad(e.target.checked)}
            className="mt-0.5 accent-salvia-700" />
          <span>
            He leído y acepto la{" "}
            <Link href="/legal/privacidad" className="underline" target="_blank">
              política de privacidad
            </Link>{" "}
            y el tratamiento de mis datos conforme al RGPD.
          </span>
        </label>
        {error && <p className="text-sm text-vino">{error}</p>}
        <button className="boton-primario w-full" disabled={cargando}>
          {cargando ? "Creando cuenta…" : "Crear cuenta gratis"}
        </button>
      </form>
      <p className="mt-5 text-sm text-center text-carbon-suave">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-salvia-700 font-semibold hover:underline">Entrar</Link>
      </p>
    </MarcoAuth>
  );
}
