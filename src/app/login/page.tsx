"use client";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import MarcoAuth from "@/components/MarcoAuth";
import BotonGoogle from "@/components/BotonGoogle";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { rutaSegura } from "@/lib/seguridad";

const AVISOS: Record<string, string> = {
  inactividad: "Hemos cerrado tu sesión tras un rato sin actividad, para proteger tus datos.",
  enlace_invalido: "El enlace ha caducado o no es válido. Vuelve a intentarlo.",
};

function FormularioLogin() {
  const router = useRouter();
  const params = useSearchParams();
  const destino = rutaSegura(params.get("siguiente"));
  const [paso, setPaso] = useState<"clave" | "codigo">(params.get("mfa") === "1" ? "codigo" : "clave");
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const aviso = AVISOS[params.get("motivo") ?? params.get("error") ?? ""];

  const entrarEnLaApp = () => {
    router.push(destino);
    router.refresh();
  };

  // Si llega con ?mfa=1 pero ya no hace falta código (o no hay sesión), se ajusta el paso.
  useEffect(() => {
    if (paso !== "codigo") return;
    (async () => {
      const supabase = crearClienteNavegador();
      const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (!data || data.currentLevel === null) setPaso("clave");
      else if (data.nextLevel !== "aal2" || data.currentLevel === "aal2") entrarEnLaApp();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCargando(true);
    const supabase = crearClienteNavegador();
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: clave });
    if (error) {
      setCargando(false);
      // Mensaje genérico: no revela si el email existe.
      setError(
        error.status === 429
          ? "Demasiados intentos. Espera unos minutos antes de volver a probar."
          : "Email o contraseña incorrectos. Inténtalo de nuevo."
      );
      return;
    }
    setClave("");
    const { data: nivel } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    setCargando(false);
    if (nivel?.nextLevel === "aal2" && nivel.currentLevel !== "aal2") {
      setPaso("codigo");
      return;
    }
    entrarEnLaApp();
  };

  const verificarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCargando(true);
    const supabase = crearClienteNavegador();
    const { data: factores } = await supabase.auth.mfa.listFactors();
    const totp = factores?.totp?.[0];
    if (!totp) {
      setCargando(false);
      return entrarEnLaApp();
    }
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: totp.id, code: codigo.replace(/\s/g, "") });
    setCargando(false);
    if (error) {
      setCodigo("");
      setError(
        error.status === 429
          ? "Demasiados intentos. Espera unos minutos."
          : "Código incorrecto o caducado. Abre tu app de autenticación y usa el código actual."
      );
      return;
    }
    entrarEnLaApp();
  };

  const cancelar = async () => {
    await crearClienteNavegador().auth.signOut();
    setPaso("clave");
    setCodigo("");
    setError(null);
  };

  if (paso === "codigo") {
    return (
      <form onSubmit={verificarCodigo} className="space-y-4">
        <p className="text-sm text-carbon-claro leading-relaxed">
          Tu cuenta tiene activada la <strong>verificación en dos pasos</strong>. Escribe el código de 6 dígitos
          que muestra tu app de autenticación (Google Authenticator, Microsoft Authenticator, 1Password…).
        </p>
        <div>
          <label className="etiqueta" htmlFor="codigo">Código de verificación</label>
          <input id="codigo" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,7}" maxLength={7}
            required autoFocus className="campo text-center text-xl tracking-[0.4em] font-semibold" value={codigo}
            onChange={(e) => setCodigo(e.target.value.replace(/[^\d ]/g, ""))} placeholder="000000" />
        </div>
        {error && <p className="text-sm text-vino" role="alert">{error}</p>}
        <button className="boton-primario w-full" disabled={cargando || codigo.replace(/\s/g, "").length !== 6}>
          {cargando ? "Verificando…" : "Verificar y entrar"}
        </button>
        <button type="button" onClick={cancelar} className="text-sm text-carbon-suave hover:underline w-full">
          Usar otra cuenta
        </button>
      </form>
    );
  }

  return (
    <>
      {aviso && <p className="text-sm bg-crema-200 rounded-xl px-3 py-2 mb-4 text-carbon-claro">{aviso}</p>}
      <BotonGoogle />
      <div className="flex items-center gap-3 my-5">
        <span className="h-px flex-1 bg-carbon-linea" />
        <span className="text-xs text-carbon-suave">o con tu email</span>
        <span className="h-px flex-1 bg-carbon-linea" />
      </div>
      <form onSubmit={entrar} className="space-y-4">
        <div>
          <label className="etiqueta" htmlFor="email">Email</label>
          <input id="email" type="email" required autoComplete="email" className="campo" value={email}
            onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" />
        </div>
        <div>
          <label className="etiqueta" htmlFor="clave">Contraseña</label>
          <input id="clave" type="password" required autoComplete="current-password" className="campo" value={clave}
            onChange={(e) => setClave(e.target.value)} placeholder="••••••••••" />
        </div>
        {error && <p className="text-sm text-vino" role="alert">{error}</p>}
        <button className="boton-primario w-full" disabled={cargando}>
          {cargando ? "Entrando…" : "Entrar"}
        </button>
      </form>
      <div className="mt-5 flex items-center justify-between text-sm">
        <Link href="/recuperar" className="text-salvia-700 hover:underline">
          He olvidado mi contraseña
        </Link>
        <Link href="/registro" className="text-salvia-700 font-semibold hover:underline">
          Crear cuenta
        </Link>
      </div>
    </>
  );
}

export default function PaginaLogin() {
  return (
    <MarcoAuth titulo="Bienvenido de nuevo" subtitulo="Entra en tu espacio de coordinación.">
      <Suspense>
        <FormularioLogin />
      </Suspense>
    </MarcoAuth>
  );
}
