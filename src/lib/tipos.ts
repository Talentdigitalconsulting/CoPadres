/** Tipos compartidos de CoPadres. */

export type Perfil = {
  id: string;
  nombre: string | null;
  email: string | null;
  avatar_url: string | null;
  notif_mensajes: boolean;
  notif_gastos: boolean;
  notif_calendario: boolean;
  notif_diario: boolean;
  filtro_tono: boolean;
};

export type Familia = {
  id: string;
  nombre: string;
  reparto_gastos: number;
  creado_por: string;
};

export type Hijo = {
  id: string;
  familia_id: string;
  nombre: string;
  fecha_nacimiento: string | null;
  notas: string | null;
};

export type EventoCustodia = {
  id: string;
  familia_id: string;
  hijo_id: string | null;
  tipo: "custodia" | "vacaciones" | "medico" | "colegio" | "actividad" | "otro";
  titulo: string;
  progenitor_id: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  notas: string | null;
  creado_por: string;
  creado_en: string;
};

export type SolicitudCambio = {
  id: string;
  familia_id: string;
  evento_id: string | null;
  descripcion: string;
  fecha_propuesta_inicio: string | null;
  fecha_propuesta_fin: string | null;
  solicitado_por: string;
  estado: "pendiente" | "aceptada" | "rechazada" | "anulada";
  respondido_por: string | null;
  respondido_en: string | null;
  motivo_respuesta: string | null;
  creado_en: string;
};

export type Gasto = {
  id: string;
  familia_id: string;
  hijo_id: string | null;
  concepto: string;
  categoria: "medico" | "educacion" | "ropa" | "actividades" | "otro";
  importe: number;
  reparto_pct: number;
  comprobante_url: string | null;
  pagado_por: string;
  estado: "pendiente" | "aprobado" | "rechazado" | "reembolsado" | "anulado";
  respondido_por: string | null;
  respondido_en: string | null;
  notas: string | null;
  creado_en: string;
  /** Si es una cuota generada por un gasto recurrente. */
  recurrente_id?: string | null;
  /** Periodo de la cuota ("AAAA-MM"). */
  periodo?: string | null;
  motivo_anulacion?: string | null;
};

export type Mensaje = {
  id: string;
  familia_id: string;
  remitente_id: string;
  texto: string;
  filtrado_ia: boolean;
  creado_en: string;
};

export type EntradaDiario = {
  id: string;
  familia_id: string;
  hijo_id: string | null;
  categoria: "salud" | "medicacion" | "colegio" | "actividad" | "otro";
  titulo: string;
  contenido: string | null;
  creado_por: string;
  creado_en: string;
};

export type Notificacion = {
  id: string;
  usuario_id: string;
  familia_id: string | null;
  tipo: string;
  titulo: string;
  cuerpo: string | null;
  enlace: string | null;
  leida: boolean;
  creado_en: string;
};

export type RegistroAuditoria = {
  id: number;
  familia_id: string;
  actor_id: string | null;
  accion: string;
  entidad: string;
  entidad_id: string | null;
  detalles: Record<string, unknown> | null;
  creado_en: string;
};

export const CATEGORIAS_GASTO: Record<Gasto["categoria"], string> = {
  medico: "Médico",
  educacion: "Educación",
  ropa: "Ropa",
  actividades: "Actividades",
  otro: "Otro",
};

export const CATEGORIAS_DIARIO: Record<EntradaDiario["categoria"], string> = {
  salud: "Salud",
  medicacion: "Medicación",
  colegio: "Colegio",
  actividad: "Actividad",
  otro: "Otro",
};

export const TIPOS_EVENTO: Record<EventoCustodia["tipo"], string> = {
  custodia: "Custodia",
  vacaciones: "Vacaciones",
  medico: "Médico",
  colegio: "Colegio",
  actividad: "Actividad",
  otro: "Otro",
};

/* ---------------- Actividades de los hijos y gastos recurrentes ---------------- */

/** Un día del horario semanal: dia 1 = lunes … 7 = domingo; horas "HH:MM". */
export type HorarioDia = { dia: number; inicio: string; fin: string };

export type Actividad = {
  id: string;
  familia_id: string;
  hijo_id: string | null;
  nombre: string;
  categoria: "deporte" | "clases" | "idiomas" | "musica" | "arte" | "terapia" | "campamento" | "otra";
  horarios: HorarioDia[];
  frecuencia: "semanal" | "quincenal";
  fecha_inicio: string;
  fecha_fin: string | null;
  meses_sin_actividad: number[];
  lugar: string | null;
  contacto: string | null;
  notas: string | null;
  /** null = según la custodia de cada día. */
  quien_lleva: string | null;
  creado_por: string;
  creado_en: string;
};

export type ExcepcionActividad = {
  id: string;
  actividad_id: string;
  familia_id: string;
  fecha: string;
  tipo: "cancelada" | "movida" | "cambio_quien_lleva";
  nueva_fecha: string | null;
  hora_inicio: string | null;
  hora_fin: string | null;
  quien_lleva: string | null;
  motivo: string | null;
  creado_por: string;
  creado_en: string;
};

export type GastoRecurrente = {
  id: string;
  familia_id: string;
  actividad_id: string | null;
  hijo_id: string | null;
  concepto: string;
  categoria: Gasto["categoria"];
  modo: "fija" | "por_sesion";
  importe: number;
  frecuencia: "mensual" | "bimestral" | "trimestral" | "anual";
  dia_cobro: number;
  meses_sin_cobro: number[];
  fecha_inicio: string;
  fecha_fin: string | null;
  pausa_desde: string | null;
  pausa_hasta: string | null;
  pagado_por: string;
  reparto_pct: number;
  estado: "propuesto" | "activo" | "rechazado" | "finalizado";
  aprobado_por: string | null;
  aprobado_en: string | null;
  motivo_respuesta: string | null;
  cambio_propuesto: CambioRecurrente | null;
  cambio_propuesto_por: string | null;
  cambio_propuesto_en: string | null;
  notas: string | null;
  creado_por: string;
  creado_en: string;
};

/** Cambios que aumentan el coste: quedan pendientes hasta que el otro los acepte. */
export type CambioRecurrente = Partial<
  Pick<GastoRecurrente, "importe" | "meses_sin_cobro" | "fecha_fin" | "reparto_pct" | "frecuencia" | "dia_cobro">
>;

export type OmisionCuota = {
  id: string;
  recurrente_id: string;
  familia_id: string;
  periodo: string;
  motivo: string | null;
  creado_por: string;
  creado_en: string;
};

export const CATEGORIAS_ACTIVIDAD: Record<Actividad["categoria"], string> = {
  deporte: "Deporte",
  clases: "Clases particulares",
  idiomas: "Idiomas",
  musica: "Música",
  arte: "Arte",
  terapia: "Terapia / logopedia",
  campamento: "Campamento",
  otra: "Otra",
};

export const FRECUENCIAS_GASTO: Record<GastoRecurrente["frecuencia"], string> = {
  mensual: "Mensual",
  bimestral: "Cada 2 meses",
  trimestral: "Trimestral",
  anual: "Anual",
};

export const ESTADOS_RECURRENTE: Record<GastoRecurrente["estado"], string> = {
  propuesto: "Propuesto",
  activo: "Activo",
  rechazado: "Rechazado",
  finalizado: "Finalizado",
};

/** Lunes = 1 … domingo = 7 (ISO). */
export const DIAS_SEMANA = [
  { dia: 1, corto: "L", nombre: "Lunes" },
  { dia: 2, corto: "M", nombre: "Martes" },
  { dia: 3, corto: "X", nombre: "Miércoles" },
  { dia: 4, corto: "J", nombre: "Jueves" },
  { dia: 5, corto: "V", nombre: "Viernes" },
  { dia: 6, corto: "S", nombre: "Sábado" },
  { dia: 7, corto: "D", nombre: "Domingo" },
];

export const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
export const MESES_LARGOS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];
