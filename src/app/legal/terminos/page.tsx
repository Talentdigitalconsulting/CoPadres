import type { Metadata } from "next";
import { DOMICILIO_COMPLETO, FECHA_LEGAL, TITULAR, VERSION_LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Términos y condiciones",
  description:
    "Términos y condiciones de uso y contratación de CoPadres: registro, planes, prueba gratuita, pagos, desistimiento, uso aceptable y responsabilidad.",
  alternates: { canonical: "/legal/terminos" },
};

export default function PaginaTerminos() {
  return (
    <>
      <h1>Términos y condiciones de uso y contratación</h1>
      <p><em>Versión {VERSION_LEGAL} · Última actualización: {FECHA_LEGAL}</em></p>

      <h2>1. Partes e identificación del prestador</h2>
      <p>
        Estos términos regulan la relación entre <strong>{TITULAR.nombre}</strong>, con NIF {TITULAR.nif} y domicilio en{" "}
        {DOMICILIO_COMPLETO}, que opera con el nombre comercial <strong>{TITULAR.nombreComercial}</strong> (en adelante,
        «el Prestador»), y la persona que se registra y usa CoPadres («el Usuario»). Contacto:{" "}
        <a href={`mailto:${TITULAR.email}`}>{TITULAR.email}</a>.
      </p>

      <h2>2. Objeto del servicio</h2>
      <p>
        CoPadres es una aplicación web (instalable en el móvil) de coordinación para progenitores separados o divorciados.
        Permite gestionar un calendario de custodia con solicitudes de cambio auditadas, registrar gastos con comprobante y
        reparto, gestionar actividades y cuotas recurrentes de los hijos, intercambiar mensajes con un filtro de tono basado
        en inteligencia artificial, llevar un diario compartido del menor y generar informes del registro.
      </p>
      <p>
        <strong>CoPadres es una herramienta de organización y documentación.</strong> No presta asesoramiento jurídico,
        psicológico ni de mediación, y no sustituye a abogados, mediadores, servicios sociales ni resoluciones judiciales.
        La validez de los informes como prueba la decide en cada caso el órgano judicial.
      </p>

      <h2>3. Registro y cuenta</h2>
      <ul>
        <li>Para usar CoPadres hay que ser mayor de edad y tener capacidad para contratar.</li>
        <li>El Usuario debe facilitar datos veraces y mantenerlos actualizados.</li>
        <li>
          La cuenta es personal e intransferible. El Usuario es responsable de custodiar su contraseña y se le recomienda activar
          la verificación en dos pasos. Debe comunicar sin demora cualquier uso no autorizado.
        </li>
        <li>
          Solo puede introducir datos de menores quien ejerza su patria potestad o tutela. Al registrarse, el Usuario presta su
          consentimiento expreso para el tratamiento de esos datos, incluidos los de salud, en los términos de la{" "}
          <a href="/legal/privacidad">Política de privacidad</a>.
        </li>
        <li>
          Cada espacio familiar admite a los dos progenitores. El segundo progenitor se une mediante una invitación personal
          que caduca a los 7 días y solo puede aceptarse con el email al que se envió.
        </li>
      </ul>

      <h2>4. Planes, precios y prueba gratuita</h2>
      <ul>
        <li><strong>Plan Individual:</strong> 8,99 € al mes por progenitor.</li>
        <li><strong>Plan Familia:</strong> 14,99 € al mes, cubre a los dos progenitores del espacio.</li>
        <li>Todos los precios incluyen el IVA aplicable.</li>
        <li>
          <strong>Prueba gratuita de 14 días</strong>, sin necesidad de tarjeta. Si al terminar no se contrata un plan, el
          Prestador podrá limitar las funciones de pago, pero el Usuario conservará siempre el acceso a sus datos y la
          posibilidad de exportarlos.
        </li>
        <li>
          El Prestador podrá modificar los precios avisando al Usuario con al menos 30 días de antelación. El nuevo precio se
          aplicará en la siguiente renovación, y el Usuario podrá cancelar antes si no está de acuerdo.
        </li>
      </ul>

      <h2>5. Pago, renovación y cancelación</h2>
      <ul>
        <li>
          Los pagos se procesan a través de Stripe Payments Europe, Ltd. El Prestador no almacena en ningún momento los datos
          completos de la tarjeta.
        </li>
        <li>La suscripción es mensual y se renueva automáticamente cada mes hasta que el Usuario la cancele.</li>
        <li>
          El Usuario puede cancelar en cualquier momento desde Ajustes → Suscripción, con la misma facilidad con la que contrató.
          La cancelación tiene efecto al final del periodo ya pagado; no se cobran nuevas cuotas y no hay permanencia.
        </li>
        <li>Las facturas están disponibles en el portal de cliente de Stripe, accesible desde Ajustes.</li>
      </ul>

      <h2>6. Derecho de desistimiento</h2>
      <p>
        Si eres consumidor, tienes derecho a desistir del contrato en un plazo de <strong>14 días naturales</strong> desde la
        contratación, sin necesidad de justificación (artículos 102 y siguientes del Real Decreto Legislativo 1/2007, Ley General
        para la Defensa de los Consumidores y Usuarios). Para ejercerlo basta con comunicarlo de forma inequívoca a{" "}
        <a href={`mailto:${TITULAR.email}`}>{TITULAR.email}</a>, por ejemplo con este texto:
      </p>
      <blockquote className="border-l-2 border-salvia-400 pl-4 italic">
        «A la atención de {TITULAR.nombre} ({TITULAR.nombreComercial}), {DOMICILIO_COMPLETO}, {TITULAR.email}: por la presente
        le comunico que desisto de mi contrato de suscripción a CoPadres. Fecha de contratación: ___. Nombre y email de la
        cuenta: ___. Fecha y firma (si se envía en papel).»
      </blockquote>
      <p>
        Te devolveremos los importes pagados en un máximo de 14 días por el mismo medio de pago. Como el servicio empieza a
        prestarse inmediatamente a petición tuya, si desistes después de haber empezado a usar un plan de pago se descontará
        la parte proporcional al tiempo ya disfrutado (artículo 108.3 de la misma ley). Durante la prueba gratuita no se cobra
        nada, por lo que no hay importe que devolver.
      </p>

      <h2>7. Uso aceptable</h2>
      <p>El Usuario se compromete a no:</p>
      <ul>
        <li>Usar CoPadres para acosar, amenazar, insultar, difamar o intimidar al otro progenitor o a terceros.</li>
        <li>Introducir datos falsos, documentos manipulados o contenidos ilícitos.</li>
        <li>Acceder o intentar acceder a cuentas o espacios familiares ajenos, o eludir las medidas de seguridad.</li>
        <li>Realizar ingeniería inversa, extracción automatizada de datos o ataques contra la plataforma.</li>
        <li>Revender, sublicenciar o ceder el servicio a terceros.</li>
      </ul>
      <p>
        El incumplimiento podrá dar lugar a la suspensión o cancelación de la cuenta, previo aviso salvo en casos graves o
        cuando lo exija la ley, sin perjuicio de las acciones legales que correspondan.
      </p>

      <h2>8. Registro inmutable y contenidos del Usuario</h2>
      <ul>
        <li>
          Los mensajes, las solicitudes y respuestas, los gastos registrados y el registro de auditoría <strong>no pueden
          editarse ni borrarse</strong> una vez creados; quedan con autor, fecha y hora. Esta característica es esencial
          para que el registro tenga integridad ante terceros y el Usuario la acepta al usar el servicio.
        </li>
        <li>
          El Usuario conserva la titularidad de los contenidos que introduce y concede al Prestador únicamente la licencia
          necesaria para alojarlos, mostrarlos a los miembros de su espacio familiar y prestar el servicio.
        </li>
        <li>
          El Usuario es el único responsable de la veracidad y licitud de lo que introduce. El Prestador no revisa los
          contenidos, aunque retirará los que sean manifiestamente ilícitos cuando tenga conocimiento efectivo de ello.
        </li>
        <li>
          Al darse de baja, los contenidos ya compartidos con el otro progenitor se conservan para él con el autor anonimizado,
          por su interés legítimo en mantener el registro (ver Política de privacidad).
        </li>
      </ul>

      <h2>9. Funciones de inteligencia artificial</h2>
      <p>
        El filtro de tono y el asistente utilizan modelos de IA generativa. Sus sugerencias son orientativas: el Usuario decide
        siempre qué se envía y qué se hace. La IA puede cometer errores; las respuestas del asistente no son asesoramiento
        jurídico. Si la IA no está disponible, los mensajes se envían sin filtrar y nunca se bloquea la comunicación.
      </p>

      <h2>10. Disponibilidad, seguridad y copias</h2>
      <p>
        El Prestador aplica medidas técnicas y organizativas razonables para proteger el servicio y los datos (cifrado en
        tránsito y en reposo, aislamiento por familia, verificación en dos pasos y registro de auditoría). Puede haber interrupciones por mantenimiento, que se procurará avisar con antelación, o por causas ajenas.
      </p>

      <h2>11. Responsabilidad</h2>
      <p>
        El Prestador responde de prestar el servicio con la diligencia debida. No responde de las decisiones que el Usuario
        tome a partir de la información de la app, del contenido introducido por los usuarios ni de daños causados por un uso
        indebido de la cuenta imputable al Usuario. En ningún caso estas condiciones limitan los derechos que la legislación de
        consumidores reconoce al Usuario ni la responsabilidad por dolo o culpa grave.
      </p>

      <h2>12. Propiedad intelectual</h2>
      <p>
        El software, el diseño, la marca CoPadres y los contenidos del sitio son titularidad de {TITULAR.nombreComercial}
        ({TITULAR.nombre}). La suscripción concede al Usuario un derecho de uso personal, no exclusivo e intransferible mientras
        esté vigente, sin ceder ningún otro derecho.
      </p>

      <h2>13. Duración, baja y portabilidad</h2>
      <p>
        El contrato dura mientras la cuenta esté activa. El Usuario puede descargar sus datos y eliminar su cuenta en cualquier
        momento desde Ajustes → Privacidad y datos. Si el Prestador decidiera cesar el servicio, avisará con al menos 60 días de
        antelación para que el Usuario pueda exportar su información.
      </p>

      <h2>14. Modificación de estas condiciones</h2>
      <p>
        Si se modifican estos términos, se avisará al Usuario por email o en la app con al menos 30 días de antelación. Si no
        está de acuerdo, puede cancelar antes de su entrada en vigor. Cada aceptación queda registrada con su versión.
      </p>

      <h2>15. Atención al cliente y reclamaciones</h2>
      <p>
        Para cualquier consulta o reclamación, escribe a <a href={`mailto:${TITULAR.email}`}>{TITULAR.email}</a>; respondemos
        en un plazo máximo de 30 días. El Usuario puede también acudir a los servicios de consumo de su comunidad autónoma y a
        las Juntas Arbitrales de Consumo, y dispone de hojas de reclamaciones a su disposición.
      </p>

      <h2>16. Legislación aplicable y jurisdicción</h2>
      <p>
        Estos términos se rigen por la legislación española. Si el Usuario es consumidor, serán competentes los juzgados y
        tribunales de su domicilio. En otro caso, las partes se someten a los de Córdoba.
      </p>

      <div className="mt-10 pt-6 border-t border-carbon-linea not-italic text-sm text-carbon">
        <p>En {TITULAR.localidad} ({TITULAR.provincia}), a {FECHA_LEGAL}.</p>
        <p className="mt-4">
          Firmado: <strong>{TITULAR.nombre}</strong>
          <br />NIF: {TITULAR.nif}
          <br />{TITULAR.domicilio}, {TITULAR.codigoPostal} {TITULAR.localidad} ({TITULAR.provincia})
          <br />Titular de {TITULAR.nombreComercial}
        </p>
      </div>
    </>
  );
}
