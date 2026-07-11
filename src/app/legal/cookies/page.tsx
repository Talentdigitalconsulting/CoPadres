export const metadata = { title: "Política de cookies" };

export default function PaginaCookies() {
  return (
    <>
      <h1>Política de cookies</h1>
      <p><em>Última actualización: julio de 2026</em></p>

      <h2>Qué cookies usamos</h2>
      <p>CoPadres únicamente utiliza cookies <strong>técnicas e imprescindibles</strong>:</p>
      <ul>
        <li><strong>Cookies de sesión de Supabase</strong> (autenticación): mantienen tu sesión iniciada
          de forma segura. Caducan al cerrar sesión o expirar el token.</li>
        <li><strong>cp_cookies</strong>: recuerda que has visto el aviso de cookies (1 año).</li>
      </ul>

      <h2>Lo que NO usamos</h2>
      <ul>
        <li>Cookies de publicidad o de perfilado.</li>
        <li>Cookies de analítica de terceros con seguimiento entre sitios.</li>
        <li>Píxeles de redes sociales.</li>
      </ul>

      <h2>Cómo gestionarlas</h2>
      <p>
        Al ser cookies estrictamente necesarias para el funcionamiento del servicio, no requieren
        consentimiento previo, aunque puedes eliminarlas desde la configuración de tu navegador.
        Si lo haces, se cerrará tu sesión.
      </p>
    </>
  );
}
