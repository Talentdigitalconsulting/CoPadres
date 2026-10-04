"use client";
import { useState } from "react";
import Link from "next/link";
import MarcoAuth from "@/components/MarcoAuth";
import BotonGoogle from "@/components/BotonGoogle";
import MedidorClave from "@/components/MedidorClave";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { validarClave } from "@/lib/claves";
import { VERSION_LEGAL } from "@/lib/legal";

export default function PaginaRegistro() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [consentimientos, setConsentimientos] = useState({ terminos: false, privacidad: false, salud: false });
  const [error, setError] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);
  const [cargando, setCargando] = useState(false);

  const todoAceptado = consentimientos.terminos && consentimientos.privacidad && consentimientos.salud;

  const registrarse = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!todoAceptado) {
      setError("Para crear la cuenta debes aceptar las tres casillas.");
      return;
    }
    setCargando(true);
    const problema = await validarClave(clave, { email, nombre });
    if (problema) {
      setCargando(false);
      setError(problema);
      return;
    }
    const supabase = crearClienteNavegador();
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password: clave,
      options: {
        data: {
          full_name: nombre.trim(),
          // Se guardan como prueba del consentimiento (tabla consentimientos).
          consentimientos: { version: VERSION_LEGAL, tipos: ["terminos", "privacidad", "datos_salud_menores"] },
        },
        emailRedirectTo: `${window.location.origin}/auth/callback?siguiente=/onboarding`,
      },
    });
    setCargando(false);
    if (error) {
      setError(
        error.status === 429
          ? "Demasiados intentos. Espera unos minutos."
          : error.message.toLowerCase().includes("password")
          ? "La contraseña no cumple los requisitos de seguridad."
          : "No se ha podido crear la cuenta. Inténtalo de nuevo."
      );
      return;
    }
    // Siempre el mismo mensaje, exista o no la cuenta (no se revela qué emails están registrados).
    setEnviado(true);
  };

  if (enviado) {
    return (
      <MarcoAuth titulo="Revisa tu correo" subtitulo="Un último paso para activar tu cuenta.">
        <p className="text-sm text-carbon-claro leading-relaxed">
          Si el email <strong>{email}</strong> es correcto, te llegará un enlace de confirmación en unos minutos.
          Ábrelo para activar tu cuenta. Si ya tenías cuenta, entra directamente o recupera tu contraseña.
        </p>
        <Link href="/login" className="boton-suave w-full mt-6">Ir a entrar</Link>
      </MarcoAuth>
    );
  }

  const Casilla = ({ clave: k, children }: { clave: keyof typeof consentimientos; children: React.ReactNode }) => (
    <label className="flex items-start gap-2.5 text-xs text-carbon-claro leading-relaxed cursor-pointer">
      <input type="checkbox" checked={consentimientos[k]} required
        onChange={(e) => setConsentimientos({ ...consentimientos, [k]: e.target.checked })}
        className="mt-0.5 w-4 h-4 shrink-0 accent-salvia-700" />
      <span>{children}</span>
    </label>
  );

  return (
    <MarcoAuth
      titulo="Crea tu cuenta"
      subtitulo="Empieza a coordinar con calma. Prueba gratuita de 14 días, sin tarjeta."
    >
      <BotonGoogle texto="Registrarme con Google" />
      <p className="text-[11px] text-carbon-suave mt-2 text-center">
        Con Google te pediremos estas mismas aceptaciones al crear tu espacio.
      </p>
      <div className="flex items-center gap-3 my-5">
        <span className="h-px flex-1 bg-carbon-linea" />
        <span className="text-xs text-carbon-suave">o con tu email</span>
        <span className="h-px flex-1 bg-carbon-linea" />
      </div>
      <form onSubmit={registrarse} className="space-y-4">
        <div>
          <label className="etiqueta" htmlFor="nombre">Tu nombre</label>
          <input id="nombre" required autoComplete="name" maxLength={80} className="campo" value={nombre}
            onChange={(e) => setNombre(e.target.value)} placeholder="María García" />
        </div>
        <div>
          <label className="etiqueta" htmlFor="email">Email</label>
          <input id="email" type="email" required autoComplete="email" maxLength={254} className="campo" value={email}
            onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" />
        </div>
        <div>
          <label className="etiqueta" htmlFor="clave">Contraseña</label>
          <input id="clave" type="password" required minLength={10} maxLength={128} autoComplete="new-password"
            className="campo" value={clave} onChange={(e) => setClave(e.target.value)}
            placeholder="Mínimo 10 caracteres, letras y números" />
          <MedidorClave clave={clave} email={email} nombre={nombre} />
        </div>
        <div className="space-y-2.5 bg-crema-100 rounded-xl p-3.5">
          <Casilla clave="terminos">
            Acepto los{" "}
            <Link href="/legal/terminos" className="underline" target="_blank">Términos y condiciones</Link>{" "}
            y el <Link href="/legal/aviso-legal" className="underline" target="_blank">Aviso legal</Link>, y declaro ser
            mayor de edad.
          </Casilla>
          <Casilla clave="privacidad">
            He leído la{" "}
            <Link href="/legal/privacidad" className="underline" target="_blank">Política de privacidad</Link>{" "}
            y acepto el tratamiento de mis datos para prestar el servicio.
          </Casilla>
          <Casilla clave="salud">
            Consiento expresamente el tratamiento de los datos de mis hijos que yo introduzca (incluidos datos de
            salud, como medicación o citas médicas) y declaro ejercer su patria potestad o tutela.
          </Casilla>
        </div>
        {error && <p className="text-sm text-vino" role="alert">{error}</p>}
        <button className="boton-primario w-full" disabled={cargando || !todoAceptado}>
          {cargando ? "Comprobando…" : "Crear cuenta gratis"}
        </button>
      </form>
      <p className="mt-5 text-sm text-center text-carbon-suave">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-salvia-700 font-semibold hover:underline">Entrar</Link>
      </p>
    </MarcoAuth>
  );
}
