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
  estado: "pendiente" | "aprobado" | "rechazado" | "reembolsado";
  respondido_por: string | null;
  respondido_en: string | null;
  notas: string | null;
  creado_en: string;
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
