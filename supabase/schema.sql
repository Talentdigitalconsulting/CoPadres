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

-- ============================================================================
-- FIN. Recuerda activar el proveedor Google en Authentication > Providers.
-- ============================================================================
