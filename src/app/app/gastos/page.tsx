"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { useFamilia, nombreDe } from "@/lib/useFamilia";
import { euros, fechaCorta } from "@/lib/utils";
import { CATEGORIAS_GASTO, type Gasto } from "@/lib/tipos";
import { IconoMas, IconoRepetir } from "@/components/Iconos";
import { generarCuotas } from "@/lib/useActividades";
import HojaInferior from "@/components/HojaInferior";
import { validarComprobante } from "@/lib/seguridad";
import GastosRecurrentes, { type PrefillRecurrente } from "@/components/GastosRecurrentes";

const COLORES_ESTADO: Record<Gasto["estado"], string> = {
  pendiente: "bg-crema-200 text-carbon-claro",
  aprobado: "bg-salvia-100 text-salvia-800",
  rechazado: "bg-vino/10 text-vino",
  reembolsado: "bg-salvia-600 text-crema-50",
  anulado: "bg-white text-carbon-suave border border-carbon-linea line-through",
};

function Gastos() {
  const params = useSearchParams();
  const { cargando, usuarioId, familia, miembros, hijos, otroProgenitor } = useFamilia();
  const [vista, setVista] = useState<"puntuales" | "recurrentes">(
    params.get("vista") === "recurrentes" ? "recurrentes" : "puntuales"
  );
  const [prefill, setPrefill] = useState<PrefillRecurrente | null>(null);
  const [anulando, setAnulando] = useState<Gasto | null>(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState("");
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [filtro, setFiltro] = useState<"todos" | Gasto["estado"]>("todos");
  const [mostrarFormulario, setMostrarFormulario] = useState(
    params.get("nuevo") === "1" && params.get("vista") !== "recurrentes"
  );
  const [guardando, setGuardando] = useState(false);

  // Formulario
  const [concepto, setConcepto] = useState("");
  const [categoria, setCategoria] = useState<Gasto["categoria"]>("otro");
  const [importe, setImporte] = useState("");
  const [repartoPct, setRepartoPct] = useState<number | null>(null);
  const [hijoId, setHijoId] = useState("");
  const [notas, setNotas] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [errorArchivo, setErrorArchivo] = useState<string | null>(null);

  const cargarGastos = async () => {
    if (!familia) return;
    const supabase = crearClienteNavegador();
    const { data } = await supabase
      .from("gastos").select("*").eq("familia_id", familia.id)
      .order("creado_en", { ascending: false });
    setGastos((data as Gasto[]) ?? []);
  };

  useEffect(() => {
    // Primero se registran las cuotas recurrentes que ya toquen; luego se cargan los gastos.
    (async () => {
      if (familia) await generarCuotas(familia.id);
      cargarGastos();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [familia]);

  const anularCuota = async () => {
    if (!anulando) return;
    const supabase = crearClienteNavegador();
    await supabase.from("gastos").update({
      estado: "anulado",
      motivo_anulacion: motivoAnulacion || null,
      respondido_por: usuarioId,
      respondido_en: new Date().toISOString(),
    }).eq("id", anulando.id);
    setAnulando(null);
    setMotivoAnulacion("");
    cargarGastos();
  };

  const pasarARecurrente = () => {
    setPrefill({ concepto, importe, categoria, hijo_id: hijoId });
    setMostrarFormulario(false);
    setVista("recurrentes");
  };

  // Reparto por defecto: lo que fija el convenio de la familia.
  // Si pago yo, reclamo al otro su parte (si soy el creador de la familia, el otro paga 100 - reparto).
  const repartoPorDefecto = () => {
    if (!familia) return 50;
    return usuarioId === familia.creado_por ? 100 - familia.reparto_gastos : familia.reparto_gastos;
  };

  const guardarGasto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!familia || !usuarioId) return;
    setGuardando(true);
    const supabase = crearClienteNavegador();

    // 1) Subir el comprobante (si lo hay) al bucket privado de la familia.
    let urlComprobante: string | null = null;
    if (archivo) {
      const ruta = `${familia.id}/${Date.now()}-${archivo.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
      const { error: errorSubida } = await supabase.storage
        .from("comprobantes").upload(ruta, archivo);
      if (!errorSubida) urlComprobante = ruta;
    }

    // 2) Registrar el gasto (el trigger notifica al otro progenitor y lo audita).
    await supabase.from("gastos").insert({
      familia_id: familia.id,
      concepto,
      categoria,
      importe: Number(importe),
      reparto_pct: repartoPct ?? repartoPorDefecto(),
      hijo_id: hijoId || null,
      comprobante_url: urlComprobante,
      notas: notas || null,
      pagado_por: usuarioId,
    });

    setConcepto(""); setImporte(""); setNotas(""); setArchivo(null); setRepartoPct(null);
    setGuardando(false);
    setMostrarFormulario(false);
    cargarGastos();
  };

  const cambiarEstado = async (g: Gasto, estado: Gasto["estado"]) => {
    const supabase = crearClienteNavegador();
    await supabase.from("gastos").update({
      estado,
      respondido_por: usuarioId,
      respondido_en: new Date().toISOString(),
    }).eq("id", g.id);
    cargarGastos();
  };

  const verComprobante = async (ruta: string) => {
    const supabase = crearClienteNavegador();
    const { data } = await supabase.storage.from("comprobantes").createSignedUrl(ruta, 300);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  if (cargando) return <p className="text-sm text-carbon-suave">Cargando…</p>;

  const visibles = filtro === "todos" ? gastos : gastos.filter((g) => g.estado === filtro);
  const totalAprobado = gastos
    .filter((g) => g.estado === "aprobado")
    .reduce((s, g) => s + Number(g.importe) * (g.reparto_pct / 100) * (g.pagado_por === usuarioId ? 1 : -1), 0);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="titulo-seccion">Gastos extraordinarios</h1>
          <p className="text-sm text-carbon-suave mt-1">
            Con comprobante, reparto automático según convenio y estado de pago.
          </p>
        </div>
        {vista === "puntuales" && (
          <button className="boton-primario text-xs" onClick={() => setMostrarFormulario(true)}>
            <IconoMas className="w-4 h-4" /> Registrar gasto
          </button>
        )}
      </header>

      {/* Puntuales / Recurrentes */}
      <div className="grid grid-cols-2 gap-1 bg-crema-200/70 p-1 rounded-xl max-w-sm" role="tablist">
        {([
          ["puntuales", "Puntuales"],
          ["recurrentes", "Recurrentes"],
        ] as const).map(([v, t]) => (
          <button key={v} role="tab" aria-selected={vista === v} onClick={() => setVista(v)}
            className={`h-9 rounded-lg text-sm font-semibold transition-colors ${
              vista === v ? "bg-white shadow-tarjeta text-salvia-800" : "text-carbon-suave"
            }`}>
            {t}
          </button>
        ))}
      </div>

      {vista === "recurrentes" && familia && usuarioId && (
        <GastosRecurrentes familia={familia} usuarioId={usuarioId} miembros={miembros} hijos={hijos}
          otroProgenitor={otroProgenitor} prefill={prefill}
          abrirNuevo={params.get("nuevo") === "1" && params.get("vista") === "recurrentes"}
          onCambio={cargarGastos} />
      )}

      {vista === "puntuales" && (<>

      {/* Saldo */}
      <div className="tarjeta flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="etiqueta mb-0.5">Saldo pendiente de reembolso (gastos aprobados)</p>
          <p className={`font-display text-2xl ${totalAprobado >= 0 ? "text-salvia-700" : "text-arcilla"}`}>
            {euros(Math.abs(totalAprobado))} {totalAprobado === 0 ? "" : totalAprobado > 0 ? "a tu favor" : "a favor del otro progenitor"}
          </p>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {(["todos", "pendiente", "aprobado", "reembolsado", "rechazado", "anulado"] as const).map((f) => (
            <button key={f} onClick={() => setFiltro(f)}
              className={`chip border ${filtro === f
                ? "bg-salvia-700 text-crema-50 border-salvia-700"
                : "bg-white text-carbon-suave border-carbon-linea hover:bg-crema-100"}`}>
              {f === "todos" ? "Todos" : f}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {visibles.length === 0 ? (
        <div className="tarjeta text-center py-10">
          <p className="text-sm text-carbon-suave">
            No hay gastos {filtro !== "todos" ? `en estado "${filtro}"` : "registrados todavía"}.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibles.map((g) => {
            const esMio = g.pagado_por === usuarioId;
            const parteOtro = Number(g.importe) * (g.reparto_pct / 100);
            return (
              <div key={g.id} className="tarjeta">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">{g.concepto}</p>
                      <span className={`chip ${COLORES_ESTADO[g.estado]}`}>{g.estado}</span>
                      <span className="chip bg-crema-200 text-carbon-suave">{CATEGORIAS_GASTO[g.categoria]}</span>
                      {g.periodo && (
                        <span className="chip bg-salvia-50 text-salvia-800 border border-salvia-200">
                          <IconoRepetir className="w-3 h-3" /> Cuota
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-carbon-suave mt-1">
                      Pagó {nombreDe(miembros, g.pagado_por).split(" ")[0]} el {fechaCorta(g.creado_en.slice(0, 10))}
                      {g.hijo_id && ` · ${hijos.find((h) => h.id === g.hijo_id)?.nombre ?? ""}`}
                      {g.notas && ` · ${g.notas}`}
                    </p>
                    {g.estado === "anulado" && (
                      <p className="text-xs text-carbon-suave mt-1">
                        Anulada{g.motivo_anulacion ? `: «${g.motivo_anulacion}»` : ""} · no cuenta en el saldo.
                      </p>
                    )}
                    <p className={`text-xs text-carbon-claro mt-1 ${g.estado === "anulado" ? "line-through opacity-60" : ""}`}>
                      {esMio
                        ? `Reclamas ${euros(parteOtro)} (${g.reparto_pct} %) al otro progenitor.`
                        : `Te corresponde reembolsar ${euros(parteOtro)} (${g.reparto_pct} %).`}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-display text-xl">{euros(Number(g.importe))}</p>
                    {g.comprobante_url && (
                      <button onClick={() => verComprobante(g.comprobante_url!)}
                        className="text-xs text-salvia-700 hover:underline">
                        Ver comprobante
                      </button>
                    )}
                  </div>
                </div>
                {/* Acciones según quién eres y el estado */}
                <div className="flex gap-2 mt-3 flex-wrap">
                  {!esMio && g.estado === "pendiente" && (
                    <>
                      <button className="boton-primario text-xs" onClick={() => cambiarEstado(g, "aprobado")}>
                        Aprobar
                      </button>
                      <button className="boton-secundario text-xs" onClick={() => cambiarEstado(g, "rechazado")}>
                        Rechazar
                      </button>
                    </>
                  )}
                  {esMio && g.estado === "aprobado" && (
                    <button className="boton-suave text-xs" onClick={() => cambiarEstado(g, "reembolsado")}>
                      Marcar como reembolsado
                    </button>
                  )}
                  {esMio && g.estado === "aprobado" && g.periodo && (
                    <button className="boton-secundario text-xs" onClick={() => { setAnulando(g); setMotivoAnulacion(""); }}>
                      Anular cuota
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      </>)}

      {/* ---------- Anular una cuota recurrente ---------- */}
      <HojaInferior abierta={anulando !== null} onCerrar={() => setAnulando(null)} titulo="Anular cuota">
        {anulando && (
          <div className="space-y-3">
            <p className="text-sm text-carbon-claro">{anulando.concepto} · {euros(Number(anulando.importe))}</p>
            <p className="text-xs text-carbon-suave">
              La cuota no se borra: queda tachada en el historial de los dos y deja de contar en el saldo.
            </p>
            <label className="etiqueta">Motivo (queda registrado)</label>
            <input className="campo" value={motivoAnulacion} onChange={(e) => setMotivoAnulacion(e.target.value)}
              placeholder="Ej.: se registró por error / el club no la cobró" />
            <div className="flex gap-2 justify-end">
              <button className="boton-secundario" onClick={() => setAnulando(null)}>Volver</button>
              <button className="boton-peligro" onClick={anularCuota}>Anular cuota</button>
            </div>
          </div>
        )}
      </HojaInferior>

      {/* ---------- Formulario: nuevo gasto ---------- */}
      {mostrarFormulario && (
        <div className="fixed inset-0 bg-carbon/40 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
          onClick={() => setMostrarFormulario(false)}>
          <form onSubmit={guardarGasto} onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-lg rounded-t-3xl md:rounded-tarjeta p-6 space-y-4 shadow-flotante max-h-[90vh] overflow-y-auto">
            <h2 className="font-display text-xl">Registrar gasto</h2>
            <div>
              <label className="etiqueta">Concepto</label>
              <input required className="campo" value={concepto} onChange={(e) => setConcepto(e.target.value)}
                placeholder="Ej.: Gafas nuevas / Dentista / Campamento" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="etiqueta">Importe (€)</label>
                <input type="number" step="0.01" min="0.01" required className="campo"
                  value={importe} onChange={(e) => setImporte(e.target.value)} placeholder="120,00" />
              </div>
              <div>
                <label className="etiqueta">Categoría</label>
                <select className="campo" value={categoria}
                  onChange={(e) => setCategoria(e.target.value as Gasto["categoria"])}>
                  {Object.entries(CATEGORIAS_GASTO).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="etiqueta">
                % que corresponde al otro progenitor
                <span className="normal-case font-normal"> (según convenio: {repartoPorDefecto()} %)</span>
              </label>
              <input type="number" min={0} max={100} className="campo"
                value={repartoPct ?? repartoPorDefecto()}
                onChange={(e) => setRepartoPct(Number(e.target.value))} />
            </div>
            {hijos.length > 0 && (
              <div>
                <label className="etiqueta">Hijo (opcional)</label>
                <select className="campo" value={hijoId} onChange={(e) => setHijoId(e.target.value)}>
                  <option value="">—</option>
                  {hijos.map((h) => <option key={h.id} value={h.id}>{h.nombre}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="etiqueta">Comprobante (foto o PDF, opcional pero recomendado)</label>
              <input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf" className="campo"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  const problema = f ? validarComprobante(f) : null;
                  setErrorArchivo(problema);
                  setArchivo(problema ? null : f);
                  if (problema) e.target.value = "";
                }} />
              {errorArchivo && <p className="text-xs text-vino mt-1">{errorArchivo}</p>}
            </div>
            <div>
              <label className="etiqueta">Notas (opcional)</label>
              <textarea className="campo" rows={2} value={notas} onChange={(e) => setNotas(e.target.value)} />
            </div>
            <button type="button" onClick={pasarARecurrente}
              className="w-full flex items-center gap-2 rounded-xl border border-dashed border-salvia-400 bg-salvia-50 px-4 py-3 text-left">
              <IconoRepetir className="w-4 h-4 text-salvia-700 shrink-0" />
              <span className="text-sm">
                <span className="font-semibold text-salvia-800">¿Se repite cada mes?</span>{" "}
                <span className="text-carbon-suave">Créalo como gasto recurrente y se registrará solo.</span>
              </span>
            </button>
            <div className="flex gap-2 justify-end">
              <button type="button" className="boton-secundario" onClick={() => setMostrarFormulario(false)}>
                Cancelar
              </button>
              <button className="boton-primario" disabled={guardando}>
                {guardando ? "Guardando…" : "Registrar gasto"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default function PaginaGastos() {
  return (
    <Suspense>
      <Gastos />
    </Suspense>
  );
}
