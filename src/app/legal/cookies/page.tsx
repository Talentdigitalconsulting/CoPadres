import type { Metadata } from "next";
import { FECHA_LEGAL, TITULAR } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Política de cookies",
  description: "CoPadres solo usa cookies técnicas necesarias para mantener tu sesión. Sin publicidad ni seguimiento.",
  alternates: { canonical: "/legal/cookies" },
};

export default function PaginaCookies() {
  return (
    <>
      <h1>Política de cookies</h1>
      <p><em>Última actualización: {FECHA_LEGAL}</em></p>

      <h2>1. Qué son</h2>
      <p>
        Las cookies son pequeños archivos que una web guarda en tu navegador. También aplicamos esta política al almacenamiento
        local del navegador, que usamos con la misma finalidad técnica.
      </p>

      <h2>2. Qué cookies usamos</h2>
      <p>CoPadres solo utiliza cookies <strong>técnicas y estrictamente necesarias</strong>, todas propias:</p>
      <table>
        <thead><tr><th>Nombre</th><th>Finalidad</th><th>Duración</th></tr></thead>
        <tbody>
          <tr>
            <td><code>sb-…-auth-token</code></td>
            <td>Mantener tu sesión iniciada de forma segura (autenticación de Supabase).</td>
            <td>Hasta que cierras sesión o caduca la sesión.</td>
          </tr>
          <tr>
            <td><code>cp_cookies</code></td>
            <td>Recordar que ya has visto el aviso de cookies.</td>
            <td>1 año.</td>
          </tr>
        </tbody>
      </table>
      <p>
        Según el artículo 22.2 de la LSSI-CE, estas cookies están exentas de consentimiento porque son necesarias para prestar el
        servicio que solicitas. Aun así te informamos de ellas.
      </p>

      <h2>3. Lo que no usamos</h2>
      <ul>
        <li>Cookies de publicidad ni de elaboración de perfiles.</li>
        <li>Herramientas de analítica de terceros que sigan tu navegación entre sitios.</li>
        <li>Píxeles de redes sociales.</li>
      </ul>
      <p>
        Si en el futuro incorporásemos cookies que requieran consentimiento, te lo pediríamos antes con un panel que permita
        aceptarlas o rechazarlas con la misma facilidad.
      </p>

      <h2>4. Cómo eliminarlas</h2>
      <p>
        Puedes borrarlas desde la configuración de tu navegador (Chrome, Safari, Firefox o Edge). Si eliminas la cookie de sesión,
        tendrás que volver a entrar en tu cuenta.
      </p>

      <h2>5. Contacto</h2>
      <p>
        Para cualquier duda escribe a <a href={`mailto:${TITULAR.email}`}>{TITULAR.email}</a>.
      </p>
    </>
  );
}
