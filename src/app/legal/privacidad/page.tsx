export const metadata = { title: "Política de privacidad" };

/**
 * ⚠️ PLANTILLA: revisa este texto con un profesional y completa los datos
 * del responsable (nombre/razón social, NIF y domicilio) antes de lanzar.
 */
export default function PaginaPrivacidad() {
  return (
    <>
      <h1>Política de privacidad</h1>
      <p><em>Última actualización: julio de 2026</em></p>

      <h2>1. Responsable del tratamiento</h2>
      <p>
        [NOMBRE O RAZÓN SOCIAL DEL TITULAR], con NIF [NIF] y domicilio en [DIRECCIÓN]
        (en adelante, «CoPadres»). Contacto de privacidad: [EMAIL DE CONTACTO].
      </p>

      <h2>2. Qué datos tratamos</h2>
      <ul>
        <li><strong>Datos de cuenta:</strong> nombre, email y, si usas Google, tu avatar.</li>
        <li><strong>Datos de coordinación familiar:</strong> calendario de custodia, gastos y comprobantes,
          mensajes entre progenitores, diario del menor y registro de auditoría.</li>
        <li><strong>Datos de menores:</strong> nombre y fecha de nacimiento de los hijos, introducidos por sus
          progenitores en ejercicio de la patria potestad, junto con las anotaciones de salud, medicación y
          escolares que los propios progenitores registren.</li>
        <li><strong>Datos de facturación:</strong> los gestiona Stripe; CoPadres no almacena tarjetas.</li>
      </ul>

      <h2>3. Finalidad y base jurídica</h2>
      <ul>
        <li>Prestar el servicio de coordinación (ejecución del contrato, art. 6.1.b RGPD).</li>
        <li>Mantener el registro documental íntegro entre ambos progenitores, incluido su posible uso
          como prueba (interés legítimo de ambos progenitores, art. 6.1.f RGPD).</li>
        <li>Funciones de IA (filtro de tono y asistente): el texto se envía a la API de Anthropic para
          generar la respuesta; no se usa para entrenar modelos.</li>
        <li>Gestión del cobro de suscripciones (ejecución del contrato).</li>
      </ul>

      <h2>4. Conservación</h2>
      <p>
        Los datos se conservan mientras la cuenta esté activa. Los mensajes y el registro de auditoría son
        inmutables por diseño: ninguna de las partes puede alterarlos ni borrarlos, para preservar su valor
        probatorio. Si eliminas tu cuenta, tu perfil y acceso se suprimen; el registro compartido se conserva
        para el otro progenitor por interés legítimo, quedando tus entradas atribuidas a un usuario dado de baja.
      </p>

      <h2>5. Destinatarios y encargados</h2>
      <ul>
        <li><strong>Supabase</strong> (alojamiento de base de datos y archivos, en la UE si así se configura).</li>
        <li><strong>Vercel</strong> (infraestructura de la aplicación web).</li>
        <li><strong>Anthropic</strong> (procesamiento de las funciones de IA).</li>
        <li><strong>Stripe</strong> (pagos y facturación).</li>
      </ul>
      <p>No vendemos datos ni los cedemos a terceros con fines publicitarios.</p>

      <h2>6. Tus derechos</h2>
      <p>
        Puedes ejercer los derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad
        desde <strong>Ajustes → Privacidad y datos</strong> (descarga en JSON y eliminación de cuenta) o
        escribiendo a [EMAIL DE CONTACTO]. También puedes reclamar ante la Agencia Española de Protección
        de Datos (aepd.es).
      </p>

      <h2>7. Seguridad</h2>
      <p>
        Toda la información viaja cifrada (TLS) y se almacena con aislamiento estricto por familia
        (Row Level Security): cada dato solo es visible para los miembros del espacio familiar al que pertenece.
      </p>
    </>
  );
}
