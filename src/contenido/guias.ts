import type { Guia } from "./tipos";

/**
 * Guías prácticas para padres separados (contenido orientativo, no asesoramiento jurídico).
 */
export const GUIAS: Guia[] = [
  {
    slug: "custodia-compartida-como-organizarse",
    titulo: "Custodia compartida: cómo organizarse para que funcione",
    metaTitulo: "Custodia compartida: cómo organizarse sin conflictos",
    descripcion:
      "Claves prácticas para que la custodia compartida funcione: calendario claro, intercambios previsibles, comunicación por escrito y reglas para los gastos.",
    resumen: "Las claves prácticas para que la custodia compartida funcione en el día a día.",
    publicada: "2026-10-04",
    minutos: 6,
    categoria: "Custodia",
    entradilla:
      "La custodia compartida es hoy el régimen más habitual en muchos juzgados españoles. Que funcione no depende solo de la sentencia o del convenio: depende sobre todo de la organización diaria entre los dos progenitores.",
    secciones: [
      {
        titulo: "1. Un calendario que no admita dudas",
        parrafos: [
          "El primer foco de conflicto suele ser el calendario: qué semana toca, quién recoge el viernes, qué pasa con los puentes. Tenerlo por escrito, en un único sitio que ven los dos, elimina la mayoría de discusiones.",
          "Conviene fijar desde el principio el patrón (semanas alternas, 2-2-3, etc.), el día y la hora de los intercambios y cómo se reparten las vacaciones escolares. En la guía de modelos de calendario explicamos las ventajas de cada uno.",
        ],
      },
      {
        titulo: "2. Intercambios previsibles",
        parrafos: [
          "Los cambios de casa son el momento más sensible para los niños. Ayuda que sean siempre a la misma hora y, si es posible, en un lugar neutro como la salida del colegio, que evita encuentros tensos entre adultos.",
          "Antes de cada intercambio, comparte lo esencial: medicación, deberes pendientes, si han dormido mal o si hay algo que deban llevar.",
        ],
      },
      {
        titulo: "3. Cambios con antelación y por escrito",
        parrafos: [
          "Siempre surgirán imprevistos: un viaje de trabajo, una boda, una enfermedad. La regla de oro es pedir el cambio con la máxima antelación posible, proponer una compensación y dejarlo por escrito.",
          "Un registro de solicitudes con su respuesta evita que meses después nadie recuerde qué se acordó.",
        ],
      },
      {
        titulo: "4. Reglas claras para el dinero",
        parrafos: [
          "En custodia compartida cada progenitor suele asumir los gastos ordinarios mientras los hijos están con él, y es frecuente que exista una cuenta común o una pensión para compensar diferencias de ingresos. Los gastos extraordinarios se reparten según el convenio, habitualmente al 50 %.",
          "Lo que más conflicto genera no es el importe sino la falta de claridad: registrar cada gasto con su ticket y que el otro lo apruebe antes de pagarlo, cuando no es urgente, evita muchos problemas.",
        ],
      },
      {
        titulo: "5. Separar la coordinación de lo personal",
        parrafos: [
          "Hablar de los hijos por el mismo canal en el que antes discutíais como pareja facilita que se mezclen los temas. Un canal específico, centrado en lo práctico y con un tono cuidado, ayuda a mantener la relación en el terreno de la coparentalidad.",
        ],
        lista: [
          "Mensajes breves, concretos y con fecha.",
          "Una petición por mensaje.",
          "Sin reproches del pasado ni valoraciones personales.",
          "Respuesta en un plazo razonable, aunque sea para decir «lo miro y te digo».",
        ],
      },
      {
        titulo: "Cuándo pedir ayuda profesional",
        parrafos: [
          "Si los desacuerdos se repiten, la mediación familiar puede ayudar a encontrar acuerdos sin llegar al juzgado. Ante dudas sobre lo que dice vuestro convenio o sentencia, consulta con un abogado de familia.",
        ],
      },
    ],
    preguntas: [
      {
        p: "¿La custodia compartida implica que no haya pensión de alimentos?",
        r: "No necesariamente. Depende de los ingresos de cada progenitor y de lo que establezca el convenio o la sentencia. Consulta tu caso con un abogado.",
      },
    ],
    relacionadas: ["modelos-calendario-custodia", "gastos-ordinarios-y-extraordinarios-hijos"],
  },
  {
    slug: "modelos-calendario-custodia",
    titulo: "Modelos de calendario de custodia: semanas alternas, 2-2-3 y más",
    metaTitulo: "Modelos de calendario de custodia compartida (2-2-3, semanas alternas)",
    descripcion:
      "Comparamos los calendarios de custodia más habituales: semanas alternas, 2-2-3, 2-2-5-5, 3-4-4-3 y fines de semana alternos. Ventajas, inconvenientes y para qué edades encajan.",
    resumen: "Semanas alternas, 2-2-3, 2-2-5-5… ventajas e inconvenientes de cada modelo.",
    publicada: "2026-10-04",
    minutos: 7,
    categoria: "Custodia",
    entradilla:
      "No existe un calendario perfecto: el mejor es el que se adapta a la edad de los hijos, a la distancia entre las casas y a los horarios de los padres. Estos son los modelos más utilizados.",
    secciones: [
      {
        titulo: "Semanas alternas (7-7)",
        parrafos: [
          "Los hijos pasan una semana completa con cada progenitor. El intercambio suele hacerse el viernes o el lunes a la salida del colegio.",
          "Ventajas: pocos intercambios y rutinas estables. Inconvenientes: siete días sin ver a uno de los progenitores puede ser mucho para niños pequeños; a veces se compensa con una tarde a mitad de semana.",
        ],
      },
      {
        titulo: "2-2-3",
        parrafos: [
          "Dos días con un progenitor, dos con el otro y tres (el fin de semana) con el primero; la semana siguiente se invierte. Así nadie pasa más de tres días sin ver a los niños.",
          "Es muy utilizado con hijos pequeños, aunque implica muchos intercambios y exige que las casas estén cerca.",
        ],
      },
      {
        titulo: "2-2-5-5",
        parrafos: [
          "Cada progenitor tiene siempre los mismos dos días entre semana (por ejemplo, uno lunes y martes y el otro miércoles y jueves) y los fines de semana largos se alternan. Combina estabilidad semanal con contacto frecuente.",
        ],
      },
      {
        titulo: "3-4-4-3",
        parrafos: [
          "Tres días con uno y cuatro con el otro, invirtiéndose la semana siguiente. Reparte el tiempo al 50 % en dos semanas y reduce los intercambios respecto al 2-2-3.",
        ],
      },
      {
        titulo: "Fines de semana alternos con tardes intersemanales",
        parrafos: [
          "Es el régimen típico cuando la custodia es de un solo progenitor: el otro tiene fines de semana alternos y una o dos tardes entre semana, además de la mitad de las vacaciones.",
        ],
      },
      {
        titulo: "Cómo elegir",
        parrafos: ["Algunas preguntas que ayudan a decidir:"],
        lista: [
          "¿Qué edad tienen los hijos? Los más pequeños suelen necesitar contacto más frecuente.",
          "¿A qué distancia están las casas y el colegio?",
          "¿Qué horarios de trabajo tiene cada progenitor?",
          "¿Cómo encajan las actividades extraescolares en cada modelo?",
        ],
      },
    ],
    relacionadas: ["custodia-compartida-como-organizarse", "vacaciones-escolares-y-custodia"],
  },
  {
    slug: "gastos-ordinarios-y-extraordinarios-hijos",
    titulo: "Gastos ordinarios y extraordinarios de los hijos: quién paga qué",
    metaTitulo: "Gastos extraordinarios de los hijos: qué son y quién los paga",
    descripcion:
      "Diferencia entre gastos ordinarios y extraordinarios de los hijos tras una separación, ejemplos habituales, cómo se reparten y por qué conviene pedir conformidad antes de pagar.",
    resumen: "Qué entra en la pensión, qué es extraordinario y cómo evitar conflictos al repartirlo.",
    publicada: "2026-10-04",
    minutos: 7,
    categoria: "Gastos",
    entradilla:
      "«Eso no lo pago yo, ya está incluido en la pensión.» Distinguir entre gastos ordinarios y extraordinarios es una de las dudas más frecuentes tras una separación. Te explicamos los criterios generales.",
    secciones: [
      {
        titulo: "Gastos ordinarios",
        parrafos: [
          "Son los gastos previsibles y periódicos que cubren las necesidades habituales de los hijos: alimentación, vivienda, ropa, suministros, transporte habitual y educación ordinaria. Se cubren con la pensión de alimentos o, en custodia compartida, según lo que establezca el convenio.",
          "Los tribunales han considerado en general ordinarios los gastos de inicio de curso escolar, como libros o matrícula, precisamente porque se pueden prever cada año.",
        ],
      },
      {
        titulo: "Gastos extraordinarios",
        parrafos: [
          "Son gastos imprevisibles o que no se producen de forma periódica. Se suelen distinguir dos tipos:",
        ],
        lista: [
          "Necesarios: por ejemplo, tratamientos médicos o dentales no cubiertos por la sanidad pública (ortodoncia, gafas, logopedia, psicología). Normalmente deben pagarse aunque el otro progenitor no esté de acuerdo, por su carácter imprescindible.",
          "No necesarios o voluntarios: actividades extraescolares, campamentos, viajes de estudios, clases particulares. Lo habitual es que requieran el acuerdo previo de ambos progenitores para que se compartan.",
        ],
      },
      {
        titulo: "¿Cómo se reparten?",
        parrafos: [
          "Lo determina el convenio regulador o la sentencia. Con frecuencia se reparten al 50 %, aunque puede fijarse otro porcentaje en función de los ingresos de cada uno. Revisa lo que dice el tuyo: es la referencia que aplicará un juzgado si hay discrepancias.",
        ],
      },
      {
        titulo: "Buenas prácticas para evitar conflictos",
        parrafos: [],
        lista: [
          "Pide conformidad por escrito antes de un gasto no urgente, con el presupuesto.",
          "Guarda siempre el ticket o la factura.",
          "Registra el gasto cuanto antes y deja claro qué porcentaje reclamas.",
          "Para cuotas que se repiten (extraescolares, comedor), acordad una vez el importe y los meses que se pagan.",
          "Lleva un registro de lo aprobado y lo reembolsado para conocer el saldo real.",
        ],
      },
      {
        titulo: "Aviso importante",
        parrafos: [
          "Esta guía ofrece criterios generales. La clasificación de un gasto concreto puede depender de vuestro convenio, de la sentencia y de las circunstancias del caso. Ante una discrepancia, consulta con un abogado de familia.",
        ],
      },
    ],
    preguntas: [
      {
        p: "¿Las extraescolares son gasto ordinario o extraordinario?",
        r: "Depende del convenio. Con frecuencia se consideran extraordinarias no necesarias y requieren el acuerdo de ambos, salvo que ya se realizaran antes de la separación o el convenio diga otra cosa.",
      },
      {
        p: "¿Puedo reclamar un gasto que el otro progenitor no aprobó?",
        r: "Si se trata de un gasto necesario, normalmente sí. Si es voluntario y no hubo acuerdo, es más discutible. Conservar la petición de conformidad y la respuesta ayuda mucho.",
      },
    ],
    relacionadas: ["convenio-regulador-que-debe-incluir", "custodia-compartida-como-organizarse"],
  },
  {
    slug: "comunicacion-con-tu-ex-pareja",
    titulo: "Cómo comunicarte con tu ex pareja por los hijos sin discutir",
    metaTitulo: "Cómo hablar con tu ex por los hijos sin discutir",
    descripcion:
      "Técnicas sencillas para comunicarte con el otro progenitor sin conflicto: el método BIFF, mensajes breves y neutrales, y qué hacer cuando recibes un mensaje agresivo.",
    resumen: "El método BIFF y otras técnicas para mensajes breves, neutrales y eficaces.",
    publicada: "2026-10-04",
    minutos: 6,
    categoria: "Comunicación",
    entradilla:
      "La forma en que os comunicáis afecta directamente a vuestros hijos. Unas pocas pautas pueden convertir los mensajes en algo práctico en lugar de un campo de batalla.",
    secciones: [
      {
        titulo: "El método BIFF",
        parrafos: [
          "Propuesto por el mediador Bill Eddy para comunicaciones en situaciones de alto conflicto, BIFF resume cómo debería ser un mensaje:",
        ],
        lista: [
          "Breve: un párrafo corto, sin explicaciones de más.",
          "Informativo: hechos, fechas y propuestas concretas.",
          "Amable (Friendly): un saludo y un cierre cordiales bastan.",
          "Firme: deja claro lo que propones y cuándo necesitas respuesta.",
        ],
      },
      {
        titulo: "Un ejemplo",
        parrafos: [
          "En lugar de: «Siempre igual, nunca avisas. Como vuelvas a llegar tarde el viernes, se acabó.»",
          "Prueba: «Hola. Te pido que el viernes seamos puntuales a las 17:00, porque a los niños les afecta esperar. Si vas a retrasarte, avísame con antelación, por favor. Gracias.»",
          "El contenido es el mismo; la probabilidad de que acabe en discusión, muy distinta.",
        ],
      },
      {
        titulo: "Cuando recibes un mensaje agresivo",
        parrafos: [],
        lista: [
          "No respondas en caliente: espera unas horas si no es urgente.",
          "Responde solo a la parte práctica e ignora las provocaciones.",
          "No justifiques ni discutas el pasado.",
          "Si la situación se repite, valora la mediación familiar.",
        ],
      },
      {
        titulo: "Por escrito y en un canal específico",
        parrafos: [
          "Usar un canal dedicado solo a la coordinación de los hijos, donde los mensajes no se borran, anima a cuidar el tono y deja constancia de los acuerdos. Herramientas como un filtro de tono te dan un segundo para releer antes de enviar.",
        ],
      },
    ],
    relacionadas: ["custodia-compartida-como-organizarse", "vacaciones-escolares-y-custodia"],
  },
  {
    slug: "vacaciones-escolares-y-custodia",
    titulo: "Vacaciones escolares y custodia: cómo repartirlas",
    metaTitulo: "Cómo repartir las vacaciones escolares en la custodia",
    descripcion:
      "Formas habituales de repartir verano, Navidad y Semana Santa entre padres separados, años pares e impares, y cómo planificarlo con tiempo para evitar conflictos.",
    resumen: "Verano, Navidad y Semana Santa: formas habituales de repartirlas y cómo planificarlas.",
    publicada: "2026-10-04",
    minutos: 5,
    categoria: "Custodia",
    entradilla:
      "Las vacaciones suspenden el régimen habitual de custodia y suelen repartirse por mitades. Planificarlas con tiempo es la mejor forma de evitar tensiones.",
    secciones: [
      {
        titulo: "Verano",
        parrafos: [
          "Lo más habitual es dividir julio y agosto por quincenas o por meses completos, alternando cada año quién elige primero. Con hijos pequeños se prefieren periodos más cortos.",
          "Ten en cuenta las actividades de verano (campamentos, cursos) y su coste: si no estaban previstas, conviene acordarlas por escrito antes de inscribir a los niños.",
        ],
      },
      {
        titulo: "Navidad",
        parrafos: [
          "Se suele dividir en dos mitades, una que incluye Nochebuena y Navidad y otra con Nochevieja y Año Nuevo, alternándose cada año. Algunas familias separan el día de Reyes para que ambos lo compartan con los niños.",
        ],
      },
      {
        titulo: "Semana Santa",
        parrafos: [
          "Lo habitual es repartirla por mitades o alternarla completa por años: los pares con un progenitor y los impares con el otro.",
        ],
      },
      {
        titulo: "Consejos para planificar",
        parrafos: [],
        lista: [
          "Acordad las fechas con varios meses de antelación y dejadlas en el calendario compartido.",
          "Usad la regla de años pares e impares para que nadie tenga que negociar cada año.",
          "Avisad con tiempo de viajes, sobre todo al extranjero, y facilitad los datos de contacto.",
          "Recordad que las extraescolares y sus cuotas suelen detenerse en verano.",
        ],
      },
    ],
    relacionadas: ["modelos-calendario-custodia", "comunicacion-con-tu-ex-pareja"],
  },
  {
    slug: "convenio-regulador-que-debe-incluir",
    titulo: "Convenio regulador: qué debe incluir sobre los hijos",
    metaTitulo: "Convenio regulador: qué debe incluir sobre los hijos",
    descripcion:
      "Qué aspectos de los hijos regula el convenio regulador en España: custodia, régimen de estancias, vivienda, pensión de alimentos y gastos extraordinarios.",
    resumen: "Custodia, estancias, vivienda, alimentos y gastos: lo que recoge el convenio.",
    publicada: "2026-10-04",
    minutos: 6,
    categoria: "Legal",
    entradilla:
      "El convenio regulador es el documento en el que los progenitores acuerdan las consecuencias de la separación o el divorcio. Cuando hay hijos, es la referencia para la organización de los años siguientes.",
    secciones: [
      {
        titulo: "Qué es y quién lo aprueba",
        parrafos: [
          "Lo regula el artículo 90 del Código Civil. Lo redactan los cónyuges (o los progenitores, si no estaban casados, en el procedimiento correspondiente), normalmente con ayuda de sus abogados, y lo aprueba el juez tras oír al Ministerio Fiscal cuando hay hijos menores, para comprobar que no perjudica a estos.",
        ],
      },
      {
        titulo: "Aspectos relativos a los hijos",
        parrafos: ["Entre otros puntos, el convenio debe recoger:"],
        lista: [
          "El ejercicio de la patria potestad, que normalmente sigue siendo compartida.",
          "El régimen de guarda y custodia: compartida o a favor de uno de los progenitores.",
          "El régimen de estancias, comunicación y visitas, incluidas las vacaciones.",
          "El uso de la vivienda familiar.",
          "La contribución a las cargas y alimentos: pensión, forma de pago y actualización.",
          "El reparto de los gastos extraordinarios.",
        ],
      },
      {
        titulo: "Detalles que evitan conflictos después",
        parrafos: ["Cuanto más concreto sea el convenio, menos margen habrá para malentendidos:"],
        lista: [
          "Horas y lugar de los intercambios.",
          "Qué se considera gasto extraordinario y si requiere consentimiento previo.",
          "Cómo se acuerdan las extraescolares y quién las paga.",
          "Plazo de antelación para pedir cambios de calendario.",
          "Canal de comunicación entre los progenitores.",
        ],
      },
      {
        titulo: "¿Se puede modificar?",
        parrafos: [
          "Sí, cuando cambian sustancialmente las circunstancias (por ejemplo, un cambio de residencia o de ingresos), mediante un nuevo acuerdo aprobado judicialmente o un procedimiento de modificación de medidas.",
          "Esta guía es informativa. Para redactar o modificar un convenio, cuenta siempre con un abogado de familia.",
        ],
      },
    ],
    relacionadas: ["gastos-ordinarios-y-extraordinarios-hijos", "custodia-compartida-como-organizarse"],
  },
];

export const guiaPorSlug = (slug: string) => GUIAS.find((g) => g.slug === slug);
