/** Estructura de las páginas de contenido (funcionalidades y guías) para SEO. */
export type Seccion = {
  titulo: string;
  parrafos: string[];
  lista?: string[];
};

export type Pregunta = { p: string; r: string };

export type PaginaContenido = {
  slug: string;
  /** H1 visible */
  titulo: string;
  /** <title> (sin el sufijo « · CoPadres») */
  metaTitulo: string;
  /** meta description (140–160 caracteres) */
  descripcion: string;
  entradilla: string;
  secciones: Seccion[];
  preguntas?: Pregunta[];
  relacionadas?: string[];
  /** Texto corto para tarjetas e índices */
  resumen: string;
};

export type Guia = PaginaContenido & {
  publicada: string; // AAAA-MM-DD
  minutos: number;
  categoria: string;
};
