"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { useFamilia, nombreDe } from "@/lib/useFamilia";
import { fechaHora } from "@/lib/utils";
import { CATEGORIAS_DIARIO, type EntradaDiario } from "@/lib/tipos";
import { IconoMas } from "@/components/Iconos";

const COLORES_CATEGORIA: Record<EntradaDiario["categoria"], string> = {
  salud: "bg-vino/10 text-vino",
  medicacion: "bg-arcilla/15 text-arcilla",
  colegio: "bg-salvia-100 text-salvia-800",
  actividad: "bg-crema-300 text-carbon-claro",
  otro: "bg-crema-200 text-carbon-suave",
};

/** Diario compartido del menor: salud, medicación, colegio y actividades. */
function Diario() {
  const params = useSearchParams();
  const { cargando, usuarioId, familia, miembros, hijos } = useFamilia();
  const [entradas, setEntradas] = useState<EntradaDiario[]>([]);
  const [filtroHijo, setFiltroHijo] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(params.get("nuevo") === "1");

  // Formulario
  const [categoria, setCategoria] = useState<EntradaDiario["categoria"]>("salud");
  const [titulo, setTitulo] = useState("");
  const [contenido, setContenido] = useState("");
  const [hijoId, setHijoId] = useState("");

  const cargarEntradas = async () => {
    if (!familia) return;
    const supabase = crearClienteNavegador();
    const { data } = await supabase
      .from("diario").select("*").eq("familia_id", familia.id)
      .order("creado_en", { ascending: false }).limit(200);
    setEntradas((data as EntradaDiario[]) ?? []);
  };

  useEffect(() => {
    cargarEntradas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [familia]);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!familia || !usuarioId) return;
    const supabase = crearClienteNavegador();
    await supabase.from("diario").insert({
      familia_id: familia.id,
      categoria,
      titulo,
      contenido: contenido || null,
      hijo_id: hijoId || null,
      creado_por: usuarioId,
    });
    setTitulo(""); setContenido(""); setMostrarFormulario(false);
    cargarEntradas();
  };

  if (cargando) return <p className="text-sm text-carbon-suave">Cargando…</p>;

  const visibles = entradas.filter(
    (e) =>
      (!filtroHijo || e.hijo_id === filtroHijo) &&
      (!filtroCategoria || e.categoria === filtroCategoria)
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="titulo-seccion">Diario del menor</h1>
          <p className="text-sm text-carbon-suave mt-1">
            Salud, medicación, colegio y actividades: los dos siempre al día.
          </p>
        </div>
        <button className="boton-primario text-xs" onClick={() => setMostrarFormulario(true)}>
          <IconoMas className="w-4 h-4" /> Nueva anotación
        </button>
      </header>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {hijos.length > 1 && (
          <select className="campo max-w-44" value={filtroHijo} onChange={(e) => setFiltroHijo(e.target.value)}>
            <option value="">Todos los hijos</option>
            {hijos.map((h) => <option key={h.id} value={h.id}>{h.nombre}</option>)}
          </select>
        )}
        <select className="campo max-w-44" value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}>
          <option value="">Todas las categorías</option>
          {Object.entries(CATEGORIAS_DIARIO).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
        </select>
      </div>

      {/* Línea de tiempo */}
      {visibles.length === 0 ? (
        <div className="tarjeta text-center py-10">
          <p className="text-sm text-carbon-suave">
            Sin anotaciones todavía. Registra medicaciones, visitas médicas o novedades del cole.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibles.map((entrada) => (
            <div key={entrada.id} className="tarjeta">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`chip ${COLORES_CATEGORIA[entrada.categoria]}`}>
                  {CATEGORIAS_DIARIO[entrada.categoria]}
                </span>
                {entrada.hijo_id && (
                  <span className="chip bg-crema-200 text-carbon-suave">
                    {hijos.find((h) => h.id === entrada.hijo_id)?.nombre ?? ""}
                  </span>
                )}
                <p className="font-semibold text-sm">{entrada.titulo}</p>
              </div>
              {entrada.contenido && (
                <p className="text-sm text-carbon-claro mt-2 whitespace-pre-wrap">{entrada.contenido}</p>
              )}
              <p className="text-xs text-carbon-suave mt-2">
                {nombreDe(miembros, entrada.creado_por).split(" ")[0]} · {fechaHora(entrada.creado_en)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ---------- Formulario ---------- */}
      {mostrarFormulario && (
        <div className="fixed inset-0 bg-carbon/40 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
          onClick={() => setMostrarFormulario(false)}>
          <form onSubmit={guardar} onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-lg rounded-t-3xl md:rounded-tarjeta p-6 space-y-4 shadow-flotante">
            <h2 className="font-display text-xl">Nueva anotación</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="etiqueta">Categoría</label>
                <select className="campo" value={categoria}
                  onChange={(e) => setCategoria(e.target.value as EntradaDiario["categoria"])}>
                  {Object.entries(CATEGORIAS_DIARIO).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
                </select>
              </div>
              {hijos.length > 0 && (
                <div>
                  <label className="etiqueta">Hijo</label>
                  <select className="campo" value={hijoId} onChange={(e) => setHijoId(e.target.value)}>
                    <option value="">—</option>
                    {hijos.map((h) => <option key={h.id} value={h.id}>{h.nombre}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div>
              <label className="etiqueta">Título</label>
              <input required className="campo" value={titulo} onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ej.: Dalsy 5 ml a las 20:00 / Reunión con la tutora" />
            </div>
            <div>
              <label className="etiqueta">Detalle (opcional)</label>
              <textarea className="campo" rows={3} value={contenido}
                onChange={(e) => setContenido(e.target.value)}
                placeholder="Fiebre de 38,2º por la tarde. Si sigue mañana, llamar al pediatra." />
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" className="boton-secundario" onClick={() => setMostrarFormulario(false)}>
                Cancelar
              </button>
              <button className="boton-primario">Guardar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default function PaginaDiario() {
  return (
    <Suspense>
      <Diario />
    </Suspense>
  );
}
