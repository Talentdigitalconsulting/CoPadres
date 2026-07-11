"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { useFamilia } from "@/lib/useFamilia";

type Suscripcion = { plan: string | null; estado: string; periodo_fin: string | null } | null;

/** Panel de configuración completo. */
export default function PaginaAjustes() {
  const router = useRouter();
  const { cargando, usuarioId, perfil, familia, hijos, otroProgenitor, recargar } = useFamilia();
  const [aviso, setAviso] = useState<string | null>(null);

  // Perfil
  const [nombre, setNombre] = useState("");
  // Familia
  const [nombreFamilia, setNombreFamilia] = useState("");
  const [reparto, setReparto] = useState(50);
  const [nuevoHijo, setNuevoHijo] = useState("");
  const [emailInvitado, setEmailInvitado] = useState("");
  const [enlaceInvitacion, setEnlaceInvitacion] = useState<string | null>(null);
  // Notificaciones e IA
  const [prefs, setPrefs] = useState({
    notif_mensajes: true, notif_gastos: true, notif_calendario: true, notif_diario: true, filtro_tono: true,
  });
  // Seguridad
  const [clave, setClave] = useState("");
  // Suscripción
  const [suscripcion, setSuscripcion] = useState<Suscripcion>(null);

  useEffect(() => {
    if (perfil) {
      setNombre(perfil.nombre ?? "");
      setPrefs({
        notif_mensajes: perfil.notif_mensajes,
        notif_gastos: perfil.notif_gastos,
        notif_calendario: perfil.notif_calendario,
        notif_diario: perfil.notif_diario,
        filtro_tono: perfil.filtro_tono,
      });
    }
    if (familia) {
      setNombreFamilia(familia.nombre);
      setReparto(familia.reparto_gastos);
    }
  }, [perfil, familia]);

  useEffect(() => {
    (async () => {
      const supabase = crearClienteNavegador();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("suscripciones").select("plan, estado, periodo_fin")
        .eq("usuario_id", user.id).maybeSingle();
      setSuscripcion(data as Suscripcion);
    })();
  }, []);

  const avisar = (texto: string) => {
    setAviso(texto);
    setTimeout(() => setAviso(null), 3000);
  };

  const guardarPerfil = async () => {
    const supabase = crearClienteNavegador();
    await supabase.from("perfiles").update({ nombre }).eq("id", usuarioId!);
    avisar("Perfil guardado.");
    recargar();
  };

  const guardarFamilia = async () => {
    const supabase = crearClienteNavegador();
    await supabase.from("familias").update({ nombre: nombreFamilia, reparto_gastos: reparto })
      .eq("id", familia!.id);
    avisar("Espacio familiar actualizado.");
    recargar();
  };

  const guardarPrefs = async (nuevas: typeof prefs) => {
    setPrefs(nuevas);
    const supabase = crearClienteNavegador();
    await supabase.from("perfiles").update(nuevas).eq("id", usuarioId!);
  };

  const anadirHijo = async () => {
    if (!nuevoHijo.trim()) return;
    const supabase = crearClienteNavegador();
    await supabase.from("hijos").insert({ familia_id: familia!.id, nombre: nuevoHijo.trim() });
    setNuevoHijo("");
    recargar();
  };

  const invitar = async () => {
    if (!emailInvitado.trim()) return;
    const supabase = crearClienteNavegador();
    const { data } = await supabase.from("invitaciones")
      .insert({ familia_id: familia!.id, email: emailInvitado.trim().toLowerCase(), creado_por: usuarioId! })
      .select().single();
    if (data) setEnlaceInvitacion(`${window.location.origin}/invitacion?token=${data.token}`);
  };

  const cambiarClave = async () => {
    if (clave.length < 8) return avisar("La contraseña debe tener al menos 8 caracteres.");
    const supabase = crearClienteNavegador();
    const { error } = await supabase.auth.updateUser({ password: clave });
    setClave("");
    avisar(error ? "No se pudo cambiar la contraseña." : "Contraseña actualizada.");
  };

  const exportarDatos = async () => {
    const respuesta = await fetch("/api/cuenta/exportar");
    if (!respuesta.ok) return avisar("No se pudo exportar.");
    const blob = await respuesta.blob();
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = "copadres-mis-datos.json";
    enlace.click();
    URL.revokeObjectURL(url);
  };

  const eliminarCuenta = async () => {
    const seguro = window.prompt(
      'Esta acción es irreversible: se eliminará tu cuenta y tus datos personales. ' +
      'Escribe ELIMINAR para confirmar.'
    );
    if (seguro !== "ELIMINAR") return;
    const respuesta = await fetch("/api/cuenta/eliminar", { method: "POST" });
    if (respuesta.ok) {
      await crearClienteNavegador().auth.signOut();
      router.push("/");
    } else {
      avisar("No se pudo eliminar la cuenta. Escríbenos a soporte.");
    }
  };

  const abrirPortal = async () => {
    const respuesta = await fetch("/api/stripe/portal", { method: "POST" });
    const datos = await respuesta.json();
    if (datos.url) window.location.href = datos.url;
    else avisar("Aún no tienes una suscripción activa.");
  };

  if (cargando) return <p className="text-sm text-carbon-suave">Cargando…</p>;

  const Interruptor = ({ activo, onCambio }: { activo: boolean; onCambio: (v: boolean) => void }) => (
    <button type="button" onClick={() => onCambio(!activo)}
      className={`w-11 h-6 rounded-full transition-colors relative ${activo ? "bg-salvia-600" : "bg-carbon-linea"}`}>
      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${activo ? "left-5.5 right-0.5" : "left-0.5"}`}
        style={{ left: activo ? "1.375rem" : "0.125rem" }} />
    </button>
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <header>
        <h1 className="titulo-seccion">Ajustes</h1>
        <p className="text-sm text-carbon-suave mt-1">Tu cuenta, vuestro espacio y tus preferencias.</p>
      </header>

      {aviso && (
        <div className="fixed top-16 md:top-6 right-4 z-50 bg-salvia-800 text-crema-50 text-sm rounded-xl px-4 py-2.5 shadow-flotante">
          {aviso}
        </div>
      )}

      {/* ---------- Perfil ---------- */}
      <section className="tarjeta space-y-4">
        <h2 className="font-display text-lg">Perfil</h2>
        <div>
          <label className="etiqueta">Tu nombre</label>
          <input className="campo" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </div>
        <p className="text-xs text-carbon-suave">Email: {perfil?.email}</p>
        <button className="boton-primario text-xs" onClick={guardarPerfil}>Guardar perfil</button>
      </section>

      {/* ---------- Espacio familiar ---------- */}
      <section className="tarjeta space-y-4" id="familia">
        <h2 className="font-display text-lg">Espacio familiar</h2>
        <div>
          <label className="etiqueta">Nombre del espacio</label>
          <input className="campo" value={nombreFamilia} onChange={(e) => setNombreFamilia(e.target.value)} />
        </div>
        <div>
          <label className="etiqueta">Reparto de gastos según convenio (tu parte, si creaste el espacio)</label>
          <div className="flex items-center gap-4">
            <input type="range" min={0} max={100} step={5} value={reparto}
              onChange={(e) => setReparto(Number(e.target.value))} className="flex-1 accent-salvia-700" />
            <span className="text-sm font-semibold w-24 text-right">{reparto} % / {100 - reparto} %</span>
          </div>
        </div>
        <button className="boton-primario text-xs" onClick={guardarFamilia}>Guardar cambios</button>

        <hr className="border-carbon-linea" />
        <h3 className="text-sm font-semibold">Hijos</h3>
        <ul className="text-sm space-y-1">
          {hijos.map((h) => <li key={h.id}>· {h.nombre}</li>)}
        </ul>
        <div className="flex gap-2">
          <input className="campo" placeholder="Nombre del nuevo hijo" value={nuevoHijo}
            onChange={(e) => setNuevoHijo(e.target.value)} />
          <button className="boton-secundario shrink-0 text-xs" onClick={anadirHijo}>Añadir</button>
        </div>

        {!otroProgenitor && (
          <>
            <hr className="border-carbon-linea" />
            <h3 className="text-sm font-semibold">Invitar al otro progenitor</h3>
            {enlaceInvitacion ? (
              <div className="flex gap-2">
                <input readOnly className="campo text-xs" value={enlaceInvitacion} />
                <button className="boton-secundario shrink-0 text-xs"
                  onClick={() => { navigator.clipboard.writeText(enlaceInvitacion); avisar("Enlace copiado."); }}>
                  Copiar
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input type="email" className="campo" placeholder="su@email.com" value={emailInvitado}
                  onChange={(e) => setEmailInvitado(e.target.value)} />
                <button className="boton-secundario shrink-0 text-xs" onClick={invitar}>Generar enlace</button>
              </div>
            )}
          </>
        )}
      </section>

      {/* ---------- Notificaciones ---------- */}
      <section className="tarjeta space-y-4">
        <h2 className="font-display text-lg">Notificaciones</h2>
        {(
          [
            ["notif_mensajes", "Mensajes nuevos"],
            ["notif_gastos", "Gastos y aprobaciones"],
            ["notif_calendario", "Calendario y solicitudes de cambio"],
            ["notif_diario", "Anotaciones del diario"],
          ] as const
        ).map(([clave, texto]) => (
          <div key={clave} className="flex items-center justify-between">
            <p className="text-sm">{texto}</p>
            <Interruptor activo={prefs[clave]} onCambio={(v) => guardarPrefs({ ...prefs, [clave]: v })} />
          </div>
        ))}
      </section>

      {/* ---------- Inteligencia artificial ---------- */}
      <section className="tarjeta space-y-4">
        <h2 className="font-display text-lg">Inteligencia artificial</h2>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Filtro de tono en mensajes</p>
            <p className="text-xs text-carbon-suave mt-0.5">
              Antes de enviar, la IA detecta el tono agresivo y te propone una versión serena.
              Tú siempre decides qué se envía.
            </p>
          </div>
          <Interruptor activo={prefs.filtro_tono} onCambio={(v) => guardarPrefs({ ...prefs, filtro_tono: v })} />
        </div>
      </section>

      {/* ---------- Suscripción ---------- */}
      <section className="tarjeta space-y-3">
        <h2 className="font-display text-lg">Suscripción</h2>
        {suscripcion && suscripcion.estado === "activa" ? (
          <>
            <p className="text-sm">
              Plan <strong className="capitalize">{suscripcion.plan}</strong> · activa
              {suscripcion.periodo_fin &&
                ` · se renueva el ${new Date(suscripcion.periodo_fin).toLocaleDateString("es-ES")}`}
            </p>
            <button className="boton-secundario text-xs" onClick={abrirPortal}>
              Gestionar suscripción y facturas
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-carbon-suave">
              Estás en el periodo de prueba o sin plan activo.
            </p>
            <Link href="/precios" className="boton-primario text-xs">Ver planes</Link>
          </>
        )}
      </section>

      {/* ---------- Seguridad ---------- */}
      <section className="tarjeta space-y-4">
        <h2 className="font-display text-lg">Seguridad</h2>
        <div>
          <label className="etiqueta">Nueva contraseña</label>
          <div className="flex gap-2">
            <input type="password" className="campo" value={clave} placeholder="Mínimo 8 caracteres"
              onChange={(e) => setClave(e.target.value)} />
            <button className="boton-secundario shrink-0 text-xs" onClick={cambiarClave}>Cambiar</button>
          </div>
        </div>
      </section>

      {/* ---------- Privacidad y datos (RGPD) ---------- */}
      <section className="tarjeta space-y-4">
        <h2 className="font-display text-lg">Privacidad y datos</h2>
        <p className="text-xs text-carbon-suave leading-relaxed">
          Conforme al RGPD, puedes descargar una copia de tus datos o eliminar tu cuenta.
          Consulta la <Link href="/legal/privacidad" className="underline">política de privacidad</Link>.
        </p>
        <div className="flex gap-2 flex-wrap">
          <button className="boton-secundario text-xs" onClick={exportarDatos}>
            Descargar mis datos (JSON)
          </button>
          <button className="boton-peligro text-xs" onClick={eliminarCuenta}>
            Eliminar mi cuenta
          </button>
        </div>
      </section>
    </div>
  );
}
