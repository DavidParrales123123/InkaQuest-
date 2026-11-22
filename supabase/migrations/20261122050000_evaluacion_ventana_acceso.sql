-- =============================================================================
-- Ventana de acceso a evaluaciones (fecha de inicio y límite)
-- -----------------------------------------------------------------------------
-- * Las columnas son NULLABLE: NULL = extremo abierto. Las evaluaciones
--   existientes conservan su comportamiento exacto (retrocompatibilidad).
-- * La barrera autoritativa vive en la BD (trigger BEFORE INSERT sobre
--   intento_evaluacion): hoy cualquier cliente autenticado puede insertar un
--   intento directamente via PostgREST, asi que validar solo en el backend no
--   basta. Los intentos YA INICIADOS pueden terminarse: el trigger no toca
--   UPDATE.
-- * Se recrea de forma idempotente pol_evaluacion_select, que existia en
--   produccion creada a mano pero no en ninguna migracion (instalacion limpia
--   dejaba a los estudiantes sin poder listar evaluaciones).
-- =============================================================================

begin;

alter table public.evaluacion
    add column if not exists fecha_inicio timestamptz,
    add column if not exists fecha_limite_acceso timestamptz;

alter table public.evaluacion
    drop constraint if exists chk_evaluacion_ventana_acceso;
alter table public.evaluacion
    add constraint chk_evaluacion_ventana_acceso
    check (fecha_limite_acceso is null
           or fecha_inicio is null
           or fecha_limite_acceso > fecha_inicio);

create index if not exists idx_evaluacion_ventana_acceso
    on public.evaluacion (fecha_inicio, fecha_limite_acceso)
    where fecha_inicio is not null or fecha_limite_acceso is not null;

comment on column public.evaluacion.fecha_inicio is
    'Momento a partir del cual los estudiantes pueden iniciar intentos. NULL = sin limite inferior.';
comment on column public.evaluacion.fecha_limite_acceso is
    'Momento limite para INICIAR intentos. No afecta a intentos ya iniciados. NULL = sin limite superior.';

-- ---------- Barrera de acceso ----------
create or replace function public.fn_evaluacion_validar_ventana_acceso()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_inicio  timestamptz;
    v_limite  timestamptz;
    v_publicado boolean;
begin
    -- Los administradores pueden crear intentos de mantenimiento/soporte.
    if public.app_is_admin() then
        return new;
    end if;

    select e.fecha_inicio, e.fecha_limite_acceso, a.publicado
      into v_inicio, v_limite, v_publicado
      from public.evaluacion e
      join public.actividad a on a.id = e.actividad_id
     where e.id = new.evaluacion_id;

    if not found then
        -- La existencia la valida el servicio; no bloqueamos aqui para no
        -- endurecer mas de lo pedido.
        return new;
    end if;

    if coalesce(v_publicado, false) = false then
        raise exception 'Esta evaluación aún no está publicada.'
            using errcode = '22023';
    end if;
    if v_inicio is not null and now() < v_inicio then
        raise exception 'Esta evaluación aún no está disponible. Puedes iniciarla a partir del %.',
            to_char(v_inicio at time zone 'UTC', 'DD/MM/YYYY HH24:MI') using errcode = '22023';
    end if;
    if v_limite is not null and now() > v_limite then
        raise exception 'El plazo de acceso a esta evaluación ha finalizado.'
            using errcode = '22023';
    end if;

    return new;
end;
$$;

drop trigger if exists trg_evaluacion_ventana_acceso on public.intento_evaluacion;
create trigger trg_evaluacion_ventana_acceso
    before insert on public.intento_evaluacion
    for each row execute function public.fn_evaluacion_validar_ventana_acceso();

-- Function solo de trigger: no se revoca EXECUTE a PUBLIC porque PostgreSQL
-- no exige privilegio adicional al disparar el trigger (y un revoke podria
-- dejar la barrera inactiva). No devuelve datos sensibles.

-- ---------- SELECT de estudiantes (antes solo en la BD en vivo) ----------
drop policy if exists pol_evaluacion_select on public.evaluacion;
create policy pol_evaluacion_select on public.evaluacion
    for select to authenticated
    using (
        exists (
            select 1 from public.actividad a
             where a.id = evaluacion.actividad_id
               and (
                    public.app_es_docente_del_curso(a.curso_id)
                    or public.app_is_admin()
                    or a.publicado = true
                    or exists (
                        select 1 from public.intento_evaluacion ie
                         where ie.evaluacion_id = evaluacion.id
                           and ie.estudiante_id = public.efectivo_user_id()
                    )
               )
        )
    );

commit;
