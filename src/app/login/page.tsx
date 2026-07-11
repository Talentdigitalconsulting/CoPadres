"use client";
import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import MarcoAuth from "@/components/MarcoAuth";
import BotonGoogle from "@/components/BotonGoogle";
import { crearClienteNavegador } from "@/lib/supabase/client";

function FormularioLogin() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCargando(true);
    const supabase = crearClienteNavegador();
    const { error } = await supabase.auth.signInWithPassword({ email, password: clave });
    setCargando(false);
    if (error) {
      setError("Email o contraseña incorrectos. Inténtalo de nuevo.");
      return;
    }
    router.push(params.get("siguiente") || "/app");
    router.refresh();
  };

  return (
    <>
      <BotonGoogle />
      <div className="flex items-center gap-3 my-5">
        <span className="h-px flex-1 bg-carbon-linea" />
        <span className="text-xs text-carbon-suave">o con tu email</span>
        <span className="h-px flex-1 bg-carbon-linea" />
      </div>
      <form onSubmit={entrar} className="space-y-4">
        <div>
          <label className="etiqueta" htmlFor="email">Email</label>
          <input id="email" type="email" required className="campo" value={email}
            onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" />
        </div>
        <div>
          <label className="etiqueta" htmlFor="clave">Contraseña</label>
          <input id="clave" type="password" required className="campo" value={clave}
            onChange={(e) => setClave(e.target.value)} placeholder="••••••••" />
        </div>
        {error && <p className="text-sm text-vino">{error}</p>}
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
