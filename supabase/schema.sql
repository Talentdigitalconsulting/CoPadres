-- ============================================================================
-- CoPadres — Esquema completo de base de datos para Supabase (PostgreSQL)
-- Ejecutar ENTERO en: Supabase > SQL Editor > New query > Run
-- Incluye: tablas, Row Level Security en TODAS, triggers de notificación
-- automática y registro de auditoría inmutable.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. PERFILES (se crea uno automáticamente al registrarse un usuario)
-- ----------------------------------------------------------------------------
create table public.perfiles (
  id uuid primary key references auth.users on delete cascade,
  nombre text,
  email text,
  avatar_url text,
  -- Preferencias de notificación (panel de ajustes)
  notif_mensajes boolean not null default true,
  notif_gastos boolean not null default true,
  notif_calendario boolean not null default true,
  notif_diario boolean not null default true,
  -- Filtro de tono IA activado por defecto (se puede desactivar en ajustes)
  filtro_tono boolean not null default true,
  creado_en timestamptz not null default now()
);

create or replace function public.crear_perfil()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.perfiles (id, nombre, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  ) on conflict (id) do nothing;
  return new;
end $$;

create trigger al_crear_usuario
  after insert on auth.users
  for each row execute function public.crear_perfil();

-- ----------------------------------------------------------------------------
-- 2. FAMILIAS Y MIEMBROS
-- ----------------------------------------------------------------------------
create table public.familias (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  -- % del gasto que asume el creador (progenitor A). El otro asume el resto.
  reparto_gastos int not null default 50 check (reparto_gastos between 0 and 100),
  creado_por uuid not null references auth.users,
  creado_en timestamptz not null default now()
);

create table public.miembros_familia (
  id uuid primary key default gen_random_uuid(),
  familia_id uuid not null references public.familias on delete cascade,
  usuario_id uuid not null references auth.users on delete cascade,
  rol text not null default 'progenitor' check (rol in ('progenitor', 'profesional')),
  creado_en timestamptz not null default now(),
  unique (familia_id, usuario_id)
);

create table public.invitaciones (
  id uuid primary key default gen_random_uuid(),
  familia_id uuid not null references public.familias on delete cascade,
  email text not null,
  token uuid not null default gen_random_uuid(),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'aceptada', 'anulada')),
  creado_por uuid not null references auth.users,
  creado_en timestamptz not null default now()
);

-- Función auxiliar: ¿es el usuario actual miembro de la familia?
-- (security definer para poder usarla dentro de las políticas RLS sin recursión)
create or replace function public.es_miembro(fid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.miembros_familia
    where familia_id = fid and usuario_id = auth.uid()
  );
$$;

-- ----------------------------------------------------------------------------
-- 3. HIJOS
-- ----------------------------------------------------------------------------
create table public.hijos (
  id uuid primary key default gen_random_uuid(),
  familia_id uuid not null references public.familias on delete cascade,
  nombre text not null,
  fecha_nacimiento date,
  notas text,
  creado_en timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 4. CALENDARIO DE CUSTODIA
-- ----------------------------------------------------------------------------
create table public.eventos_custodia (
  id uuid primary key default gen_random_uuid(),
  familia_id uuid not null references public.familias on delete cascade,
  hijo_id uuid references public.hijos on delete set null,
  tipo text not null default 'custodia'
    check (tipo in ('custodia', 'vacaciones', 'medico', 'colegio', 'actividad', 'otro')),
  titulo text not null,
  -- Progenitor con quien están los hijos durante el evento
  progenitor_id uuid references auth.users,
  fecha_inicio date not null,
  fecha_fin date not null,
  notas text,
  creado_por uuid not null references auth.users default auth.uid(),
  creado_en timestamptz not null default now(),
  check (fecha_fin >= fecha_inicio)
);

-- Solicitudes de cambio auditadas: quién pidió qué y quién respondió, con fecha y hora.
create table public.solicitudes_cambio (
  id uuid primary key default gen_random_uuid(),
  familia_id uuid not null references public.familias on delete cascade,
  evento_id uuid references public.eventos_custodia on delete set null,
  descripcion text not null,
  fecha_propuesta_inicio date,
  fecha_propuesta_fin date,
  solicitado_por uuid not null references auth.users default auth.uid(),
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'aceptada', 'rechazada', 'anulada')),
  respondido_por uuid references auth.users,
  respondido_en timestamptz,
  motivo_respuesta text,
  creado_en timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 5. GASTOS EXTRAORDINARIOS
-- ----------------------------------------------------------------------------
create table public.gastos (
  id uuid primary key default gen_random_uuid(),
  familia_id uuid not null references public.familias on delete cascade,
  hijo_id uuid references public.hijos on delete set null,
  concepto text not null,
  categoria text not null default 'otro'
    check (categoria in ('medico', 'educacion', 'ropa', 'actividades', 'otro')),
  importe numeric(10,2) not null check (importe > 0),
  -- % que reclama quien pagó al otro progenitor (precargado según el convenio de la familia)
  reparto_pct int not null default 50 check (reparto_pct between 0 and 100),
  comprobante_url text,
  pagado_por uuid not null references auth.users default auth.uid(),
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'aprobado', 'rechazado', 'reembolsado')),
  respondido_por uuid references auth.users,
  respondido_en timestamptz,
  notas text,
  creado_en timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 6. MENSAJERÍA (inmutable: no se puede editar ni borrar — valor probatorio)
-- ----------------------------------------------------------------------------
create table public.mensajes (
  id uuid primary key default gen_random_uuid(),
  familia_id uuid not null references public.familias on delete cascade,
  remitente_id uuid not null references auth.users default auth.uid(),
  texto text not null,
  -- Si el filtro de tono IA reformuló el mensaje, se guarda que fue filtrado.
  filtrado_ia boolean not null default false,
  creado_en timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 7. DIARIO COMPARTIDO DEL MENOR
-- ----------------------------------------------------------------------------
create table public.diario (
  id uuid primary key default gen_random_uuid(),
  familia_id uuid not null references public.familias on delete cascade,
  hijo_id uuid references public.hijos on delete set null,
  categoria text not null default 'otro'
    check (categoria in ('salud', 'medicacion', 'colegio', 'actividad', 'otro')),
  titulo text not null,
  contenido text,
  creado_por uuid not null references auth.users default auth.uid(),
  creado_en timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 8. NOTIFICACIONES (el sistema las crea solo, mediante triggers)
-- ----------------------------------------------------------------------------
create table public.notificaciones (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users on delete cascade,
  familia_id uuid references public.familias on delete cascade,
  tipo text not null,
  titulo text not null,
  cuerpo text,
  enlace text,
  leida boolean not null default false,
  creado_en timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 9. REGISTRO DE AUDITORÍA (inmutable — valor probatorio ante juzgados)
-- ----------------------------------------------------------------------------
create table public.registro_auditoria (
  id bigint generated always as identity primary key,
  familia_id uuid not null references public.familias on delete cascade,
  actor_id uuid references auth.users,
  accion text not null,
  entidad text not null,
  entidad_id uuid,
  detalles jsonb,
  creado_en timestamptz not null default now()
);

-- Bloquear cualquier intento de modificar o borrar la auditoría o los mensajes.
create or replace function public.bloquear_cambio()
returns trigger language plpgsql as $$
begin
  raise exception 'Este registro es inmutable y no puede modificarse ni borrarse.';
end $$;

create trigger auditoria_inmutable
  before update or delete on public.registro_auditoria
  for each row execute function public.bloquear_cambio();

create trigger mensajes_inmutables
  before update or delete on public.mensajes
  for each row execute function public.bloquear_cambio();

-- ----------------------------------------------------------------------------
-- 10. SUSCRIPCIONES (sincronizadas desde el webhook de Stripe)
-- ----------------------------------------------------------------------------
create table public.suscripciones (
  usuario_id uuid primary key references auth.users on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text check (plan in ('individual', 'familia')),
  estado text not null default 'inactiva',
  periodo_fin timestamptz,
  actualizado_en timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 11. TRIGGERS AUTOMÁTICOS: auditoría + notificaciones al otro progenitor
--     (esto hace que el sistema sea autónomo y esté enlazado)
-- ----------------------------------------------------------------------------
create or replace function public.notificar_familia(
  fid uuid, excluir uuid, ntipo text, ntitulo text, ncuerpo text, nenlace text
) returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.notificaciones (usuario_id, familia_id, tipo, titulo, cuerpo, enlace)
  select m.usuario_id, fid, ntipo, ntitulo, ncuerpo, nenlace
  from public.miembros_familia m
  where m.familia_id = fid and m.usuario_id is distinct from excluir;
end $$;

create or replace function public.auditar(
  fid uuid, aid uuid, acc text, ent text, eid uuid, det jsonb
) returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.registro_auditoria (familia_id, actor_id, accion, entidad, entidad_id, detalles)
  values (fid, aid, acc, ent, eid, det);
end $$;

-- Nuevo mensaje → notificación + auditoría
create or replace function public.tras_mensaje()
returns trigger language plpgsql security definer set search_path = public as $$
declare nombre_remitente text;
begin
  select nombre into nombre_remitente from public.perfiles where id = new.remitente_id;
  perform public.notificar_familia(new.familia_id, new.remitente_id, 'mensaje',
    'Nuevo mensaje de ' || coalesce(nombre_remitente, 'tu copadre/comadre'),
    left(new.texto, 120), '/app/mensajes');
  perform public.auditar(new.familia_id, new.remitente_id, 'mensaje_enviado', 'mensaje', new.id,
    jsonb_build_object('filtrado_ia', new.filtrado_ia));
  return new;
end $$;
create trigger notificar_mensaje after insert on public.mensajes
  for each row execute function public.tras_mensaje();

-- Nuevo gasto → notificación + auditoría
create or replace function public.tras_gasto()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.notificar_familia(new.familia_id, new.pagado_por, 'gasto',
    'Nuevo gasto: ' || new.concepto,
    'Importe ' || new.importe || ' € · te corresponde el ' || new.reparto_pct || ' %', '/app/gastos');
  perform public.auditar(new.familia_id, new.pagado_por, 'gasto_creado', 'gasto', new.id,
    jsonb_build_object('concepto', new.concepto, 'importe', new.importe, 'reparto_pct', new.reparto_pct));
  return new;
end $$;
create trigger notificar_gasto after insert on public.gastos
  for each row execute function public.tras_gasto();

-- Cambio de estado de un gasto → notificación + auditoría
create or replace function public.tras_estado_gasto()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.estado is distinct from old.estado then
    perform public.notificar_familia(new.familia_id, auth.uid(), 'gasto',
      'Gasto "' || new.concepto || '" ' || new.estado,
      'Importe ' || new.importe || ' €', '/app/gastos');
    perform public.auditar(new.familia_id, auth.uid(), 'gasto_' || new.estado, 'gasto', new.id,
      jsonb_build_object('estado_anterior', old.estado, 'estado_nuevo', new.estado));
  end if;
  return new;
end $$;
create trigger auditar_estado_gasto after update on public.gastos
  for each row execute function public.tras_estado_gasto();

-- Nueva solicitud de cambio de custodia → notificación + auditoría
create or replace function public.tras_solicitud()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.notificar_familia(new.familia_id, new.solicitado_por, 'calendario',
    'Nueva solicitud de cambio de custodia', left(new.descripcion, 120), '/app/calendario');
  perform public.auditar(new.familia_id, new.solicitado_por, 'solicitud_creada', 'solicitud_cambio', new.id,
    jsonb_build_object('descripcion', new.descripcion));
  return new;
end $$;
create trigger notificar_solicitud after insert on public.solicitudes_cambio
  for each row execute function public.tras_solicitud();

-- Respuesta a una solicitud → notificación + auditoría (quién y cuándo)
create or replace function public.tras_respuesta_solicitud()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.estado is distinct from old.estado then
    perform public.notificar_familia(new.familia_id, auth.uid(), 'calendario',
      'Solicitud de cambio ' || new.estado, left(new.descripcion, 120), '/app/calendario');
    perform public.auditar(new.familia_id, auth.uid(), 'solicitud_' || new.estado, 'solicitud_cambio', new.id,
      jsonb_build_object('estado_anterior', old.estado, 'estado_nuevo', new.estado,
                         'motivo', new.motivo_respuesta));
  end if;
  return new;
end $$;
create trigger auditar_respuesta_solicitud after update on public.solicitudes_cambio
  for each row execute function public.tras_respuesta_solicitud();

-- Nueva entrada del diario → notificación + auditoría
create or replace function public.tras_diario()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.notificar_familia(new.familia_id, new.creado_por, 'diario',
    'Diario: ' || new.titulo, left(coalesce(new.contenido, ''), 120), '/app/diario');
  perform public.auditar(new.familia_id, new.creado_por, 'diario_creado', 'diario', new.id,
    jsonb_build_object('categoria', new.categoria, 'titulo', new.titulo));
  return new;
end $$;
create trigger notificar_diario after insert on public.diario
  for each row execute function public.tras_diario();

-- Nuevo evento de calendario → auditoría
create or replace function public.tras_evento()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.notificar_familia(new.familia_id, new.creado_por, 'calendario',
    'Nuevo evento: ' || new.titulo,
    to_char(new.fecha_inicio, 'DD/MM/YYYY') || ' – ' || to_char(new.fecha_fin, 'DD/MM/YYYY'), '/app/calendario');
  perform public.auditar(new.familia_id, new.creado_por, 'evento_creado', 'evento_custodia', new.id,
    jsonb_build_object('titulo', new.titulo, 'inicio', new.fecha_inicio, 'fin', new.fecha_fin));
  return new;
end $$;
create trigger auditar_evento after insert on public.eventos_custodia
  for each row execute function public.tras_evento();

-- ----------------------------------------------------------------------------
-- 12. ROW LEVEL SECURITY — activada en TODAS las tablas
-- ----------------------------------------------------------------------------
alter table public.perfiles enable row level security;
alter table public.familias enable row level security;
alter table public.miembros_familia enable row level security;
alter table public.invitaciones enable row level security;
alter table public.hijos enable row level security;
alter table public.eventos_custodia enable row level security;
alter table public.solicitudes_cambio enable row level security;
alter table public.gastos enable row level security;
alter table public.mensajes enable row level security;
alter table public.diario enable row level security;
alter table public.notificaciones enable row level security;
alter table public.registro_auditoria enable row level security;
alter table public.suscripciones enable row level security;

-- Perfiles: cada usuario ve y edita el suyo; los miembros de su familia pueden ver su nombre.
create policy "perfil propio" on public.perfiles
  for all using (id = auth.uid()) with check (id = auth.uid());
create policy "perfil de mi familia" on public.perfiles
  for select using (exists (
    select 1 from public.miembros_familia m1
    join public.miembros_familia m2 on m1.familia_id = m2.familia_id
    where m1.usuario_id = auth.uid() and m2.usuario_id = perfiles.id
  ));

-- Familias
create policy "ver mi familia" on public.familias for select using (public.es_miembro(id));
create policy "crear familia" on public.familias for insert with check (creado_por = auth.uid());
create policy "editar mi familia" on public.familias for update using (public.es_miembro(id));

-- Miembros
create policy "ver miembros" on public.miembros_familia for select using (public.es_miembro(familia_id));
create policy "unirme a familia" on public.miembros_familia for insert with check (usuario_id = auth.uid());

-- Invitaciones: los miembros las gestionan; cualquiera autenticado puede leer una
-- invitación pendiente (necesario para aceptar por token desde /invitacion).
create policy "ver invitaciones familia" on public.invitaciones for select
  using (public.es_miembro(familia_id) or estado = 'pendiente');
create policy "crear invitacion" on public.invitaciones for insert
  with check (public.es_miembro(familia_id) and creado_por = auth.uid());
create policy "actualizar invitacion" on public.invitaciones for update
  using (auth.uid() is not null);

-- Hijos
create policy "hijos: ver" on public.hijos for select using (public.es_miembro(familia_id));
create policy "hijos: crear" on public.hijos for insert with check (public.es_miembro(familia_id));
create policy "hijos: editar" on public.hijos for update using (public.es_miembro(familia_id));
create policy "hijos: borrar" on public.hijos for delete using (public.es_miembro(familia_id));

-- Eventos de custodia
create policy "eventos: ver" on public.eventos_custodia for select using (public.es_miembro(familia_id));
create policy "eventos: crear" on public.eventos_custodia for insert
  with check (public.es_miembro(familia_id) and creado_por = auth.uid());
create policy "eventos: editar" on public.eventos_custodia for update using (public.es_miembro(familia_id));
create policy "eventos: borrar solo el creador" on public.eventos_custodia for delete
  using (creado_por = auth.uid());

-- Solicitudes de cambio: solo puede responder quien NO la solicitó.
create policy "solicitudes: ver" on public.solicitudes_cambio for select using (public.es_miembro(familia_id));
create policy "solicitudes: crear" on public.solicitudes_cambio for insert
  with check (public.es_miembro(familia_id) and solicitado_por = auth.uid());
create policy "solicitudes: responder o anular" on public.solicitudes_cambio for update
  using (public.es_miembro(familia_id));

-- Gastos: solo puede aprobar/rechazar quien NO lo pagó (se valida también en el cliente).
create policy "gastos: ver" on public.gastos for select using (public.es_miembro(familia_id));
create policy "gastos: crear" on public.gastos for insert
  with check (public.es_miembro(familia_id) and pagado_por = auth.uid());
create policy "gastos: actualizar" on public.gastos for update using (public.es_miembro(familia_id));

-- Mensajes: leer y escribir; nunca editar ni borrar (trigger lo bloquea además).
create policy "mensajes: ver" on public.mensajes for select using (public.es_miembro(familia_id));
create policy "mensajes: enviar" on public.mensajes for insert
  with check (public.es_miembro(familia_id) and remitente_id = auth.uid());

-- Diario
create policy "diario: ver" on public.diario for select using (public.es_miembro(familia_id));
create policy "diario: crear" on public.diario for insert
  with check (public.es_miembro(familia_id) and creado_por = auth.uid());

-- Notificaciones: cada usuario solo las suyas.
create policy "notificaciones propias" on public.notificaciones
  for all using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

-- Auditoría: los miembros pueden LEER; nadie puede escribir directamente
-- (solo los triggers, que son security definer).
create policy "auditoria: ver" on public.registro_auditoria for select using (public.es_miembro(familia_id));

-- Suscripciones: cada usuario ve la suya (las escribe el webhook con service role).
create policy "suscripcion propia" on public.suscripciones for select using (usuario_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 13. STORAGE: bucket para comprobantes de gastos
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('comprobantes', 'comprobantes', false)
  on conflict (id) do nothing;

-- Cada archivo se guarda en la carpeta <familia_id>/... y solo los miembros acceden.
create policy "comprobantes: subir" on storage.objects for insert
  with check (bucket_id = 'comprobantes' and public.es_miembro((storage.foldername(name))[1]::uuid));
create policy "comprobantes: ver" on storage.objects for select
  using (bucket_id = 'comprobantes' and public.es_miembro((storage.foldername(name))[1]::uuid));

-- ----------------------------------------------------------------------------
-- 14. REALTIME: mensajes y notificaciones en tiempo real
-- ----------------------------------------------------------------------------
alter publication supabase_realtime add table public.mensajes;
alter publication supabase_realtime add table public.notificaciones;

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

-- ============================================================================
-- FIN. Recuerda activar el proveedor Google en Authentication > Providers.
-- ============================================================================
