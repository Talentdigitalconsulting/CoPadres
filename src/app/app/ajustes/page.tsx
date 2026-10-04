"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { useFamilia } from "@/lib/useFamilia";
import { validarClave } from "@/lib/claves";
import MedidorClave from "@/components/MedidorClave";

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
  // Verificación en dos pasos (2FA)
  const [factor2fa, setFactor2fa] = useState<{ id: string } | null>(null);
  const [alta2fa, setAlta2fa] = useState<{ id: string; qr: string; secreto: string } | null>(null);
  const [codigo2fa, setCodigo2fa] = useState("");
  const [error2fa, setError2fa] = useState<string | null>(null);

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

  const cargar2fa = async () => {
    const supabase = crearClienteNavegador();
    const { data } = await supabase.auth.mfa.listFactors();
    const verificado = data?.totp?.find((f) => f.status === "verified");
    setFactor2fa(verificado ? { id: verificado.id } : null);
  };
  useEffect(() => {
    cargar2fa();
  }, []);

  const empezar2fa = async () => {
    setError2fa(null);
    const supabase = crearClienteNavegador();
    // Limpia altas a medias de intentos anteriores.
    const { data: lista } = await supabase.auth.mfa.listFactors();
    for (const f of lista?.all ?? []) {
      if (f.status !== "verified") await supabase.auth.mfa.unenroll({ factorId: f.id });
    }
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: `CoPadres ${new Date().toISOString().slice(0, 10)}`,
    });
    if (error || !data) return setError2fa("No se pudo iniciar la activación. Inténtalo de nuevo.");
    setAlta2fa({ id: data.id, qr: data.totp.qr_code, secreto: data.totp.secret });
    setCodigo2fa("");
  };

  const confirmar2fa = async () => {
    if (!alta2fa) return;
    const supabase = crearClienteNavegador();
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: alta2fa.id, code: codigo2fa.trim() });
    if (error) return setError2fa("Código incorrecto. Usa el código actual de tu app de autenticación.");
    setAlta2fa(null);
    setCodigo2fa("");
    avisar("Verificación en dos pasos activada.");
    cargar2fa();
  };

  const desactivar2fa = async () => {
    if (!factor2fa) return;
    if (!window.confirm("¿Desactivar la verificación en dos pasos? Tu cuenta quedará menos protegida.")) return;
    const supabase = crearClienteNavegador();
    const { error } = await supabase.auth.mfa.unenroll({ factorId: factor2fa.id });
    if (error) return avisar("Para desactivarla, vuelve a entrar con tu código de verificación.");
    await supabase.auth.refreshSession();
    avisar("Verificación en dos pasos desactivada.");
    cargar2fa();
  };

  const cerrarTodasLasSesiones = async () => {
    if (!window.confirm("Se cerrará tu sesión en todos los dispositivos, incluido este. ¿Continuar?")) return;
    await crearClienteNavegador().auth.signOut({ scope: "global" });
    router.push("/login");
  };

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
    const problema = await validarClave(clave, { email: perfil?.email ?? undefined, nombre: perfil?.nombre ?? undefined });
    if (problema) return avisar(problema);
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
      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${activo ? "left-5.5 right-0.5" : "left-0.5"}`}
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
            <input type="password" className="campo" value={clave} placeholder="Mínimo 10 caracteres, letras y números"
              autoComplete="new-password" maxLength={128} onChange={(e) => setClave(e.target.value)} />
            <button className="boton-secundario shrink-0 text-xs" onClick={cambiarClave}>Cambiar</button>
          </div>
          <MedidorClave clave={clave} email={perfil?.email ?? undefined} nombre={perfil?.nombre ?? undefined} />
        </div>

        <hr className="border-carbon-linea" />
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Verificación en dos pasos</p>
              <p className="text-xs text-carbon-suave mt-0.5">
                Además de la contraseña, al entrar se pedirá un código de 6 dígitos de una app de autenticación.
                Así nadie puede acceder aunque conozca tu contraseña.
              </p>
            </div>
            <span className={`chip shrink-0 ${factor2fa ? "bg-salvia-100 text-salvia-800" : "bg-crema-200 text-carbon-suave"}`}>
              {factor2fa ? "Activada" : "Desactivada"}
            </span>
          </div>
          {factor2fa ? (
            <button className="boton-secundario text-xs" onClick={desactivar2fa}>Desactivar</button>
          ) : alta2fa ? (
            <div className="bg-crema-100 rounded-xl p-4 space-y-3">
              <p className="text-sm">1. Escanea este código con Google Authenticator, Microsoft Authenticator, 1Password…</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={alta2fa.qr} alt="Código QR para la app de autenticación" className="w-44 h-44 bg-white rounded-lg p-2" />
              <p className="text-xs text-carbon-suave break-all">
                ¿No puedes escanearlo? Escribe esta clave: <code className="bg-white px-1.5 py-0.5 rounded-sm">{alta2fa.secreto}</code>
              </p>
              <p className="text-sm">2. Escribe el código de 6 dígitos que aparece:</p>
              <div className="flex gap-2">
                <input className="campo text-center tracking-[0.3em] font-semibold" inputMode="numeric" maxLength={6}
                  autoComplete="one-time-code" value={codigo2fa} placeholder="000000"
                  onChange={(e) => setCodigo2fa(e.target.value.replace(/\D/g, ""))} />
                <button className="boton-primario shrink-0 text-xs" disabled={codigo2fa.length !== 6} onClick={confirmar2fa}>
                  Activar
                </button>
              </div>
              {error2fa && <p className="text-xs text-vino">{error2fa}</p>}
              <button className="text-xs text-carbon-suave hover:underline" onClick={() => setAlta2fa(null)}>Cancelar</button>
            </div>
          ) : (
            <>
              <button className="boton-primario text-xs" onClick={empezar2fa}>Activar verificación en dos pasos</button>
              {error2fa && <p className="text-xs text-vino">{error2fa}</p>}
            </>
          )}
        </div>

        <hr className="border-carbon-linea" />
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Sesiones abiertas</p>
            <p className="text-xs text-carbon-suave mt-0.5">
              Si usaste CoPadres en un dispositivo que ya no controlas, cierra todas las sesiones.
            </p>
          </div>
          <button className="boton-secundario text-xs shrink-0" onClick={cerrarTodasLasSesiones}>Cerrar todas</button>
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

      {/* ---------- Legal ---------- */}
      <section className="tarjeta space-y-2">
        <h2 className="font-display text-lg">Información legal</h2>
        <nav className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
          <Link href="/legal/aviso-legal" className="text-salvia-700 hover:underline">Aviso legal</Link>
          <Link href="/legal/terminos" className="text-salvia-700 hover:underline">Términos y condiciones</Link>
          <Link href="/legal/privacidad" className="text-salvia-700 hover:underline">Privacidad</Link>
          <Link href="/legal/cookies" className="text-salvia-700 hover:underline">Cookies</Link>
          <Link href="/seguridad" className="text-salvia-700 hover:underline">Seguridad</Link>
        </nav>
        <p className="text-xs text-carbon-suave">© 2026 Talent &amp; Digital Consulting. Todos los derechos reservados.</p>
      </section>
    </div>
  );
}
