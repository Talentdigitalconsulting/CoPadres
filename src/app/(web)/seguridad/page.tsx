import type { Metadata } from "next";
import { TITULAR } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Seguridad y privacidad",
  description:
    "Cómo protege CoPadres tus datos y los de tus hijos: cifrado, aislamiento por familia, verificación en dos pasos, registro inalterable y política de divulgación responsable.",
  alternates: { canonical: "/seguridad" },
};

const MEDIDAS = [
  { t: "Conexión y datos cifrados", d: "Toda la comunicación viaja por HTTPS con TLS y HSTS. Los datos se guardan cifrados en reposo." },
  { t: "Aislamiento por familia", d: "La base de datos aplica seguridad a nivel de fila en todas las tablas: nadie ajeno a tu espacio familiar puede leer ni escribir tus datos, ni siquiera llamando directamente a la API." },
  { t: "Verificación en dos pasos (2FA)", d: "Puedes exigir un código de una app de autenticación al entrar. La propia base de datos lo comprueba: con solo la contraseña no se accede a nada." },
  { t: "Contraseñas robustas", d: "Mínimo de 10 caracteres y comprobación contra filtraciones conocidas mediante k-anonimato: tu contraseña nunca sale de tu dispositivo." },
  { t: "Invitaciones blindadas", d: "Solo se puede entrar en un espacio con una invitación personal, de un solo uso, que caduca a los 7 días y está ligada al email invitado." },
  { t: "Registro inalterable", d: "Mensajes, solicitudes, consentimientos y auditoría no pueden modificarse ni borrarse. Los gastos solo cambian de estado por transiciones permitidas." },
  { t: "Protección frente a ataques", d: "Política de seguridad de contenidos (CSP) con nonce contra inyección de scripts, protección anti-clickjacking, límites de peticiones contra fuerza bruta y abuso, y comprobación de origen en las operaciones sensibles." },
  { t: "Sin conexión, sin perder nada", d: "Sin internet puedes seguir registrando: los cambios se guardan cifrados con AES-256 en tu dispositivo y se suben solos a tu cuenta al volver la conexión. Nunca se guardan contraseñas ni tokens." },
  { t: "Sesiones bajo control", d: "Cierre automático tras una hora sin actividad y botón para cerrar la sesión en todos tus dispositivos." },
  { t: "Mínimo de datos y de terceros", d: "Sin publicidad, sin analítica de seguimiento y sin vender datos. Los pagos los gestiona Stripe: nunca vemos tu tarjeta." },
];

export default function PaginaSeguridad() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 md:py-16">
      <p className="chip bg-salvia-100 text-salvia-800 mb-4">Seguridad</p>
      <h1 className="font-display text-4xl md:text-5xl leading-tight md:leading-[1.08] max-w-3xl">Tus datos y los de tus hijos, protegidos en cada capa</h1>
      <p className="text-lg text-carbon-claro mt-5 max-w-2xl leading-relaxed">
        CoPadres guarda información sensible. Por eso la seguridad no es una función más: está en el diseño de la base de datos,
        de la aplicación y de cada pantalla.
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-12">
        {MEDIDAS.map((m) => (
          <div key={m.t} className="tarjeta">
            <h2 className="font-semibold text-carbon">{m.t}</h2>
            <p className="text-sm text-carbon-suave mt-2 leading-relaxed">{m.d}</p>
          </div>
        ))}
      </div>
      <section className="mt-12 grid md:grid-cols-2 gap-4">
        <div className="tarjeta bg-crema-50">
          <h2 className="font-display text-xl">Lo que puedes hacer tú</h2>
          <ul className="list-disc pl-5 mt-3 space-y-1.5 text-sm text-carbon-claro">
            <li>Activa la verificación en dos pasos en Ajustes → Seguridad.</li>
            <li>Usa una contraseña única que no utilices en otros sitios.</li>
            <li>No compartas tu móvil desbloqueado ni tu contraseña.</li>
            <li>Si sospechas un acceso indebido, cambia la contraseña y cierra todas las sesiones.</li>
          </ul>
        </div>
        <div className="tarjeta bg-crema-50">
          <h2 className="font-display text-xl">Divulgación responsable</h2>
          <p className="text-sm text-carbon-claro mt-3 leading-relaxed">
            Si encuentras una vulnerabilidad, escríbenos a <a className="text-salvia-700 underline" href={`mailto:${TITULAR.email}`}>{TITULAR.email}</a>{" "}
            antes de hacerla pública. Te responderemos lo antes posible y, si lo deseas, reconoceremos tu aportación. No
            realices pruebas que afecten a datos de otros usuarios ni a la disponibilidad del servicio.
          </p>
          <p className="text-xs text-carbon-suave mt-3">También en /.well-known/security.txt</p>
        </div>
      </section>
      <p className="text-xs text-carbon-suave mt-8 max-w-3xl">
        Ningún sistema conectado a Internet es invulnerable. Aplicamos buenas prácticas reconocidas (OWASP) y las revisamos de forma
        continua. Si se produjera una brecha de seguridad, la notificaríamos a la AEPD y a las personas afectadas conforme al RGPD.
      </p>
    </div>
  );
}
