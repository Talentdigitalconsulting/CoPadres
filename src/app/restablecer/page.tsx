"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import MarcoAuth from "@/components/MarcoAuth";
import { crearClienteNavegador } from "@/lib/supabase/client";

/** El usuario llega aquí desde el enlace del correo de recuperación, ya autenticado. */
export default function PaginaRestablecer() {
  const router = useRouter();
  const [clave, setClave] = useState("");
  const [clave2, setClave2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (clave.length < 8) return setError("La contraseña debe tener al menos 8 caracteres.");
    if (clave !== clave2) return setError("Las contraseñas no coinciden.");
    setCargando(true);
    const supabase = crearClienteNavegador();
    const { error } = await supabase.auth.updateUser({ password: clave });
    setCargando(false);
    if (error) {
      setError("El enlace ha caducado. Solicita uno nuevo desde la pantalla de recuperación.");
      return;
    }
    router.push("/app");
    router.refresh();
  };

  return (
    <MarcoAuth titulo="Nueva contraseña" subtitulo="Elige una contraseña segura.">
      <form onSubmit={guardar} className="space-y-4">
        <div>
          <label className="etiqueta" htmlFor="clave">Nueva contraseña</label>
          <input id="clave" type="password" required minLength={8} className="campo"
            value={clave} onChange={(e) => setClave(e.target.value)} placeholder="Mínimo 8 caracteres" />
        </div>
        <div>
          <label className="etiqueta" htmlFor="clave2">Repítela</label>
          <input id="clave2" type="password" required className="campo"
            value={clave2} onChange={(e) => setClave2(e.target.value)} placeholder="••••••••" />
        </div>
        {error && <p className="text-sm text-vino">{error}</p>}
        <button className="boton-primario w-full" disabled={cargando}>
          {cargando ? "Guardando…" : "Guardar y entrar"}
        </button>
      </form>
    </MarcoAuth>
  );
}
