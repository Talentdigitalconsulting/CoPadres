import type { Metadata } from "next";
import { DOMICILIO_COMPLETO, FECHA_LEGAL, TITULAR, VERSION_LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description:
    "Cómo trata CoPadres tus datos y los de tus hijos conforme al RGPD y la LOPDGDD: finalidades, bases legales, encargados, plazos y derechos.",
  alternates: { canonical: "/legal/privacidad" },
};

export default function PaginaPrivacidad() {
  return (
    <>
      <h1>Política de privacidad</h1>
      <p><em>Versión {VERSION_LEGAL} · Última actualización: {FECHA_LEGAL}</em></p>
      <p>
        En CoPadres tratamos información muy sensible: la de tu familia y la de tus hijos. Por eso aplicamos el Reglamento
        (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD) con el máximo cuidado y te lo explicamos con claridad.
      </p>

      <h2>1. Responsable del tratamiento</h2>
      <table>
        <tbody>
          <tr><th>Responsable</th><td>{TITULAR.nombre} (nombre comercial: {TITULAR.nombreComercial})</td></tr>
          <tr><th>NIF</th><td>{TITULAR.nif}</td></tr>
          <tr><th>Domicilio</th><td>{DOMICILIO_COMPLETO}</td></tr>
          <tr><th>Contacto de privacidad</th><td><a href={`mailto:${TITULAR.email}`}>{TITULAR.email}</a></td></tr>
        </tbody>
      </table>

      <h2>2. Qué datos tratamos</h2>
      <ul>
        <li><strong>Datos de cuenta:</strong> nombre, email, contraseña (guardada cifrada con hash; nunca la vemos), foto de
          perfil si entras con Google, preferencias y factores de verificación en dos pasos.</li>
        <li><strong>Datos del espacio familiar:</strong> nombre del espacio, reparto de gastos del convenio, miembros e invitaciones.</li>
        <li><strong>Datos de los hijos:</strong> nombre, fecha de nacimiento, notas de su ficha, actividades y horarios, y las
          anotaciones del diario, que pueden incluir <strong>datos de salud</strong> (medicación, citas médicas, síntomas).</li>
        <li><strong>Contenido de coordinación:</strong> eventos de custodia, solicitudes de cambio, gastos y comprobantes,
          cuotas recurrentes, mensajes entre progenitores y registro de auditoría.</li>
        <li><strong>Datos de suscripción:</strong> plan, estado y referencias de cliente de Stripe (no guardamos datos de tarjeta).</li>
        <li><strong>Datos técnicos de seguridad:</strong> registros de acceso, dirección IP y contadores de uso para prevenir abusos.</li>
        <li><strong>Prueba de consentimientos:</strong> qué aceptaste, en qué versión y cuándo.</li>
      </ul>

      <h2>3. Para qué los usamos y con qué base legal</h2>
      <table>
        <thead><tr><th>Finalidad</th><th>Base jurídica</th></tr></thead>
        <tbody>
          <tr><td>Crear tu cuenta y prestar el servicio (calendario, gastos, mensajes, diario, informes).</td>
            <td>Ejecución del contrato (art. 6.1.b RGPD).</td></tr>
          <tr><td>Tratar datos de salud de los menores introducidos en el diario o la ficha.</td>
            <td>Consentimiento explícito del progenitor (art. 9.2.a RGPD), que puedes retirar en cualquier momento.</td></tr>
          <tr><td>Filtro de tono y asistente con IA (procesar el texto que escribes o preguntas).</td>
            <td>Ejecución del contrato; el filtro de tono puede desactivarse en Ajustes.</td></tr>
          <tr><td>Cobrar la suscripción y emitir facturas.</td>
            <td>Ejecución del contrato y obligación legal (art. 6.1.b y 6.1.c RGPD).</td></tr>
          <tr><td>Seguridad: prevenir accesos indebidos, fraudes y abusos; registro de auditoría inalterable.</td>
            <td>Interés legítimo (art. 6.1.f RGPD) en proteger el servicio y la integridad del registro compartido.</td></tr>
          <tr><td>Avisos del servicio (notificaciones de la app y emails transaccionales).</td>
            <td>Ejecución del contrato. No enviamos publicidad.</td></tr>
        </tbody>
      </table>
      <p>
        No elaboramos perfiles comerciales, no vendemos datos y no tomamos decisiones automatizadas con efectos jurídicos sobre
        ti. Las sugerencias de la IA son solo propuestas que tú decides si usar.
      </p>

      <h2>4. Datos de menores</h2>
      <p>
        CoPadres no está dirigida a menores y no permite que se registren. Los datos de los hijos los introducen los progenitores
        que ejercen su patria potestad o tutela, que declaran tener legitimación para ello y prestan el consentimiento explícito
        para los datos de salud. Solo son visibles para los dos progenitores del espacio familiar.
      </p>

      <h2>5. Quién puede ver tus datos</h2>
      <ul>
        <li><strong>Los miembros de tu espacio familiar</strong> (el otro progenitor). Nadie más: cada dato está aislado por
          familia mediante seguridad a nivel de fila en la base de datos.</li>
        <li><strong>Las personas a las que tú entregues un informe</strong> (tu abogado o mediador), cuando decidas compartirlo.</li>
        <li><strong>Encargados del tratamiento</strong>, que solo tratan los datos siguiendo nuestras instrucciones y con contrato
          conforme al artículo 28 RGPD:
          <ul>
            <li>Supabase, Inc. — base de datos, autenticación y almacenamiento de comprobantes.</li>
            <li>Vercel, Inc. — alojamiento y ejecución de la aplicación web.</li>
            <li>Stripe Payments Europe, Ltd. (Irlanda) — gestión de pagos y suscripciones.</li>
            <li>Anthropic, PBC — modelos de IA para el filtro de tono y el asistente. Los textos se envían solo para generar la
              respuesta y, según sus condiciones comerciales, no se usan para entrenar sus modelos.</li>
            <li>Google Ireland Ltd. — solo si eliges entrar con tu cuenta de Google.</li>
          </ul>
        </li>
        <li><strong>Autoridades</strong>, únicamente cuando exista una obligación legal o un requerimiento judicial.</li>
      </ul>

      <h2>6. Transferencias internacionales</h2>
      <p>
        Algunos encargados son empresas de Estados Unidos. Cuando sus servicios impliquen una transferencia internacional, esta se
        ampara en el Marco de Privacidad de Datos UE-EE. UU. (decisión de adecuación de la Comisión Europea de 10 de julio de 2023)
        para las empresas adheridas y, en su defecto, en las cláusulas contractuales tipo aprobadas por la Comisión, con medidas
        adicionales como el cifrado. Puedes pedirnos más información en el email de contacto.
      </p>

      <h2>7. Cuánto tiempo los conservamos</h2>
      <ul>
        <li>Mientras tu cuenta esté activa.</li>
        <li>
          Si eliminas tu cuenta, borramos o anonimizamos tus datos identificativos (nombre, email, foto) y tus credenciales. Los
          contenidos que ya compartiste con el otro progenitor (mensajes, gastos, solicitudes, registro) se conservan para él con
          el autor anonimizado, porque forman parte de un registro común que puede necesitar para formular o defender
          reclamaciones (art. 17.3.e RGPD).
        </li>
        <li>Los datos de facturación, durante los plazos que exige la normativa fiscal y mercantil.</li>
        <li>Los registros técnicos de seguridad, como máximo 12 meses, salvo que sean necesarios para investigar un incidente.</li>
      </ul>

      <h2>8. Tus derechos</h2>
      <p>
        Puedes ejercer en cualquier momento tus derechos de <strong>acceso, rectificación, supresión, oposición, limitación del
        tratamiento y portabilidad</strong>, y <strong>retirar tu consentimiento</strong> sin que ello afecte a la licitud del
        tratamiento anterior:
      </p>
      <ul>
        <li>Desde la app: Ajustes → Privacidad y datos (descargar tus datos en JSON o eliminar tu cuenta).</li>
        <li>Por email a <a href={`mailto:${TITULAR.email}`}>{TITULAR.email}</a>, indicando el derecho que ejerces. Si hay dudas
          sobre tu identidad, podremos pedirte que la acredites.</li>
      </ul>
      <p>
        Responderemos en el plazo de un mes. Si consideras que no hemos atendido bien tu solicitud, puedes reclamar ante la
        Agencia Española de Protección de Datos (<a href="https://www.aepd.es" rel="noopener noreferrer" target="_blank">www.aepd.es</a>,
        C/ Jorge Juan 6, 28001 Madrid).
      </p>

      <h2>9. Cómo protegemos tus datos</h2>
      <ul>
        <li>Conexión cifrada (HTTPS/TLS) en todas las comunicaciones y cifrado en reposo en la base de datos.</li>
        <li>Aislamiento por familia con seguridad a nivel de fila: nadie ajeno a tu espacio puede leer ni escribir tus datos.</li>
        <li>Verificación en dos pasos opcional, exigida también por la propia base de datos.</li>
        <li>Contraseñas robustas y comprobación de contraseñas filtradas sin que la contraseña salga de tu dispositivo.</li>
        <li>Mensajes y registro de auditoría inalterables, límites contra ataques de fuerza bruta y cierre de sesión por inactividad.</li>
        <li>Comprobantes en almacenamiento privado, accesibles solo con enlaces temporales.</li>
        <li>
          Modo sin conexión: si usas la app sin internet, lo que registres y la última copia de los datos que has consultado se
          guardan en tu dispositivo cifrados con AES-256 (con una clave que no puede extraerse del navegador). Lo pendiente se sube
          automáticamente a nuestros servidores al recuperar la conexión, solo con tu sesión. Al cerrar sesión se borran las copias
          de consulta; los cambios aún no subidos se conservan cifrados hasta que vuelvas a entrar.
        </li>
      </ul>
      <p>
        Si se produjera una brecha de seguridad que afecte a tus datos, la notificaremos a la AEPD en un máximo de 72 horas y te
        avisaremos cuando exista un riesgo alto para tus derechos. Más detalles en la página de <a href="/seguridad">seguridad</a>.
      </p>

      <h2>10. Cookies</h2>
      <p>Solo usamos cookies técnicas necesarias. Consulta la <a href="/legal/cookies">Política de cookies</a>.</p>

      <h2>11. Cambios en esta política</h2>
      <p>
        Si la modificamos de forma relevante te avisaremos por email o en la app antes de que entre en vigor. Cada versión queda
        identificada por su fecha.
      </p>
    </>
  );
}
