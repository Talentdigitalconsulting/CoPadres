-- ============================================================================
-- CoPadres — Migración 002: agenda de actividades de los hijos
--                           y gastos recurrentes (cuotas)
--
-- Cómo aplicarla (una sola vez, en un proyecto que ya tenga schema.sql):
--   Supabase > SQL Editor > New query > pega este archivo entero > Run
-- Es segura de repetir: usa "if not exists" / "or replace" / "drop ... if exists".
-- (Las instalaciones nuevas no la necesitan: ya está incluida al final de schema.sql)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 15. ACTIVIDADES DE LOS HIJOS (horario semanal recurrente)
-- ----------------------------------------------------------------------------
create table if not exists public.actividades (
  id uuid primary key default gen_random_uuid(),
  familia_id uuid not null references public.familias on delete cascade,
  hijo_id uuid references public.hijos on delete cascade,
  nombre text not null,
  categoria text not null default 'otra'
    check (categoria in ('deporte', 'clases', 'idiomas', 'musica', 'arte', 'terapia', 'campamento', 'otra')),
  -- Horario semanal: [{"dia": 1..7 (1 = lunes), "inicio": "17:00", "fin": "18:00"}, ...]
  horarios jsonb not null default '[]'::jsonb,
  frecuencia text not null default 'semanal' check (frecuencia in ('semanal', 'quincenal')),
  fecha_inicio date not null default current_date,
  fecha_fin date,
  -- Meses (1-12) en los que no hay actividad, p. ej. {7,8} para julio y agosto
  meses_sin_actividad int[] not null default '{}',
  lugar text,
  contacto text,
  notas text,
  -- Quién lleva/recoge: null = según la custodia de cada día; si no, un progenitor fijo
  quien_lleva uuid references auth.users,
  creado_por uuid not null references auth.users default auth.uid(),
  creado_en timestamptz not null default now(),
  check (fecha_fin is null or fecha_fin >= fecha_inicio)
);

-- Excepciones de una sesión concreta: cancelada, movida o cambio de quién lleva.
create table if not exists public.actividad_excepciones (
  id uuid primary key default gen_random_uuid(),
  actividad_id uuid not null references public.actividades on delete cascade,
  familia_id uuid not null references public.familias on delete cascade,
  fecha date not null,
  tipo text not null check (tipo in ('cancelada', 'movida', 'cambio_quien_lleva')),
  nueva_fecha date,
  hora_inicio text,
  hora_fin text,
  quien_lleva uuid references auth.users,
  motivo text,
  creado_por uuid not null references auth.users default auth.uid(),
  creado_en timestamptz not null default now(),
  unique (actividad_id, fecha)
);

-- ----------------------------------------------------------------------------
-- 16. GASTOS RECURRENTES (plantillas que generan una cuota cada periodo)
-- ----------------------------------------------------------------------------
create table if not exists public.gastos_recurrentes (
  id uuid primary key default gen_random_uuid(),
  familia_id uuid not null references public.familias on delete cascade,
  actividad_id uuid references public.actividades on delete set null,
  hijo_id uuid references public.hijos on delete set null,
  concepto text not null,
  categoria text not null default 'actividades'
    check (categoria in ('medico', 'educacion', 'ropa', 'actividades', 'otro')),
  -- fija: importe por periodo · por_sesion: importe por sesión dada (se liquida a mes vencido)
  modo text not null default 'fija' check (modo in ('fija', 'por_sesion')),
  importe numeric(10,2) not null check (importe > 0),
  frecuencia text not null default 'mensual'
    check (frecuencia in ('mensual', 'bimestral', 'trimestral', 'anual')),
  dia_cobro int not null default 1 check (dia_cobro between 1 and 31),
  -- Meses (1-12) en los que NO se cobra, p. ej. {7,8}
  meses_sin_cobro int[] not null default '{}',
  fecha_inicio date not null default current_date,
  fecha_fin date,
  pausa_desde date,
  pausa_hasta date,
  -- Quién paga al proveedor y qué % reclama al otro progenitor
  pagado_por uuid not null references auth.users default auth.uid(),
  reparto_pct int not null default 50 check (reparto_pct between 0 and 100),
  estado text not null default 'propuesto'
    check (estado in ('propuesto', 'activo', 'rechazado', 'finalizado')),
  aprobado_por uuid references auth.users,
  aprobado_en timestamptz,
  motivo_respuesta text,
  -- Cambios que aumentan el coste quedan aquí hasta que el otro los acepte
  cambio_propuesto jsonb,
  cambio_propuesto_por uuid references auth.users,
  cambio_propuesto_en timestamptz,
  notas text,
  creado_por uuid not null references auth.users default auth.uid(),
  creado_en timestamptz not null default now(),
  check (fecha_fin is null or fecha_fin >= fecha_inicio)
);

-- Cuotas concretas que no se pagan (p. ej. "diciembre no se paga por lesión").
create table if not exists public.gastos_recurrentes_omisiones (
  id uuid primary key default gen_random_uuid(),
  recurrente_id uuid not null references public.gastos_recurrentes on delete cascade,
  familia_id uuid not null references public.familias on delete cascade,
  periodo text not null check (periodo ~ '^\d{4}-\d{2}$'),
  motivo text,
  creado_por uuid not null references auth.users default auth.uid(),
  creado_en timestamptz not null default now(),
  unique (recurrente_id, periodo)
);

-- Las cuotas generadas son gastos normales enlazados a su plantilla.
alter table public.gastos add column if not exists recurrente_id uuid
  references public.gastos_recurrentes on delete set null;
alter table public.gastos add column if not exists periodo text;
alter table public.gastos add column if not exists motivo_anulacion text;
create unique index if not exists gastos_cuota_unica on public.gastos (recurrente_id, periodo);

-- Nuevo estado "anulado": una cuota generada por error deja de sumar al saldo,
-- pero sigue visible en el historial (nunca se borra).
alter table public.gastos drop constraint if exists gastos_estado_check;
alter table public.gastos add constraint gastos_estado_check
  check (estado in ('pendiente', 'aprobado', 'rechazado', 'reembolsado', 'anulado'));

-- ----------------------------------------------------------------------------
-- 17. GENERACIÓN AUTOMÁTICA DE CUOTAS
--     La app la llama al abrir Inicio o Gastos. Es idempotente: nunca duplica
--     una cuota (índice único recurrente_id + periodo).
-- ----------------------------------------------------------------------------
create or replace function public.generar_cuotas(fid uuid)
returns int language plpgsql security definer set search_path = public as $$
declare
  r record;
  act record;
  paso int;
  mes date;          -- primer día del mes del periodo
  fin_mes date;
  cobro date;
  per text;
  sesiones int;
  importe_cuota numeric(10,2);
  filas int;
  total int := 0;
  nombres_mes text[] := array['enero','febrero','marzo','abril','mayo','junio','julio',
                              'agosto','septiembre','octubre','noviembre','diciembre'];
begin
  if not public.es_miembro(fid) then
    raise exception 'No autorizado';
  end if;

  for r in
    select * from public.gastos_recurrentes
    where familia_id = fid and estado in ('activo', 'finalizado')
  loop
    paso := case r.frecuencia when 'bimestral' then 2 when 'trimestral' then 3 when 'anual' then 12 else 1 end;
    if r.modo = 'por_sesion' then paso := 1; end if;
    mes := date_trunc('month', r.fecha_inicio)::date;

    while mes <= current_date loop
      fin_mes := (mes + interval '1 month' - interval '1 day')::date;
      exit when r.fecha_fin is not null and mes > r.fecha_fin;

      -- Fecha en que se registra la cuota del periodo
      if r.modo = 'por_sesion' then
        cobro := fin_mes + 1;                       -- a mes vencido: el día 1 del mes siguiente
      else
        cobro := mes + (least(r.dia_cobro, extract(day from fin_mes)::int) - 1);
      end if;
      exit when cobro > current_date;

      per := to_char(mes, 'YYYY-MM');

      if not (extract(month from mes)::int = any (r.meses_sin_cobro))
         and not (r.pausa_desde is not null
                  and fin_mes >= r.pausa_desde
                  and (r.pausa_hasta is null or mes <= r.pausa_hasta))
         and not exists (select 1 from public.gastos_recurrentes_omisiones o
                         where o.recurrente_id = r.id and o.periodo = per)
         and not exists (select 1 from public.gastos g
                         where g.recurrente_id = r.id and g.periodo = per)
      then
        importe_cuota := r.importe;
        sesiones := null;

        if r.modo = 'por_sesion' then
          select * into act from public.actividades where id = r.actividad_id;
          if not found then
            importe_cuota := 0;
          else
            select count(*) into sesiones
            from generate_series(greatest(mes, act.fecha_inicio)::timestamp,
                                 least(fin_mes, coalesce(act.fecha_fin, fin_mes))::timestamp,
                                 interval '1 day') as g(d)
            cross join lateral jsonb_array_elements(act.horarios) h
            where (h->>'dia')::int = extract(isodow from g.d)::int
              and not (extract(month from g.d)::int = any (act.meses_sin_actividad))
              and (act.frecuencia = 'semanal'
                   or ((g.d::date - (act.fecha_inicio - (extract(isodow from act.fecha_inicio)::int - 1))) / 7) % 2 = 0)
              and not exists (select 1 from public.actividad_excepciones e
                              where e.actividad_id = act.id and e.fecha = g.d::date
                                and e.tipo = 'cancelada');
            importe_cuota := sesiones * r.importe;
          end if;
        end if;

        if importe_cuota > 0 then
          insert into public.gastos (familia_id, hijo_id, concepto, categoria, importe, reparto_pct,
                                     pagado_por, estado, respondido_por, respondido_en, notas,
                                     recurrente_id, periodo)
          values (r.familia_id, r.hijo_id,
                  r.concepto || ' · cuota de ' || nombres_mes[extract(month from mes)::int]
                    || ' ' || extract(year from mes)::int,
                  r.categoria, importe_cuota, r.reparto_pct, r.pagado_por, 'aprobado',
                  coalesce(r.aprobado_por, r.creado_por), now(),
                  case when r.modo = 'por_sesion'
                       then sesiones || ' sesiones × ' || replace(r.importe::text, '.', ',') || ' €'
                       else 'Cuota recurrente' end,
                  r.id, per)
          on conflict (recurrente_id, periodo) do nothing;
          get diagnostics filas = row_count;
          total := total + filas;
        end if;
      end if;

      mes := (mes + make_interval(months => paso))::date;
    end loop;
  end loop;

  return total;
end $$;

-- ----------------------------------------------------------------------------
-- 18. TRIGGERS: auditoría + notificaciones al otro progenitor
-- ----------------------------------------------------------------------------
create or replace function public.tras_actividad()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    perform public.notificar_familia(new.familia_id, new.creado_por, 'calendario',
      'Nueva actividad: ' || new.nombre, 'Se ha añadido a la agenda de los hijos.', '/app/hijos');
    perform public.auditar(new.familia_id, new.creado_por, 'actividad_creada', 'actividad', new.id,
      to_jsonb(new));
    return new;
  elsif tg_op = 'UPDATE' then
    perform public.notificar_familia(new.familia_id, auth.uid(), 'calendario',
      'Actividad modificada: ' || new.nombre, null, '/app/hijos');
    perform public.auditar(new.familia_id, auth.uid(), 'actividad_modificada', 'actividad', new.id,
      jsonb_build_object('antes', to_jsonb(old), 'despues', to_jsonb(new)));
    return new;
  else
    if exists (select 1 from public.familias where id = old.familia_id) then
      perform public.notificar_familia(old.familia_id, auth.uid(), 'calendario',
        'Actividad eliminada: ' || old.nombre, null, '/app/hijos');
      perform public.auditar(old.familia_id, auth.uid(), 'actividad_eliminada', 'actividad', old.id,
        to_jsonb(old));
    end if;
    return old;
  end if;
end $$;
drop trigger if exists auditar_actividad on public.actividades;
create trigger auditar_actividad after insert or update or delete on public.actividades
  for each row execute function public.tras_actividad();

create or replace function public.tras_excepcion()
returns trigger language plpgsql security definer set search_path = public as $$
declare nombre_act text;
begin
  if tg_op = 'INSERT' then
    select nombre into nombre_act from public.actividades where id = new.actividad_id;
    perform public.notificar_familia(new.familia_id, new.creado_por, 'calendario',
      case new.tipo
        when 'cancelada' then 'Sesión cancelada: '
        when 'movida' then 'Sesión movida: '
        else 'Cambio de quién lleva: ' end
      || coalesce(nombre_act, 'actividad') || ' (' || to_char(new.fecha, 'DD/MM/YYYY') || ')',
      new.motivo, '/app/hijos');
    perform public.auditar(new.familia_id, new.creado_por, 'sesion_' || new.tipo, 'actividad_excepcion',
      new.id, to_jsonb(new));
    return new;
  else
    if exists (select 1 from public.familias where id = old.familia_id) then
      select nombre into nombre_act from public.actividades where id = old.actividad_id;
      perform public.notificar_familia(old.familia_id, auth.uid(), 'calendario',
        'Sesión restablecida: ' || coalesce(nombre_act, 'actividad')
          || ' (' || to_char(old.fecha, 'DD/MM/YYYY') || ')', null, '/app/hijos');
      perform public.auditar(old.familia_id, auth.uid(), 'sesion_restablecida', 'actividad_excepcion',
        old.id, to_jsonb(old));
    end if;
    return old;
  end if;
end $$;
drop trigger if exists auditar_excepcion on public.actividad_excepciones;
create trigger auditar_excepcion after insert or delete on public.actividad_excepciones
  for each row execute function public.tras_excepcion();

create or replace function public.tras_recurrente()
returns trigger language plpgsql security definer set search_path = public as $$
declare enlace text := '/app/gastos?vista=recurrentes';
begin
  if tg_op = 'INSERT' then
    perform public.notificar_familia(new.familia_id, new.creado_por, 'gasto',
      case when new.estado = 'propuesto'
           then 'Propuesta de gasto recurrente: ' || new.concepto
           else 'Nuevo gasto recurrente: ' || new.concepto end,
      new.importe || ' € · ' || case when new.modo = 'por_sesion' then 'por sesión' else new.frecuencia end
        || ' · te corresponde el ' || new.reparto_pct || ' %', enlace);
    perform public.auditar(new.familia_id, new.creado_por, 'recurrente_creado', 'gasto_recurrente',
      new.id, to_jsonb(new));
    return new;
  elsif tg_op = 'UPDATE' then
    if new.estado is distinct from old.estado then
      perform public.notificar_familia(new.familia_id, auth.uid(), 'gasto',
        'Gasto recurrente "' || new.concepto || '" ' || new.estado, new.motivo_respuesta, enlace);
    elsif new.cambio_propuesto is not null and old.cambio_propuesto is null then
      perform public.notificar_familia(new.familia_id, auth.uid(), 'gasto',
        'Propuesta de cambio en "' || new.concepto || '"', 'Revisa y acepta o rechaza el cambio.', enlace);
    else
      perform public.notificar_familia(new.familia_id, auth.uid(), 'gasto',
        'Gasto recurrente modificado: ' || new.concepto, null, enlace);
    end if;
    perform public.auditar(new.familia_id, auth.uid(), 'recurrente_modificado', 'gasto_recurrente',
      new.id, jsonb_build_object('antes', to_jsonb(old), 'despues', to_jsonb(new)));
    return new;
  else
    if exists (select 1 from public.familias where id = old.familia_id) then
      perform public.notificar_familia(old.familia_id, auth.uid(), 'gasto',
        'Gasto recurrente eliminado: ' || old.concepto,
        'Las cuotas ya registradas se conservan en el historial.', enlace);
      perform public.auditar(old.familia_id, auth.uid(), 'recurrente_eliminado', 'gasto_recurrente',
        old.id, to_jsonb(old));
    end if;
    return old;
  end if;
end $$;
drop trigger if exists auditar_recurrente on public.gastos_recurrentes;
create trigger auditar_recurrente after insert or update or delete on public.gastos_recurrentes
  for each row execute function public.tras_recurrente();

create or replace function public.tras_omision()
returns trigger language plpgsql security definer set search_path = public as $$
declare concepto_rec text;
begin
  select concepto into concepto_rec from public.gastos_recurrentes where id = new.recurrente_id;
  perform public.notificar_familia(new.familia_id, new.creado_por, 'gasto',
    'No se pagará la cuota de ' || new.periodo || ': ' || coalesce(concepto_rec, ''),
    new.motivo, '/app/gastos?vista=recurrentes');
  perform public.auditar(new.familia_id, new.creado_por, 'cuota_omitida', 'gasto_recurrente',
    new.recurrente_id, jsonb_build_object('periodo', new.periodo, 'motivo', new.motivo));
  return new;
end $$;
drop trigger if exists auditar_omision on public.gastos_recurrentes_omisiones;
create trigger auditar_omision after insert on public.gastos_recurrentes_omisiones
  for each row execute function public.tras_omision();

-- ----------------------------------------------------------------------------
-- 19. ROW LEVEL SECURITY de las tablas nuevas
-- ----------------------------------------------------------------------------
alter table public.actividades enable row level security;
alter table public.actividad_excepciones enable row level security;
alter table public.gastos_recurrentes enable row level security;
alter table public.gastos_recurrentes_omisiones enable row level security;

drop policy if exists "actividades: ver" on public.actividades;
drop policy if exists "actividades: crear" on public.actividades;
drop policy if exists "actividades: editar" on public.actividades;
drop policy if exists "actividades: borrar" on public.actividades;
create policy "actividades: ver" on public.actividades for select using (public.es_miembro(familia_id));
create policy "actividades: crear" on public.actividades for insert
  with check (public.es_miembro(familia_id) and creado_por = auth.uid());
create policy "actividades: editar" on public.actividades for update using (public.es_miembro(familia_id));
create policy "actividades: borrar" on public.actividades for delete using (public.es_miembro(familia_id));

drop policy if exists "excepciones: ver" on public.actividad_excepciones;
drop policy if exists "excepciones: crear" on public.actividad_excepciones;
drop policy if exists "excepciones: borrar" on public.actividad_excepciones;
create policy "excepciones: ver" on public.actividad_excepciones for select
  using (public.es_miembro(familia_id));
create policy "excepciones: crear" on public.actividad_excepciones for insert
  with check (public.es_miembro(familia_id) and creado_por = auth.uid());
create policy "excepciones: borrar" on public.actividad_excepciones for delete
  using (public.es_miembro(familia_id));

drop policy if exists "recurrentes: ver" on public.gastos_recurrentes;
drop policy if exists "recurrentes: crear" on public.gastos_recurrentes;
drop policy if exists "recurrentes: editar" on public.gastos_recurrentes;
drop policy if exists "recurrentes: borrar" on public.gastos_recurrentes;
create policy "recurrentes: ver" on public.gastos_recurrentes for select
  using (public.es_miembro(familia_id));
create policy "recurrentes: crear" on public.gastos_recurrentes for insert
  with check (public.es_miembro(familia_id) and creado_por = auth.uid());
create policy "recurrentes: editar" on public.gastos_recurrentes for update
  using (public.es_miembro(familia_id));
create policy "recurrentes: borrar" on public.gastos_recurrentes for delete
  using (public.es_miembro(familia_id));

drop policy if exists "omisiones: ver" on public.gastos_recurrentes_omisiones;
drop policy if exists "omisiones: crear" on public.gastos_recurrentes_omisiones;
create policy "omisiones: ver" on public.gastos_recurrentes_omisiones for select
  using (public.es_miembro(familia_id));
create policy "omisiones: crear" on public.gastos_recurrentes_omisiones for insert
  with check (public.es_miembro(familia_id) and creado_por = auth.uid());
