import Link from "next/link";
import Logo from "@/components/Logo";
import {
  IconoCalendario, IconoGastos, IconoMensajes, IconoDiario, IconoInformes, IconoAsistente,
} from "@/components/Iconos";

const FUNCIONALIDADES = [
  {
    Icono: IconoCalendario,
    titulo: "Calendario de custodia auditado",
    texto: "Cada cambio queda registrado: quién lo pidió, quién lo aceptó y cuándo. Con fecha y hora.",
  },
  {
    Icono: IconoGastos,
    titulo: "Gastos con comprobante",
    texto: "Sube el ticket, el reparto se calcula según vuestro convenio y el estado de pago queda claro.",
  },
  {
    Icono: IconoMensajes,
    titulo: "Mensajes con filtro de tono",
    texto: "La IA detecta el tono agresivo antes de enviar y te propone una versión serena. Tú decides.",
  },
  {
    Icono: IconoDiario,
    titulo: "Diario compartido del menor",
    texto: "Salud, medicación, colegio y actividades. Los dos siempre con la misma información.",
  },
  {
    Icono: IconoInformes,
    titulo: "Informes para tu abogado",
    texto: "Exporta en PDF el registro íntegro e inalterable del periodo que necesites. Listo para el juzgado.",
  },
  {
    Icono: IconoAsistente,
    titulo: "Asistente inteligente",
    texto: "Resume la situación, te ayuda a redactar propuestas serenas y responde tus dudas al momento.",
  },
];

const PREGUNTAS = [
  {
    p: "¿Los mensajes se pueden borrar o editar?",
    r: "No. Los mensajes y el registro de actividad son inmutables por diseño: nadie puede alterarlos. Por eso el registro tiene integridad frente a abogados, mediadores y juzgados.",
  },
  {
    p: "¿El otro progenitor tiene que pagar también?",
    r: "Con el plan Familia (14,99 €/mes) quedáis cubiertos los dos con un único pago. También hay plan Individual de 8,99 €/mes por progenitor.",
  },
  {
    p: "¿Quién puede ver nuestros datos?",
    r: "Solo los miembros de vuestro espacio familiar. Cada dato está aislado con seguridad a nivel de fila y viaja cifrado. Cumplimos el RGPD y puedes exportar o eliminar tus datos cuando quieras.",
  },
  {
    p: "¿Sirve como prueba en un juicio?",
    r: "CoPadres genera informes con el registro íntegro, con autoría, fecha y hora de cada entrada. La admisibilidad concreta la decide siempre cada tribunal, pero aportarás documentación ordenada e inalterada.",
  },
];

/** Landing page pública de venta. */
export default function PaginaInicio() {
  return (
    <main className="bg-crema-100 text-carbon">
      {/* ---------- Cabecera ---------- */}
      <header className="max-w-5xl mx-auto px-4 py-5 flex items-center justify-between">
        <Logo />
        <nav className="flex items-center gap-4">
          <Link href="/precios" className="text-sm text-carbon-suave hover:text-carbon hidden sm:block">
            Precios
          </Link>
          <Link href="/login" className="text-sm text-carbon-suave hover:text-carbon">Entrar</Link>
          <Link href="/registro" className="boton-primario text-xs">Prueba gratis</Link>
        </nav>
      </header>

      {/* ---------- Héroe ---------- */}
      <section className="max-w-5xl mx-auto px-4 pt-14 pb-20 text-center">
        <p className="chip bg-salvia-100 text-salvia-800 mb-5">Para padres y madres separados</p>
        <h1 className="font-display text-4xl md:text-6xl leading-tight max-w-3xl mx-auto">
          Coordinaos por vuestros hijos, <em className="text-salvia-700 not-italic">sin discutir</em>
        </h1>
        <p className="text-carbon-suave mt-5 max-w-xl mx-auto md:text-lg">
          Calendario de custodia, gastos, mensajes y diario del menor en un espacio neutral donde
          todo queda documentado. Menos conflicto hoy; pruebas ordenadas si algún día las necesitas.
        </p>
        <div className="flex gap-3 justify-center mt-8 flex-wrap">
          <Link href="/registro" className="boton-primario">Empezar 14 días gratis</Link>
          <Link href="/precios" className="boton-secundario">Ver precios</Link>
        </div>
        <p className="text-xs text-carbon-suave mt-4">Sin tarjeta · Cancela cuando quieras · Interfaz 100 % en español</p>
      </section>

      {/* ---------- El problema ---------- */}
      <section className="bg-salvia-900 text-crema-100 py-16">
        <div className="max-w-5xl mx-auto px-4 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="font-display text-3xl leading-snug">
              WhatsApp no fue diseñado para coordinar una custodia
            </h2>
            <p className="text-salvia-200 mt-4 leading-relaxed text-sm md:text-base">
              Capturas de pantalla perdidas, discusiones que se enquistan, gastos que nadie recuerda
              haber aprobado. Y cuando llega el momento de acreditar algo ante tu abogado o el juzgado,
              toca reconstruirlo todo. En España hay unos 100.000 divorcios al año, la mitad con hijos:
              esta fricción tiene arreglo.
            </p>
          </div>
          <ul className="space-y-3 text-sm">
            {[
              "«¿Cuándo acordamos ese cambio de fin de semana?»",
              "«Yo nunca aprobé ese gasto.»",
              "«No me dijiste que tenía que tomar la medicación.»",
              "«Eso me lo dijiste por WhatsApp, ya no lo encuentro.»",
            ].map((t) => (
              <li key={t} className="bg-salvia-800 rounded-xl px-4 py-3 text-salvia-100">{t}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- Funcionalidades ---------- */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <h2 className="font-display text-3xl text-center mb-3">Todo lo que necesitáis, en paz</h2>
        <p className="text-center text-carbon-suave text-sm mb-12 max-w-lg mx-auto">
          Diseñada para reducir el conflicto: sobria, clara y con registro de todo.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FUNCIONALIDADES.map(({ Icono, titulo, texto }) => (
            <div key={titulo} className="tarjeta">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-salvia-100 text-salvia-700 mb-3">
                <Icono />
              </span>
              <h3 className="font-semibold text-sm">{titulo}</h3>
              <p className="text-sm text-carbon-suave mt-1.5 leading-relaxed">{texto}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Para abogados ---------- */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <div className="tarjeta md:p-10 bg-crema-50 md:flex items-center gap-8">
          <div className="flex-1">
            <p className="chip bg-arcilla/15 text-arcilla mb-3">Para abogados y mediadores</p>
            <h2 className="font-display text-2xl md:text-3xl">
              Recomiéndala a tus clientes: menos emails, mejores pruebas
            </h2>
            <p className="text-sm text-carbon-suave mt-3 leading-relaxed">
              Tus clientes llegan a la reunión con el informe completo: gastos justificados, transcripción
              íntegra de mensajes inalterables y el historial de cambios de custodia con fecha y hora.
              En EE. UU. los jueces ya recomiendan este tipo de apps; CoPadres es la respuesta en español.
            </p>
          </div>
          <Link href="/registro" className="boton-primario mt-5 md:mt-0 shrink-0">Probar CoPadres</Link>
        </div>
      </section>

      {/* ---------- Preguntas frecuentes ---------- */}
      <section className="max-w-3xl mx-auto px-4 pb-20">
        <h2 className="font-display text-3xl text-center mb-10">Preguntas frecuentes</h2>
        <div className="space-y-3">
          {PREGUNTAS.map(({ p, r }) => (
            <details key={p} className="tarjeta group">
              <summary className="font-semibold text-sm cursor-pointer list-none flex justify-between items-center">
                {p}
                <span className="text-salvia-600 group-open:rotate-45 transition-transform text-lg leading-none">+</span>
              </summary>
              <p className="text-sm text-carbon-suave mt-3 leading-relaxed">{r}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ---------- Llamada final ---------- */}
      <section className="bg-salvia-700 text-crema-50 py-16 text-center px-4">
        <h2 className="font-display text-3xl md:text-4xl max-w-xl mx-auto leading-snug">
          Lo mejor para vuestros hijos es que estéis coordinados
        </h2>
        <Link href="/registro" className="boton bg-crema-50 text-salvia-800 hover:bg-white mt-7 inline-flex">
          Crear cuenta gratis
        </Link>
        <p className="text-xs text-salvia-200 mt-4">14 días de prueba · 8,99 €/mes después · Sin permanencia</p>
      </section>

      {/* ---------- Pie ---------- */}
      <footer className="bg-carbon text-crema-200 py-10">
        <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <Logo claro />
          <nav className="flex gap-5">
            <Link href="/legal/privacidad" className="hover:text-white">Privacidad</Link>
            <Link href="/legal/terminos" className="hover:text-white">Términos</Link>
            <Link href="/legal/cookies" className="hover:text-white">Cookies</Link>
            <Link href="/precios" className="hover:text-white">Precios</Link>
          </nav>
          <p>© {new Date().getFullYear()} CoPadres</p>
        </div>
      </footer>
    </main>
  );
}
