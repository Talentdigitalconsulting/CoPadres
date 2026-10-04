import type { PaginaContenido } from "./tipos";

/** Páginas de funcionalidades: una por cada problema real que resuelve CoPadres. */
export const FUNCIONALIDADES: PaginaContenido[] = [
  {
    slug: "calendario-custodia",
    titulo: "Calendario de custodia compartida con cambios auditados",
    metaTitulo: "Calendario de custodia compartida online",
    descripcion:
      "Calendario de custodia compartida para padres separados: quién está con los hijos cada día, solicitudes de cambio con fecha y hora, y plantillas 2-2-3 o semanas alternas.",
    resumen: "Quién está con los niños cada día y cada cambio pedido, aceptado o rechazado con fecha y hora.",
    entradilla:
      "Saber con quién están los niños cada día no debería depender de la memoria ni de un chat. En CoPadres el calendario es el mismo para los dos y cada cambio queda registrado.",
    secciones: [
      {
        titulo: "Un calendario, una sola versión",
        parrafos: [
          "Cada progenitor ve exactamente el mismo calendario: los días con cada uno, las vacaciones, las citas médicas, el colegio y las actividades. Se acabaron las capturas de pantalla contradictorias y los «yo tenía apuntado otra cosa».",
          "Los días de custodia se pintan con dos tonos neutros, sin colores que sugieran quién tiene razón, y cada evento muestra quién lo añadió y cuándo.",
        ],
      },
      {
        titulo: "Solicitudes de cambio con registro",
        parrafos: [
          "¿Necesitas cambiar un fin de semana por un viaje de trabajo? Envías una solicitud con las fechas propuestas y el motivo. El otro progenitor la acepta o la rechaza desde la app, y si la acepta el evento se crea solo en el calendario.",
          "Tanto la solicitud como la respuesta quedan guardadas con autor, fecha y hora, y no se pueden editar después. Es la forma más sencilla de evitar el clásico «¿cuándo acordamos eso?».",
        ],
      },
      {
        titulo: "Qué puedes registrar",
        parrafos: ["Además de los días de custodia, el calendario recoge todo lo que afecta a la organización de los hijos:"],
        lista: [
          "Periodos de custodia y fines de semana alternos.",
          "Vacaciones escolares de verano, Navidad y Semana Santa.",
          "Citas médicas, tutorías y eventos del colegio.",
          "Actividades extraescolares recurrentes, con quién lleva a cada una.",
          "Notas para el otro progenitor en cada evento.",
        ],
      },
    ],
    preguntas: [
      {
        p: "¿Puede el otro progenitor borrar o cambiar un evento sin que me entere?",
        r: "Cada cambio o borrado de un evento queda en el registro de auditoría y genera un aviso. Las solicitudes de cambio y sus respuestas son inalterables.",
      },
      {
        p: "¿Sirve si cada hijo tiene un régimen distinto?",
        r: "Sí. Cada evento puede asociarse a un hijo concreto o a todos, y el calendario se puede filtrar por hijo.",
      },
    ],
    relacionadas: ["actividades-extraescolares", "informes-para-abogados"],
  },
  {
    slug: "gastos-compartidos",
    titulo: "Gastos compartidos de los hijos con reparto automático",
    metaTitulo: "App de gastos compartidos para padres separados",
    descripcion:
      "Registra los gastos extraordinarios de tus hijos con la foto del ticket, calcula el reparto según vuestro convenio y sigue su estado: pendiente, aprobado o reembolsado.",
    resumen: "Ticket, reparto según convenio y estado claro: pendiente, aprobado, reembolsado.",
    entradilla:
      "Los gastos son una de las principales fuentes de conflicto entre padres separados. En CoPadres cada gasto tiene comprobante, reparto y un estado que ven los dos.",
    secciones: [
      {
        titulo: "Del ticket al reembolso, sin discusiones",
        parrafos: [
          "Haces una foto del ticket, indicas el importe y la categoría (médico, educación, ropa, actividades…) y CoPadres calcula automáticamente cuánto corresponde a cada uno según el porcentaje de vuestro convenio.",
          "El otro progenitor recibe un aviso y puede aprobar o rechazar el gasto. Cuando te paga su parte, lo marcas como reembolsado. Nadie puede aprobar su propio gasto ni cambiar un importe ya registrado.",
        ],
      },
      {
        titulo: "Saldo claro en todo momento",
        parrafos: [
          "La pantalla de inicio muestra el saldo de los gastos aprobados pendientes de reembolso: si te deben, si debes o si estáis en paz. Sin hojas de cálculo ni cuentas en servilletas.",
        ],
      },
      {
        titulo: "Cuotas que se repiten cada mes",
        parrafos: [
          "Judo, academia, comedor, logopeda… Las cuotas recurrentes se configuran una vez y se registran solas cada periodo. Puedes marcar meses sin cobro (por ejemplo julio y agosto), omitir una cuota concreta, pausarla o finalizarla.",
          "Si la clase se paga por sesión, CoPadres calcula la cuota del mes con las sesiones realmente dadas, descontando las canceladas.",
        ],
      },
    ],
    preguntas: [
      {
        p: "¿Qué pasa si el otro progenitor no está de acuerdo con un gasto?",
        r: "Puede rechazarlo indicando el motivo. El gasto queda registrado como rechazado, con su comprobante, por si necesitáis hablarlo con un mediador o un abogado.",
      },
      {
        p: "¿Puedo cambiar el porcentaje de reparto?",
        r: "El porcentaje del convenio se fija en Ajustes y cada cambio queda auditado y se notifica. En cada gasto puede ajustarse si ese gasto concreto se reparte de otra forma.",
      },
    ],
    relacionadas: ["actividades-extraescolares", "informes-para-abogados"],
  },
  {
    slug: "mensajes-sin-conflicto",
    titulo: "Mensajes entre padres separados con filtro de tono",
    metaTitulo: "Mensajería para padres separados con filtro de tono IA",
    descripcion:
      "Comunícate con tu ex pareja sin escalar el conflicto: un filtro de tono con IA detecta mensajes agresivos y propone una versión serena. Mensajes inalterables con fecha y hora.",
    resumen: "La IA detecta el tono agresivo y te propone una versión serena. Tú decides.",
    entradilla:
      "Un mensaje escrito en caliente puede estropear semanas de calma. El filtro de tono de CoPadres te da un segundo para pensarlo, sin bloquear nunca la comunicación.",
    secciones: [
      {
        titulo: "Cómo funciona el filtro de tono",
        parrafos: [
          "Antes de enviar, una inteligencia artificial revisa el mensaje. Si detecta insultos, reproches, sarcasmo o un tono beligerante, te propone una versión neutra que conserva lo importante: fechas, importes y peticiones.",
          "Tú eliges: enviar la versión serena, enviar tu mensaje original o seguir editando. La IA nunca envía nada por ti y, si no está disponible, el mensaje se envía tal cual.",
        ],
      },
      {
        titulo: "Un canal que deja constancia",
        parrafos: [
          "Los mensajes no se pueden editar ni borrar. Cada uno muestra autor, fecha y hora, y si se redactó con ayuda del filtro. Así los dos tenéis siempre la misma versión de lo que se dijo.",
          "Separar la coordinación de los hijos del WhatsApp personal también ayuda emocionalmente: la app es un espacio para hablar de lo necesario, no para reabrir heridas.",
        ],
      },
    ],
    preguntas: [
      {
        p: "¿La IA lee todos mis mensajes?",
        r: "Solo se analiza el texto en el momento de enviarlo, para proponer la versión serena. Puedes desactivar el filtro en Ajustes. Los textos no se usan para entrenar modelos.",
      },
      {
        p: "¿Puedo borrar un mensaje del que me arrepiento?",
        r: "No. Es una decisión de diseño: la inalterabilidad es lo que da valor al registro. Por eso el filtro te ayuda antes de enviar.",
      },
    ],
    relacionadas: ["asistente-ia", "informes-para-abogados"],
  },
  {
    slug: "diario-del-menor",
    titulo: "Diario compartido del menor: salud, medicación y colegio",
    metaTitulo: "Diario compartido de los hijos para padres separados",
    descripcion:
      "Comparte con el otro progenitor la medicación, las visitas al médico, las novedades del colegio y las actividades de vuestros hijos en un diario común y ordenado.",
    resumen: "Medicación, médico, colegio y actividades: los dos siempre con la misma información.",
    entradilla:
      "«No me dijiste que tenía que tomar el jarabe.» Con un diario compartido, la información importante sobre los niños pasa de una casa a otra sin depender de nadie.",
    secciones: [
      {
        titulo: "Toda la información en una línea de tiempo",
        parrafos: [
          "Cada anotación tiene categoría (salud, medicación, colegio, actividad), el hijo al que se refiere, quién la escribió y cuándo. Se puede filtrar por hijo o por tema.",
          "Es especialmente útil en los intercambios: quien recoge a los niños sabe al instante si están con fiebre, qué toca tomar y a qué hora, o qué dijo la tutora.",
        ],
      },
      {
        titulo: "Ficha de cada hijo",
        parrafos: [
          "Alergias, medicación habitual, pediatra, colegio, tallas… La ficha reúne los datos fijos de cada hijo para que ninguno de los dos tenga que preguntarlos.",
        ],
      },
      {
        titulo: "Datos sensibles, protegidos",
        parrafos: [
          "La información de salud de los menores es un dato especialmente protegido. Solo la ven los dos progenitores del espacio, viaja cifrada y su tratamiento se basa en vuestro consentimiento explícito.",
        ],
      },
    ],
    relacionadas: ["calendario-custodia", "mensajes-sin-conflicto"],
  },
  {
    slug: "actividades-extraescolares",
    titulo: "Agenda de actividades extraescolares con horarios recurrentes",
    metaTitulo: "Agenda de extraescolares para hijos de padres separados",
    descripcion:
      "Organiza las extraescolares de tus hijos: horarios que se repiten cada semana, quién los lleva según la custodia, sesiones canceladas y cuotas con meses sin cobro.",
    resumen: "Judo los martes y viernes, inglés los sábados… y quién los lleva según la custodia.",
    entradilla:
      "«¿Hoy tiene judo?» «¿Quién lo lleva?» Configura cada actividad una vez y CoPadres se encarga del resto, semana tras semana.",
    secciones: [
      {
        titulo: "Horarios que se repiten solos",
        parrafos: [
          "Defines los días y la hora de cada actividad (por ejemplo, clases particulares lunes, miércoles y jueves a las 17:00), la fecha de inicio y fin del curso y los meses sin actividad. La agenda semanal de cada hijo se completa automáticamente.",
          "También admite actividades cada dos semanas y horarios distintos según el día.",
        ],
      },
      {
        titulo: "Quién lleva a cada actividad",
        parrafos: [
          "CoPadres cruza la agenda con el calendario de custodia: cada sesión muestra si ese día lleva un progenitor u otro. Si algún día cambia, se ajusta solo esa sesión y el otro recibe un aviso.",
        ],
      },
      {
        titulo: "Excepciones sin rehacer nada",
        parrafos: ["Cada sesión se puede gestionar por separado:"],
        lista: [
          "Cancelarla (fiebre, festivo, viaje) con su motivo.",
          "Moverla de día u hora solo esa vez.",
          "Cambiar quién lleva al niño ese día.",
          "Editar la serie completa o solo desde una fecha.",
        ],
      },
      {
        titulo: "La cuota, vinculada",
        parrafos: [
          "Al crear la actividad puedes añadir su coste: cuota fija o por sesión, día de cobro, meses sin cobro y reparto. El otro progenitor acepta la propuesta una vez y las cuotas se registran solas cada mes.",
        ],
      },
    ],
    relacionadas: ["gastos-compartidos", "calendario-custodia"],
  },
  {
    slug: "informes-para-abogados",
    titulo: "Informes de coparentalidad para abogados y juzgados",
    metaTitulo: "Informes de coparentalidad en PDF para abogados",
    descripcion:
      "Genera en segundos un informe en PDF con gastos, cambios de custodia, diario del menor y transcripción íntegra de mensajes, con autor, fecha y hora de cada entrada.",
    resumen: "PDF con el registro íntegro del periodo que elijas, listo para tu abogado.",
    entradilla:
      "Cuando hace falta acreditar algo, reconstruirlo desde el móvil lleva horas. CoPadres genera un informe ordenado del periodo que necesites en un par de clics.",
    secciones: [
      {
        titulo: "Qué incluye el informe",
        parrafos: ["Eliges el periodo y las secciones, y obtienes un documento formal con:"],
        lista: [
          "Gastos extraordinarios con importe, reparto, estado y si tienen justificante.",
          "Solicitudes de cambio de custodia: quién pidió qué, cuándo, y quién respondió.",
          "Anotaciones del diario del menor.",
          "Transcripción completa de los mensajes con fecha y hora.",
          "Opcionalmente, el registro de auditoría técnico.",
        ],
      },
      {
        titulo: "Integridad del registro",
        parrafos: [
          "Los mensajes y el registro de auditoría no pueden modificarse ni borrarse por ninguna de las partes. Cada entrada conserva su autoría y su marca temporal.",
          "La admisibilidad y el valor probatorio los decide siempre cada tribunal, pero aportarás una documentación ordenada, completa y coherente.",
        ],
      },
    ],
    relacionadas: ["mensajes-sin-conflicto", "gastos-compartidos"],
  },
  {
    slug: "asistente-ia",
    titulo: "Asistente con inteligencia artificial para la coparentalidad",
    metaTitulo: "Asistente IA para padres separados",
    descripcion:
      "Un asistente con IA que conoce vuestro calendario, gastos y actividades: resume la situación, te ayuda a redactar mensajes serenos y responde dudas de uso.",
    resumen: "Resume la situación, te ayuda a redactar y responde dudas al momento.",
    entradilla:
      "Pregunta en lenguaje natural «¿cómo vamos de gastos este mes?» o «ayúdame a proponer un cambio de fin de semana» y obtén una respuesta basada en vuestros datos reales.",
    secciones: [
      {
        titulo: "Qué puede hacer",
        parrafos: [],
        lista: [
          "Resumir gastos pendientes, saldo y próximas cuotas.",
          "Decirte qué intercambios y actividades hay esta semana y quién lleva a los niños.",
          "Ayudarte a redactar mensajes y propuestas en un tono neutro.",
          "Explicarte cómo usar cualquier función de la app.",
        ],
      },
      {
        titulo: "Neutral por diseño",
        parrafos: [
          "El asistente nunca toma partido por ninguno de los progenitores y pone siempre el bienestar de los hijos en el centro. No es un abogado: ante cuestiones legales te orienta de forma general y te recomienda consultar con un profesional.",
          "Solo accede a los datos de tu propio espacio familiar, con las mismas reglas de seguridad que el resto de la app.",
        ],
      },
    ],
    relacionadas: ["mensajes-sin-conflicto", "calendario-custodia"],
  },
];

export const funcionalidadPorSlug = (slug: string) => FUNCIONALIDADES.find((f) => f.slug === slug);
