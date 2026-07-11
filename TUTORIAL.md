# Tutorial completo de CoPadres

Guía en dos partes: **A) puesta en marcha** (de cero a la app funcionando en internet) y
**B) manual de uso** de cada pantalla. Escrito para poder seguirlo sin experiencia técnica previa.

---

# PARTE A — Puesta en marcha

Necesitarás crear 4 cuentas gratuitas: **Supabase** (base de datos y usuarios), **Vercel**
(alojamiento web), **Anthropic** (la IA) y **Stripe** (cobros). En total, 45–60 minutos.

## A.1 — Supabase (base de datos, usuarios y archivos)

1. Entra en **supabase.com** → *Start your project* → crea cuenta (puedes usar Google).
2. *New project*: nombre `copadres`, elige región **Europe West (Ireland o Frankfurt)** —
   importante para el RGPD — y apunta la contraseña de la base de datos.
3. Cuando termine de crearse, ve a **SQL Editor → New query**, abre el archivo
   `supabase/schema.sql` de este proyecto, **copia TODO su contenido**, pégalo y pulsa **Run**.
   Debe terminar en "Success". Esto crea todas las tablas, la seguridad por familia (RLS),
   las notificaciones automáticas y el registro de auditoría inmutable.
4. Ve a **Project Settings → API** y copia estos 3 valores (los usarás en el paso A.5):
   - `Project URL` → será `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → será `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → será `SUPABASE_SERVICE_ROLE_KEY` (⚠️ secreta, nunca la compartas)

### Activar "Entrar con Google"

5. Ve a **console.cloud.google.com** → crea un proyecto → *APIs & Services → OAuth consent screen*
   (tipo *External*, rellena nombre y tu email) → *Credentials → Create credentials → OAuth client ID*
   → tipo *Web application*.
   - En **Authorized redirect URIs** pega la URL que te da Supabase en
     **Authentication → Providers → Google** (tiene la forma `https://TU-PROYECTO.supabase.co/auth/v1/callback`).
6. Copia el *Client ID* y el *Client Secret* de Google y pégalos en Supabase →
   **Authentication → Providers → Google** → *Enable* → *Save*.

### URLs de retorno y correos

7. En Supabase → **Authentication → URL Configuration**:
   - *Site URL*: la URL de tu app (al principio `http://localhost:3000`; cuando despliegues,
     cámbiala por `https://tu-app.vercel.app`).
   - *Redirect URLs*: añade `http://localhost:3000/**` y `https://tu-app.vercel.app/**`.
8. (Opcional pero recomendable) **Authentication → Email Templates**: traduce al español los
   correos de confirmación y recuperación.

## A.2 — Anthropic / Claude (la IA)

1. Entra en **console.anthropic.com** → crea cuenta → **API Keys → Create key**.
2. Copia la clave (`sk-ant-...`) → será `ANTHROPIC_API_KEY`.
3. Añade saldo en *Billing* (con 5 € tienes para miles de mensajes: el filtro de tono usa
   el modelo barato Haiku).

## A.3 — Stripe (suscripciones)

1. Entra en **dashboard.stripe.com** → crea cuenta y actívala.
2. **Products → Add product**, crea dos:
   - `CoPadres Individual` → precio recurrente **8,99 €/mes**
   - `CoPadres Familia` → precio recurrente **14,99 €/mes**

Tienes dos formas de cobrar (la app soporta ambas; elige una):

**Opción A — Payment Links (la más sencilla, recomendada para empezar).**
En cada producto → *Create payment link*. Copia los dos enlaces y pégalos en el `.env` como
`NEXT_PUBLIC_STRIPE_LINK_INDIVIDUAL` y `NEXT_PUBLIC_STRIPE_LINK_FAMILIA`.
La página de precios los usará directamente. *(Estos son los enlaces de pago que me puedes
pasar más adelante: se pegan ahí y listo.)*

**Opción B — Checkout integrado.**
Copia el **ID del precio** (empieza por `price_...`) de cada producto → `STRIPE_PRICE_INDIVIDUAL`
y `STRIPE_PRICE_FAMILIA`. La app abrirá el pago con 14 días de prueba automáticos.

3. En ambos casos: **Developers → API keys** → copia la *Secret key* → `STRIPE_SECRET_KEY`.
4. **Developers → Webhooks → Add endpoint**:
   - URL: `https://tu-app.vercel.app/api/stripe/webhook`
   - Eventos: `checkout.session.completed`, `customer.subscription.updated`,
     `customer.subscription.deleted`
   - Copia el *Signing secret* (`whsec_...`) → `STRIPE_WEBHOOK_SECRET`.

## A.4 — Probar en tu ordenador (opcional)

Necesitas Node.js 18+ (nodejs.org). En la carpeta del proyecto:

```bash
cp .env.example .env.local    # y rellena las claves de los pasos anteriores
npm install
npm run dev
```

Abre `http://localhost:3000`. Crea una cuenta, pasa el onboarding y prueba todo.

## A.5 — Publicar en internet con Vercel

1. Sube el proyecto a **GitHub** (crea un repositorio y arrastra la carpeta, o usa `git push`).
2. Entra en **vercel.com** → *Add New → Project* → importa tu repositorio.
3. Antes de darle a *Deploy*, abre **Environment Variables** y añade TODAS las del archivo
   `.env.example` con sus valores reales.
4. *Deploy*. En un par de minutos tendrás tu URL `https://tu-app.vercel.app`.
5. Vuelve a Supabase (paso A.1.7) y a Stripe (paso A.3.4) y actualiza las URLs con tu dominio real.
6. Actualiza también `NEXT_PUBLIC_SITE_URL` en Vercel con tu URL definitiva y redespliega.

✅ **Ya está en producción.** La app es una PWA: desde el móvil, "Añadir a pantalla de inicio"
la instala como una app normal.

## A.6 — Antes de lanzar de verdad (checklist)

- [ ] Rellena los huecos [ENTRE CORCHETES] de `/legal/privacidad` (titular, NIF, email) y revisa
      los textos legales con un profesional.
- [ ] Personaliza los emails de Supabase en español.
- [ ] Pasa Stripe de modo *test* a modo *live* (claves y webhook nuevos).
- [ ] Prueba el flujo completo con dos cuentas reales (tú y otro email tuyo).

---

# PARTE B — Manual de uso de la aplicación

## B.1 — Crear cuenta y primer acceso

- **Crear usuario:** en la portada pulsa *Prueba gratis*. Puedes registrarte con tu email y una
  contraseña (recibirás un correo de confirmación) o directamente con tu **cuenta de Google**.
- **Recuperar contraseña:** en la pantalla de entrada pulsa *He olvidado mi contraseña*, escribe
  tu email y sigue el enlace del correo para crear una nueva.
- **Onboarding (2 minutos):** al entrar por primera vez la app te guía en 3 pasos:
  1. **Crea vuestro espacio** y fija el **reparto de gastos** de vuestro convenio (p. ej. 50/50 o 60/40).
  2. **Añade a tus hijos** (nombre y fecha de nacimiento).
  3. **Invita al otro progenitor**: escribe su email y la app genera un **enlace de invitación**
     que puedes mandarle por donde quieras. Cuando lo abra y cree su cuenta, quedaréis unidos
     al mismo espacio. (También puedes hacerlo más tarde desde Ajustes.)

## B.2 — Inicio

El panel de inicio te muestra: el **saldo** de gastos aprobados entre vosotros, los **próximos
eventos**, un bloque de **"Pendiente de ti"** (gastos por aprobar y solicitudes por responder)
y accesos rápidos para registrar cosas en dos toques.

## B.3 — Calendario de custodia

- **Añadir evento:** botón *+ Evento*. Elige tipo (custodia, vacaciones, médico, colegio…),
  con qué progenitor están los niños y las fechas. Los puntos del calendario indican:
  verde oscuro = contigo, verde claro = con el otro progenitor, terracota = citas.
- **Solicitar un cambio:** botón *Solicitar cambio*. Describe qué propones y, si quieres,
  fechas concretas. El otro progenitor recibe una notificación y puede **Aceptar** o **Rechazar**.
- **Todo queda auditado:** quién pidió qué, quién respondió y cuándo, con fecha y hora exactas.
  Si la solicitud aceptada llevaba fechas, **el evento se crea solo** en el calendario.

## B.4 — Gastos extraordinarios

- **Registrar gasto:** botón *+ Registrar gasto*. Pon concepto, importe, categoría y —muy
  recomendable— **foto del ticket o factura**. El % que le corresponde al otro se precarga
  según vuestro convenio, aunque puedes ajustarlo en cada gasto.
- **Aprobar o rechazar:** los gastos que registra el otro progenitor te aparecen como
  *pendientes*; revisas el comprobante y decides. Cuando te reembolsen un gasto aprobado,
  márcalo como **reembolsado**.
- El **saldo** superior te dice en todo momento quién debe cuánto a quién.

## B.5 — Mensajes (con filtro de tono IA)

- Escribís en un canal único cuyo historial es **inalterable**: nada puede editarse ni borrarse.
- Si tienes activado el **filtro de tono** (Ajustes → Inteligencia artificial), antes de enviar
  un mensaje con tono agresivo la IA te propone una **versión serena** que conserva lo que pides
  pero elimina el conflicto. Tú eliges: enviar la versión serena, tu original, o seguir editando.
- Los mensajes llegan al instante (tiempo real) y generan notificación al otro progenitor.

## B.6 — Diario del menor

Anotaciones de **salud, medicación, colegio y actividades** ("Dalsy 5 ml a las 20:00",
"reunión con la tutora el jueves"). El otro progenitor lo ve al momento y recibe notificación:
se acabó el "no me lo dijiste". Puedes filtrar por hijo y por categoría.

## B.7 — Informes (PDF para abogados y juzgados)

1. Entra en **Informes**, elige el periodo y marca las secciones (gastos, mensajes, cambios
   de custodia, diario y, si lo pide tu abogado, el registro de auditoría técnico).
2. Pulsa **Generar informe** y revisa el documento.
3. Pulsa **Descargar PDF**: se abre el diálogo de impresión del navegador → *Guardar como PDF*.
   El informe incluye portada con miembros y periodo, y la nota de que mensajes y auditoría
   son inmutables.

## B.8 — Asistente IA

Pregúntale lo que quieras en lenguaje natural: *"¿cómo está el saldo de gastos?"*, *"¿qué
intercambios hay esta semana?"*, *"ayúdame a redactar una propuesta de cambio de vacaciones"*.
Conoce (solo) los datos de **vuestro** espacio y responde con tono neutral. No es un abogado y
así te lo dirá cuando toque.

## B.9 — Notificaciones

La campana muestra todo lo que registra el otro progenitor (mensajes, gastos, cambios, diario).
Se generan **automáticamente** — el sistema está enlazado: cada acción produce su notificación
y su entrada de auditoría sin que nadie tenga que hacer nada. Desde Ajustes eliges qué tipos
quieres recibir.

## B.10 — Ajustes (panel de configuración)

- **Perfil:** tu nombre y email.
- **Espacio familiar:** nombre, **reparto de gastos** del convenio, añadir hijos e **invitar
  al otro progenitor**.
- **Notificaciones:** interruptores por tipo.
- **Inteligencia artificial:** activar/desactivar el filtro de tono.
- **Suscripción:** ver tu plan, ir a la página de precios o abrir el **portal de Stripe**
  (cambiar tarjeta, descargar facturas, cancelar).
- **Seguridad:** cambiar contraseña.
- **Privacidad y datos (RGPD):** **descargar todos tus datos** en JSON o **eliminar tu cuenta**
  (escribiendo ELIMINAR para confirmar).

## B.11 — Suscripción

14 días de prueba al registrarte. Después, **8,99 €/mes por progenitor** o **plan Familia
14,99 €/mes** que cubre a los dos. El pago es seguro vía Stripe y se cancela en un clic desde
Ajustes.

---

# Mejoras incluidas más allá del brief

- **Notificaciones y auditoría automáticas por triggers de base de datos**: aunque el día de
  mañana haya apps móviles u otros clientes, ninguna acción puede escapar del registro.
- **Solicitud aceptada → evento creado automáticamente** (sistema enlazado).
- **Saldo entre progenitores** calculado en tiempo real en Inicio y en Gastos.
- **Bloque "Pendiente de ti"** en Inicio: cero cosas olvidadas.
- **Asistente IA con contexto real** del espacio (protegido por RLS: solo ve lo vuestro).
- **Exportación RGPD en JSON** y eliminación de cuenta autoservicio.
- **Mensajes en tiempo real** (Supabase Realtime) sin recargar la página.
- **PWA instalable** con service worker y preparada para push.

# Ideas para futuras versiones (hoja de ruta sugerida)

1. **Panel para abogados** (rol "profesional" ya previsto en la base de datos): acceso de solo
   lectura a los informes de sus clientes + panel de recomendación (canal de captación del brief).
2. **Notificaciones push reales** (el service worker ya las soporta; falta servidor VAPID) y
   avisos por email con Resend.
3. **Resumen semanal automático por IA** enviado cada domingo.
4. **Plantillas de calendario** (semanas alternas, 2-2-3, fines de semana alternos) para crear
   todo el año en un clic.
5. **Recordatorios de medicación** con confirmación de toma.
6. **Adjuntos en el diario** (informes médicos, boletines de notas).
7. **Modo "documento judicial"**: informe con numeración de páginas y hash de integridad.
8. **App multi-familia** para familias reconstituidas.
