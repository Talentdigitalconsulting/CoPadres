import type { Metadata } from "next";
import { ANIO_COPYRIGHT, DOMICILIO_COMPLETO, FECHA_LEGAL, TITULAR, urlSitio } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Aviso legal",
  description: `Aviso legal de CoPadres: titular ${TITULAR.nombre} (${TITULAR.nombreComercial}), condiciones de uso del sitio web y propiedad intelectual.`,
  alternates: { canonical: "/legal/aviso-legal" },
};

export default function PaginaAvisoLegal() {
  return (
    <>
      <h1>Aviso legal</h1>
      <p><em>Última actualización: {FECHA_LEGAL}</em></p>

      <h2>1. Datos identificativos del titular</h2>
      <p>
        En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la
        Información y de Comercio Electrónico (LSSI-CE), se informa de los datos del titular de este sitio web
        y de la aplicación CoPadres:
      </p>
      <table>
        <tbody>
          <tr><th>Titular</th><td>{TITULAR.nombre}</td></tr>
          <tr><th>NIF</th><td>{TITULAR.nif}</td></tr>
          <tr><th>Nombre comercial</th><td>{TITULAR.nombreComercial}</td></tr>
          <tr><th>Domicilio</th><td>{DOMICILIO_COMPLETO}</td></tr>
          <tr><th>Email</th><td><a href={`mailto:${TITULAR.email}`}>{TITULAR.email}</a></td></tr>
          <tr><th>Sitio web</th><td>{urlSitio()}</td></tr>
          <tr><th>Actividad</th><td>Desarrollo y comercialización de software y servicios digitales</td></tr>
        </tbody>
      </table>
      <p>
        En adelante, «el Titular» o «{TITULAR.nombreComercial}». CoPadres es un producto de {TITULAR.nombreComercial},
        nombre comercial de {TITULAR.nombre}.
      </p>

      <h2>2. Objeto</h2>
      <p>
        Este aviso legal regula el acceso y el uso del sitio web y de la aplicación CoPadres (en conjunto, «el Sitio»),
        una herramienta de coordinación para progenitores separados. La contratación del servicio se rige además por
        los <a href="/legal/terminos">Términos y condiciones</a>, y el tratamiento de datos personales por la{" "}
        <a href="/legal/privacidad">Política de privacidad</a>.
      </p>

      <h2>3. Condiciones de uso</h2>
      <p>El acceso al Sitio atribuye la condición de usuario e implica la aceptación de este aviso legal. El usuario se compromete a:</p>
      <ul>
        <li>Hacer un uso lícito, diligente y de buena fe del Sitio, conforme a la ley, la moral y el orden público.</li>
        <li>No acceder ni intentar acceder a cuentas, datos o áreas restringidas de otros usuarios, ni vulnerar las medidas de seguridad.</li>
        <li>No introducir virus, código malicioso ni realizar ataques de denegación de servicio, extracción masiva de datos o ingeniería inversa.</li>
        <li>No usar el Sitio para acosar, amenazar, difamar o suplantar a otras personas.</li>
      </ul>
      <p>
        El Titular podrá suspender el acceso a quien incumpla estas condiciones y ejercer las acciones legales que correspondan,
        incluida la denuncia de los hechos que pudieran ser constitutivos de delito (acceso ilícito a sistemas, artículo 197 bis
        del Código Penal, o daños informáticos, artículo 264).
      </p>

      <h2>4. Propiedad intelectual e industrial</h2>
      <p>
        © {ANIO_COPYRIGHT} {TITULAR.nombreComercial}. Todos los derechos reservados. El Sitio, su código fuente, diseño,
        estructura, textos, gráficos, logotipos, iconos, la marca «CoPadres» y el nombre y logotipo de «{TITULAR.nombreComercial}»
        son titularidad de {TITULAR.nombreComercial} ({TITULAR.nombre}) o de terceros que han autorizado su uso, y están
        protegidos por el Real Decreto Legislativo 1/1996 (Ley de Propiedad Intelectual) y la Ley 17/2001 de Marcas.
      </p>
      <p>
        Queda prohibida su reproducción, distribución, comunicación pública, transformación o cualquier otra forma de
        explotación, total o parcial, sin autorización previa y por escrito del Titular. Se permite citar contenidos de las
        guías con enlace a la fuente. Los contenidos que introducen los usuarios en su espacio familiar son de su titularidad
        (ver Términos y condiciones).
      </p>

      <h2>5. Exclusión de responsabilidad</h2>
      <ul>
        <li>
          <strong>Información orientativa.</strong> Las guías y los contenidos informativos del Sitio son de carácter general y
          no constituyen asesoramiento jurídico. Para tu caso concreto consulta con un abogado de familia o un mediador.
        </li>
        <li>
          <strong>Disponibilidad.</strong> El Titular trabaja para que el Sitio esté disponible y libre de errores, pero no puede
          garantizar la ausencia de interrupciones por mantenimiento, causas técnicas o de fuerza mayor.
        </li>
        <li>
          <strong>Enlaces.</strong> Los enlaces a sitios de terceros se ofrecen solo como referencia; el Titular no se hace
          responsable de sus contenidos ni de sus políticas.
        </li>
      </ul>

      <h2>6. Protección de datos y cookies</h2>
      <p>
        Consulta la <a href="/legal/privacidad">Política de privacidad</a> y la <a href="/legal/cookies">Política de cookies</a>.
        El Sitio solo utiliza cookies técnicas necesarias.
      </p>

      <h2>7. Seguridad y comunicación de vulnerabilidades</h2>
      <p>
        Si detectas un fallo de seguridad, escríbenos a <a href={`mailto:${TITULAR.email}`}>{TITULAR.email}</a> antes de
        divulgarlo. Más información en la página de <a href="/seguridad">seguridad</a>.
      </p>

      <h2>8. Legislación aplicable y jurisdicción</h2>
      <p>
        Este aviso legal se rige por la legislación española. Para cualquier controversia, las partes se someten a los juzgados
        y tribunales que correspondan conforme a la ley; cuando el usuario sea consumidor, serán competentes los de su domicilio.
      </p>
    </>
  );
}
