/** Aviso que se muestra si aún no se ha aplicado la migración 002 en Supabase. */
export default function AvisoMigracion() {
  return (
    <div className="tarjeta bg-crema-200/70 border-arcilla/30 space-y-1.5">
      <p className="text-sm font-semibold">Falta activar esta función en la base de datos</p>
      <p className="text-sm text-carbon-claro leading-relaxed">
        Ejecuta una vez el archivo <code className="text-xs bg-white px-1.5 py-0.5 rounded-sm">supabase/migracion_002_actividades_y_gastos_recurrentes.sql</code>{" "}
        en Supabase → SQL Editor. El resto de la app sigue funcionando con normalidad.
      </p>
    </div>
  );
}
