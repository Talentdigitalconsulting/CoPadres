export const metadata = { title: "Términos de uso" };

/** ⚠️ PLANTILLA: revísala con un profesional antes de lanzar. */
export default function PaginaTerminos() {
  return (
    <>
      <h1>Términos de uso</h1>
      <p><em>Última actualización: julio de 2026</em></p>

      <h2>1. El servicio</h2>
      <p>
        CoPadres es una aplicación de coordinación para progenitores separados: calendario de custodia,
        registro de gastos, mensajería, diario del menor e informes. CoPadres es una herramienta de
        documentación y comunicación; <strong>no presta asesoramiento legal</strong> ni sustituye a
        abogados, mediadores o resoluciones judiciales.
      </p>

      <h2>2. Cuentas y uso aceptable</h2>
      <ul>
        <li>Debes ser mayor de edad y facilitar información veraz.</li>
        <li>Cada cuenta es personal e intransferible.</li>
        <li>No está permitido usar la app para acosar, amenazar o difamar, ni para introducir contenido ilícito.</li>
        <li>Los datos de los menores solo pueden introducirlos quienes ejercen su patria potestad.</li>
      </ul>

      <h2>3. Registro inmutable</h2>
      <p>
        Los mensajes y el registro de auditoría no pueden editarse ni eliminarse una vez creados.
        Al usar CoPadres aceptas esta característica, diseñada para que el registro tenga integridad
        frente a terceros (abogados, mediadores y juzgados).
      </p>

      <h2>4. Suscripciones y pagos</h2>
      <p>
        CoPadres ofrece una prueba gratuita y planes de suscripción mensual (individual y familiar)
        gestionados por Stripe. Puedes cancelar en cualquier momento desde Ajustes; la suscripción
        seguirá activa hasta el final del periodo pagado. Los precios pueden actualizarse con aviso previo.
      </p>

      <h2>5. Funciones de inteligencia artificial</h2>
      <p>
        El filtro de tono y el asistente usan IA generativa. Sus sugerencias son orientativas: tú decides
        siempre qué se envía y qué se hace. La IA puede cometer errores; verifica la información importante.
      </p>

      <h2>6. Responsabilidad</h2>
      <p>
        CoPadres se presta «tal cual». No garantizamos disponibilidad ininterrumpida ni la admisibilidad
        de los informes en procedimientos concretos, que depende de cada tribunal. En la máxima medida
        permitida por la ley, la responsabilidad total queda limitada a las cuotas pagadas en los últimos
        12 meses.
      </p>

      <h2>7. Baja y terminación</h2>
      <p>
        Puedes darte de baja en cualquier momento desde Ajustes. Podremos suspender cuentas que incumplan
        estos términos. Ley aplicable: española. Jurisdicción: los juzgados del domicilio del consumidor.
      </p>
    </>
  );
}
