-- ============================================================================
-- CoPadres — Migración 003: endurecimiento de seguridad
--
-- Aplicar UNA vez (después de schema.sql y de la migración 002):
--   Supabase > SQL Editor > New query > pega este archivo entero > Run
-- Es segura de repetir. Las instalaciones nuevas ya la tienen al final de schema.sql.
--
-- Qué corrige / añade:
--   1. Nadie puede meterse en una familia ajena (antes cualquier usuario podía
--      insertarse en miembros_familia o leer tokens de invitación pendientes).
--   2. Las invitaciones se aceptan solo con una función segura: token válido,
--      no caducado, para el email invitado y con un máximo de 2 progenitores.
--   3. Las funciones internas (auditar, notificar_familia…) ya no se pueden
--      llamar desde fuera para falsear el registro o enviar avisos.
--   4. Gastos, solicitudes y gastos recurrentes solo cambian por transiciones
--      permitidas (nadie puede aprobar su propio gasto ni cambiar un importe).
--   5. Verificación en dos pasos (2FA) exigida también en la base de datos.
--   6. Límites de uso (rate limiting) para las funciones del servidor.
--   7. Registro inmutable de consentimientos legales (RGPD).
--   8. Más auditoría (cambios y borrados de eventos, hijos y reparto) y límites
--      de tamaño/tipo en los comprobantes.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- S1. Funciones internas: solo las pueden ejecutar los triggers (no la API)
-- ----------------------------------------------------------------------------
revoke execute on function public.auditar(uuid, uuid, text, text, uuid, jsonb) from public, anon, authenticated;
revoke execute on function public.notificar_familia(uuid, uuid, text, text, text, text) from public, anon, authenticated;
revoke execute on function public.crear_perfil() from public, anon, authenticated;
revoke execute on function public.bloquear_cambio() from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- S2. Familias y miembros: nadie entra en una familia ajena
-- ----------------------------------------------------------------------------
-- El creador debe poder leer su familia recién creada (antes de ser miembro).
drop policy if exists "ver mi familia" on public.familias;
create policy "ver mi familia" on public.familias for select
  using (public.es_miembro(id) or creado_por = auth.uid());

-- Solo el creador de la familia puede añadirse a sí mismo directamente.
-- El otro progenitor entra exclusivamente con aceptar_invitacion().
drop policy if exists "unirme a familia" on public.miembros_familia;
drop policy if exists "miembros: el creador se une a su familia" on public.miembros_familia;
create policy "miembros: el creador se une a su familia" on public.miembros_familia for insert
  with check (
    usuario_id = auth.uid()
    and exists (select 1 from public.familias f where f.id = familia_id and f.creado_por = auth.uid())
  );

-- ----------------------------------------------------------------------------
-- S3. Invitaciones: caducidad, sin lectura pública y aceptación segura
-- ----------------------------------------------------------------------------
alter table public.invitaciones add column if not exists caduca_en timestamptz not null default (now() + interval '7 days');
alter table public.invitaciones add column if not exists aceptada_por uuid references auth.users;
alter table public.invitaciones add column if not exists aceptada_en timestamptz;

drop policy if exists "ver invitaciones familia" on public.invitaciones;
drop policy if exists "actualizar invitacion" on public.invitaciones;
drop policy if exists "invitaciones: ver" on public.invitaciones;
drop policy if exists "invitaciones: anular" on public.invitaciones;
create policy "invitaciones: ver" on public.invitaciones for select using (public.es_miembro(familia_id));
create policy "invitaciones: anular" on public.invitaciones for update
  using (public.es_miembro(familia_id)) with check (public.es_miembro(familia_id) and estado = 'anulada');

/** Datos mínimos de una invitación para mostrarla (sin exponer el token ni el email completo). */
create or replace function public.ver_invitacion(p_token uuid)
returns table (familia_nombre text, invitado_por text, email_enmascarado text, estado text, caducada boolean)
language sql stable security definer set search_path = public as $$
  select f.nombre,
         coalesce(p.nombre, 'Un progenitor'),
         left(i.email, 1) || '***@' || split_part(i.email, '@', 2),
         i.estado,
         i.caduca_en < now()
  from public.invitaciones i
  join public.familias f on f.id = i.familia_id
  left join public.perfiles p on p.id = i.creado_por
  where i.token = p_token and auth.uid() is not null;
$$;

/** Acepta una invitación: valida token, caducidad, email y plazas. Devuelve la familia. */
create or replace function public.aceptar_invitacion(p_token uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  inv record;
  email_usuario text;
  plazas int;
begin
  if auth.uid() is null then raise exception 'Inicia sesión para aceptar la invitación.'; end if;

  select * into inv from public.invitaciones where token = p_token for update;
  if not found or inv.estado <> 'pendiente' then
    raise exception 'La invitación no es válida o ya se utilizó.';
  end if;
  if inv.caduca_en < now() then
    raise exception 'La invitación ha caducado. Pide una nueva.';
  end if;

  select lower(email) into email_usuario from auth.users where id = auth.uid();
  if email_usuario is distinct from lower(inv.email) then
    raise exception 'Esta invitación es para otra dirección de email.';
  end if;

  if exists (select 1 from public.miembros_familia where usuario_id = auth.uid()) then
    raise exception 'Tu cuenta ya pertenece a un espacio familiar.';
  end if;

  select count(*) into plazas from public.miembros_familia where familia_id = inv.familia_id and rol = 'progenitor';
  if plazas >= 2 then raise exception 'Este espacio ya tiene dos progenitores.'; end if;

  insert into public.miembros_familia (familia_id, usuario_id) values (inv.familia_id, auth.uid());
  update public.invitaciones
    set estado = 'aceptada', aceptada_por = auth.uid(), aceptada_en = now()
    where id = inv.id;
  perform public.auditar(inv.familia_id, auth.uid(), 'invitacion_aceptada', 'invitacion', inv.id,
    jsonb_build_object('email', inv.email));
  perform public.notificar_familia(inv.familia_id, auth.uid(), 'sistema',
    'El otro progenitor se ha unido al espacio', null, '/app');
  return inv.familia_id;
end $$;

revoke execute on function public.ver_invitacion(uuid) from public, anon;
revoke execute on function public.aceptar_invitacion(uuid) from public, anon;
grant execute on function public.ver_invitacion(uuid) to authenticated;
grant execute on function public.aceptar_invitacion(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- S4. Gastos: solo transiciones permitidas; importe y datos inalterables
-- ----------------------------------------------------------------------------
create or replace function public.validar_cambio_gasto()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  campos_libres text[] := array['estado', 'respondido_por', 'respondido_en', 'motivo_anulacion'];
  yo uuid := auth.uid();
begin
  if yo is null then return new; end if; -- procesos internos (service role)

  if (to_jsonb(new) - campos_libres) <> (to_jsonb(old) - campos_libres) then
    raise exception 'Un gasto registrado no se puede modificar; solo cambia su estado.';
  end if;

  if new.estado is distinct from old.estado then
    if old.estado = 'pendiente' and new.estado in ('aprobado', 'rechazado') then
      if yo = old.pagado_por then raise exception 'No puedes aprobar o rechazar un gasto que pagaste tú.'; end if;
    elsif old.estado = 'aprobado' and new.estado = 'reembolsado' then
      if yo <> old.pagado_por then raise exception 'Solo quien pagó puede marcarlo como reembolsado.'; end if;
    elsif old.estado = 'aprobado' and new.estado = 'anulado' then
      if yo <> old.pagado_por or old.periodo is null then
        raise exception 'Solo quien pagó puede anular una cuota recurrente.';
      end if;
    else
      raise exception 'Cambio de estado no permitido (% → %).', old.estado, new.estado;
    end if;
    new.respondido_por := yo;
    new.respondido_en := now();
  end if;
  return new;
end $$;
drop trigger if exists validar_gasto on public.gastos;
create trigger validar_gasto before update on public.gastos
  for each row execute function public.validar_cambio_gasto();

-- ----------------------------------------------------------------------------
-- S5. Solicitudes de cambio: responde el otro; anula quien la pidió
-- ----------------------------------------------------------------------------
create or replace function public.validar_cambio_solicitud()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  campos_libres text[] := array['estado', 'respondido_por', 'respondido_en', 'motivo_respuesta'];
  yo uuid := auth.uid();
begin
  if yo is null then return new; end if;
  if (to_jsonb(new) - campos_libres) <> (to_jsonb(old) - campos_libres) then
    raise exception 'Una solicitud enviada no se puede modificar.';
  end if;
  if new.estado is distinct from old.estado then
    if old.estado <> 'pendiente' then raise exception 'La solicitud ya fue respondida.'; end if;
    if new.estado in ('aceptada', 'rechazada') and yo = old.solicitado_por then
      raise exception 'No puedes responder a tu propia solicitud.';
    end if;
    if new.estado = 'anulada' and yo <> old.solicitado_por then
      raise exception 'Solo quien hizo la solicitud puede anularla.';
    end if;
    new.respondido_por := yo;
    new.respondido_en := now();
  end if;
  return new;
end $$;
drop trigger if exists validar_solicitud on public.solicitudes_cambio;
create trigger validar_solicitud before update on public.solicitudes_cambio
  for each row execute function public.validar_cambio_solicitud();

-- ----------------------------------------------------------------------------
-- S6. Gastos recurrentes: aprobar la propuesta y aceptar subidas es cosa del otro
-- ----------------------------------------------------------------------------
create or replace function public.validar_cambio_recurrente()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  yo uuid := auth.uid();
  solo_uno boolean;
  aumenta boolean;
  aplica_cambio boolean;
begin
  if yo is null then return new; end if;
  select count(*) < 2 into solo_uno from public.miembros_familia where familia_id = old.familia_id;

  -- Aprobar o rechazar una propuesta
  if old.estado = 'propuesto' and new.estado in ('activo', 'rechazado') then
    if yo = old.creado_por and not solo_uno then
      raise exception 'No puedes aceptar tu propia propuesta.';
    end if;
    if new.estado = 'activo' then
      new.aprobado_por := yo;
      new.aprobado_en := now();
    end if;
  elsif new.estado is distinct from old.estado
        and not (old.estado = 'activo' and new.estado = 'finalizado') then
    raise exception 'Cambio de estado no permitido (% → %).', old.estado, new.estado;
  end if;

  -- Una vez aprobado, lo que encarece la cuota solo entra si lo acepta el otro.
  if old.estado = 'activo' then
    aumenta :=
      new.importe > old.importe
      or new.reparto_pct is distinct from old.reparto_pct
      or new.pagado_por is distinct from old.pagado_por
      or new.frecuencia is distinct from old.frecuencia
      or new.modo is distinct from old.modo
      or new.fecha_inicio is distinct from old.fecha_inicio
      or exists (select 1 from unnest(old.meses_sin_cobro) m where not (m = any (new.meses_sin_cobro)))
      or (old.fecha_fin is not null and (new.fecha_fin is null or new.fecha_fin > old.fecha_fin));
    aplica_cambio := old.cambio_propuesto is not null and new.cambio_propuesto is null
                     and yo is distinct from old.cambio_propuesto_por;
    if aumenta and not aplica_cambio and not solo_uno then
      raise exception 'Ese cambio encarece la cuota: debe proponerse y aceptarlo el otro progenitor.';
    end if;
    if new.cambio_propuesto is not null and old.cambio_propuesto is null then
      new.cambio_propuesto_por := yo;
      new.cambio_propuesto_en := now();
    end if;
  end if;

  new.creado_por := old.creado_por;
  new.familia_id := old.familia_id;
  return new;
end $$;
drop trigger if exists validar_recurrente on public.gastos_recurrentes;
create trigger validar_recurrente before update on public.gastos_recurrentes
  for each row execute function public.validar_cambio_recurrente();

-- ----------------------------------------------------------------------------
-- S7. Más auditoría: eventos, hijos y cambios del reparto del convenio
-- ----------------------------------------------------------------------------
create or replace function public.auditar_cambio_generico()
returns trigger language plpgsql security definer set search_path = public as $$
declare fid uuid;
begin
  fid := case when tg_op = 'DELETE' then old.familia_id else new.familia_id end;
  if not exists (select 1 from public.familias where id = fid) then
    return case when tg_op = 'DELETE' then old else new end;
  end if;
  perform public.auditar(fid, auth.uid(), tg_table_name || '_' || lower(tg_op), tg_table_name,
    case when tg_op = 'DELETE' then old.id else new.id end,
    case when tg_op = 'UPDATE' then jsonb_build_object('antes', to_jsonb(old), 'despues', to_jsonb(new))
         when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end);
  if tg_table_name = 'eventos_custodia' and tg_op <> 'INSERT' then
    perform public.notificar_familia(fid, auth.uid(), 'calendario',
      case when tg_op = 'DELETE' then 'Evento eliminado: ' || old.titulo else 'Evento modificado: ' || new.titulo end,
      null, '/app/calendario');
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end $$;

drop trigger if exists auditar_evento_cambios on public.eventos_custodia;
create trigger auditar_evento_cambios after update or delete on public.eventos_custodia
  for each row execute function public.auditar_cambio_generico();
drop trigger if exists auditar_hijos on public.hijos;
create trigger auditar_hijos after insert or update or delete on public.hijos
  for each row execute function public.auditar_cambio_generico();

create or replace function public.tras_cambio_familia()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.reparto_gastos is distinct from old.reparto_gastos or new.nombre is distinct from old.nombre then
    perform public.auditar(new.id, auth.uid(), 'familia_modificada', 'familia', new.id,
      jsonb_build_object('antes', to_jsonb(old), 'despues', to_jsonb(new)));
    if new.reparto_gastos is distinct from old.reparto_gastos then
      perform public.notificar_familia(new.id, auth.uid(), 'gasto',
        'Se ha cambiado el reparto de gastos del convenio',
        old.reparto_gastos || ' % → ' || new.reparto_gastos || ' %', '/app/ajustes');
    end if;
  end if;
  new.creado_por := old.creado_por;
  return new;
end $$;
drop trigger if exists auditar_familia on public.familias;
create trigger auditar_familia before update on public.familias
  for each row execute function public.tras_cambio_familia();

-- ----------------------------------------------------------------------------
-- S8. Comprobantes: máximo 10 MB y solo imágenes o PDF
-- ----------------------------------------------------------------------------
update storage.buckets
  set file_size_limit = 10485760,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf']
  where id = 'comprobantes';

-- ----------------------------------------------------------------------------
-- S9. Límites de uso (rate limiting) — se llama desde las rutas /api del servidor
-- ----------------------------------------------------------------------------
create table if not exists public.limites_uso (
  clave text primary key,
  ventana_inicio timestamptz not null default now(),
  contador int not null default 0
);
alter table public.limites_uso enable row level security; -- sin políticas: solo vía función

/** Devuelve true si la acción está permitida y suma 1 al contador de la ventana. */
create or replace function public.consumir_limite(p_accion text, p_max int, p_segundos int, p_origen text default null)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  k text := left(p_accion, 40) || ':' || coalesce(auth.uid()::text, left(coalesce(p_origen, 'anonimo'), 64));
  fila record;
begin
  insert into public.limites_uso as l (clave, ventana_inicio, contador)
  values (k, now(), 1)
  on conflict (clave) do update
    set contador = case when l.ventana_inicio < now() - make_interval(secs => p_segundos) then 1 else l.contador + 1 end,
        ventana_inicio = case when l.ventana_inicio < now() - make_interval(secs => p_segundos) then now() else l.ventana_inicio end
  returning * into fila;
  -- Limpieza ocasional de ventanas antiguas
  if random() < 0.01 then delete from public.limites_uso where ventana_inicio < now() - interval '1 day'; end if;
  return fila.contador <= p_max;
end $$;
revoke execute on function public.consumir_limite(text, int, int, text) from public;
grant execute on function public.consumir_limite(text, int, int, text) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- S10. Consentimientos legales (inmutables): términos, privacidad, datos de salud
-- ----------------------------------------------------------------------------
create table if not exists public.consentimientos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users on delete cascade,
  tipo text not null check (tipo in ('terminos', 'privacidad', 'datos_salud_menores', 'comunicaciones')),
  version text not null,
  aceptado boolean not null default true,
  origen text,
  creado_en timestamptz not null default now()
);
alter table public.consentimientos enable row level security;
drop policy if exists "consentimientos: ver los míos" on public.consentimientos;
drop policy if exists "consentimientos: registrar los míos" on public.consentimientos;
create policy "consentimientos: ver los míos" on public.consentimientos for select using (usuario_id = auth.uid());
create policy "consentimientos: registrar los míos" on public.consentimientos for insert
  with check (usuario_id = auth.uid());
drop trigger if exists consentimientos_inmutables on public.consentimientos;
create trigger consentimientos_inmutables before update on public.consentimientos
  for each row execute function public.bloquear_cambio();

-- Al registrarse con email, los consentimientos marcados viajan en los metadatos
-- del usuario y se guardan aquí automáticamente.
create or replace function public.crear_perfil()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  c jsonb := new.raw_user_meta_data->'consentimientos';
  t text;
begin
  insert into public.perfiles (id, nombre, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  ) on conflict (id) do nothing;

  if c is not null and jsonb_typeof(c->'tipos') = 'array' then
    for t in select jsonb_array_elements_text(c->'tipos') loop
      if t in ('terminos', 'privacidad', 'datos_salud_menores', 'comunicaciones') then
        insert into public.consentimientos (usuario_id, tipo, version, origen)
        values (new.id, t, left(coalesce(c->>'version', 'desconocida'), 20), 'registro');
      end if;
    end loop;
  end if;
  return new;
end $$;
revoke execute on function public.crear_perfil() from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- S11. Verificación en dos pasos (2FA) exigida en la base de datos
--      Si el usuario tiene un factor TOTP verificado, sin el código (aal2) no
--      puede leer ni escribir nada aunque alguien conozca su contraseña.
-- ----------------------------------------------------------------------------
create or replace function public.mfa_cumplido()
returns boolean language sql stable security definer set search_path = public, auth as $$
  select coalesce(auth.jwt()->>'aal', 'aal1') = 'aal2'
      or not exists (
        select 1 from auth.mfa_factors f where f.user_id = auth.uid() and f.status = 'verified'
      );
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'perfiles', 'familias', 'miembros_familia', 'invitaciones', 'hijos', 'eventos_custodia',
    'solicitudes_cambio', 'gastos', 'mensajes', 'diario', 'notificaciones', 'registro_auditoria',
    'suscripciones', 'actividades', 'actividad_excepciones', 'gastos_recurrentes',
    'gastos_recurrentes_omisiones', 'consentimientos'
  ] loop
    if to_regclass('public.' || t) is not null then
      execute format('drop policy if exists "2FA obligatoria si está activada" on public.%I', t);
      execute format(
        'create policy "2FA obligatoria si está activada" on public.%I as restrictive for all to authenticated
           using (public.mfa_cumplido()) with check (public.mfa_cumplido())', t);
    end if;
  end loop;
end $$;

drop policy if exists "comprobantes: 2FA" on storage.objects;
create policy "comprobantes: 2FA" on storage.objects as restrictive for all to authenticated
  using (bucket_id <> 'comprobantes' or public.mfa_cumplido())
  with check (bucket_id <> 'comprobantes' or public.mfa_cumplido());
