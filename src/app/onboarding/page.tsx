"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { crearClienteNavegador } from "@/lib/supabase/client";

/**
 * Onboarding en 3 pasos (menos de 2 minutos):
 * 1) Crear el espacio familiar y el reparto de gastos del convenio.
 * 2) Añadir a los hijos.
 * 3) Invitar al otro progenitor (enlace para compartir).
 */
export default function PaginaOnboarding() {
  const router = useRouter();
  const [paso, setPaso] = useState(1);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Paso 1
  const [nombreFamilia, setNombreFamilia] = useState("");
  const [reparto, setReparto] = useState(50);
  const [familiaId, setFamiliaId] = useState<string | null>(null);

  // Paso 2
  const [hijos, setHijos] = useState<{ nombre: string; fecha: string }[]>([{ nombre: "", fecha: "" }]);

  // Paso 3
  const [emailInvitado, setEmailInvitado] = useState("");
  const [enlaceInvitacion, setEnlaceInvitacion] = useState<string | null>(null);

  // Si ya pertenece a una familia, directo a la app.
  useEffect(() => {
    (async () => {
      const supabase = crearClienteNavegador();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("miembros_familia").select("id").eq("usuario_id", user.id).maybeSingle();
      if (data) router.replace("/app");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const crearFamilia = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setError(null);
    const supabase = crearClienteNavegador();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: familia, error: e1 } = await supabase
      .from("familias")
      .insert({ nombre: nombreFamilia, reparto_gastos: reparto, creado_por: user.id })
      .select()
      .single();
    if (e1 || !familia) {
      setError("No se pudo crear el espacio. Inténtalo de nuevo.");
      setCargando(false);
      return;
    }
    await supabase.from("miembros_familia").insert({ familia_id: familia.id, usuario_id: user.id });
    setFamiliaId(familia.id);
    setCargando(false);
    setPaso(2);
  };

  const guardarHijos = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    const supabase = crearClienteNavegador();
    const validos = hijos.filter((h) => h.nombre.trim());
    if (validos.length && familiaId) {
      await supabase.from("hijos").insert(
        validos.map((h) => ({
          familia_id: familiaId,
          nombre: h.nombre.trim(),
          fecha_nacimiento: h.fecha || null,
        }))
      );
    }
    setCargando(false);
    setPaso(3);
  };

  const invitar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!familiaId) return;
    setCargando(true);
    const supabase = crearClienteNavegador();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: inv } = await supabase
      .from("invitaciones")
      .insert({ familia_id: familiaId, email: emailInvitado.trim().toLowerCase(), creado_por: user!.id })
      .select()
      .single();
    setCargando(false);
    if (inv) setEnlaceInvitacion(`${window.location.origin}/invitacion?token=${inv.token}`);
  };

  return (
    <main className="min-h-screen bg-crema-100 px-4 py-10 flex flex-col items-center">
      <Logo />
      <div className="w-full max-w-lg mt-8">
        {/* Indicador de pasos */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3].map((n) => (
            <div key={n}
              className={`h-1.5 flex-1 rounded-full ${n <= paso ? "bg-salvia-600" : "bg-carbon-linea"}`} />
          ))}
        </div>

        {paso === 1 && (
          <form onSubmit={crearFamilia} className="tarjeta p-7 space-y-5">
            <div>
              <h1 className="font-display text-2xl mb-1">Crea vuestro espacio</h1>
              <p className="text-sm text-carbon-suave">
                Un lugar neutral donde quedará registrado todo lo importante.
              </p>
            </div>
            <div>
              <label className="etiqueta">Nombre del espacio</label>
              <input required className="campo" value={nombreFamilia}
                onChange={(e) => setNombreFamilia(e.target.value)}
                placeholder="Ej.: Familia de Lucía y Mateo" />
            </div>
            <div>
              <label className="etiqueta">
                Reparto de gastos extraordinarios según vuestro convenio
              </label>
              <div className="flex items-center gap-4">
                <input type="range" min={0} max={100} step={5} value={reparto}
                  onChange={(e) => setReparto(Number(e.target.value))}
                  className="flex-1 accent-salvia-700" />
                <span className="text-sm font-semibold w-24 text-right">
                  {reparto} % / {100 - reparto} %
                </span>
              </div>
              <p className="text-xs text-carbon-suave mt-1.5">
                Tú asumes el {reparto} % y el otro progenitor el {100 - reparto} %. Podrás cambiarlo en Ajustes.
              </p>
            </div>
            {error && <p className="text-sm text-vino">{error}</p>}
            <button className="boton-primario w-full" disabled={cargando}>
              {cargando ? "Creando…" : "Continuar"}
            </button>
          </form>
        )}

        {paso === 2 && (
          <form onSubmit={guardarHijos} className="tarjeta p-7 space-y-5">
            <div>
              <h1 className="font-display text-2xl mb-1">¿Quiénes son los peques?</h1>
              <p className="text-sm text-carbon-suave">
                El calendario, los gastos y el diario girarán en torno a ellos.
              </p>
            </div>
            {hijos.map((h, i) => (
              <div key={i} className="grid grid-cols-2 gap-3">
                <div>
                  <label className="etiqueta">Nombre</label>
                  <input className="campo" value={h.nombre}
                    onChange={(e) => {
                      const c = [...hijos];
                      c[i] = { ...c[i], nombre: e.target.value };
                      setHijos(c);
                    }}
                    placeholder="Lucía" />
                </div>
                <div>
                  <label className="etiqueta">Fecha de nacimiento</label>
                  <input type="date" className="campo" value={h.fecha}
                    onChange={(e) => {
                      const c = [...hijos];
                      c[i] = { ...c[i], fecha: e.target.value };
                      setHijos(c);
                    }} />
                </div>
              </div>
            ))}
            <button type="button" className="boton-suave text-xs"
              onClick={() => setHijos([...hijos, { nombre: "", fecha: "" }])}>
              + Añadir otro hijo
            </button>
            <button className="boton-primario w-full" disabled={cargando}>
              {cargando ? "Guardando…" : "Continuar"}
            </button>
          </form>
        )}

        {paso === 3 && (
          <div className="tarjeta p-7 space-y-5">
            <div>
              <h1 className="font-display text-2xl mb-1">Invita al otro progenitor</h1>
              <p className="text-sm text-carbon-suave">
                CoPadres funciona mejor con los dos dentro: cada gasto, cambio y mensaje
                queda registrado para ambos.
              </p>
            </div>
            {enlaceInvitacion ? (
              <div className="space-y-4">
                <p className="text-sm text-carbon-claro">
                  Comparte este enlace con <strong>{emailInvitado}</strong> (por el medio que prefieras):
                </p>
                <div className="flex gap-2">
                  <input readOnly className="campo text-xs" value={enlaceInvitacion} />
                  <button type="button" className="boton-secundario shrink-0"
                    onClick={() => navigator.clipboard.writeText(enlaceInvitacion)}>
                    Copiar
                  </button>
                </div>
                <button className="boton-primario w-full" onClick={() => router.push("/app")}>
                  Entrar en mi espacio
                </button>
              </div>
            ) : (
              <form onSubmit={invitar} className="space-y-4">
                <div>
                  <label className="etiqueta">Email del otro progenitor</label>
                  <input type="email" required className="campo" value={emailInvitado}
                    onChange={(e) => setEmailInvitado(e.target.value)} placeholder="su@email.com" />
                </div>
                <button className="boton-primario w-full" disabled={cargando}>
                  {cargando ? "Generando invitación…" : "Generar enlace de invitación"}
                </button>
                <button type="button" className="boton-secundario w-full"
                  onClick={() => router.push("/app")}>
                  Ahora no, lo haré más tarde
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
