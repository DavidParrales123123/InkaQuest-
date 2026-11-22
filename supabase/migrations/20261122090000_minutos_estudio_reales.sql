-- =============================================================================
-- Minutos de estudio: dejar de acumular 0
-- -----------------------------------------------------------------------------
-- 1) Las 352 lecciones tienen duracion_minutos = 0 (las sembraron solo con XP),
--    asi que completar una leccion sumaba 0 minutos en progreso_curso.
-- 2) fn_registrar_completado_leccion usaba greatest(pc.minutos_estudio,
--    v_minutos) -> MAXIMO, no suma, y todos sus llamadores pasan 0.
-- 3) Backfill de las 9 lecciones ya completadas (todas a 0) con el minimo
--    documentado de 1 minuto por leccion, y recalculo del total por curso.
--
-- El backend REST ahora acepta minutos medidos por el cliente (con minimo 1).
-- =============================================================================

begin;

-- ---------- 1. Backfill historico ----------
update public.progreso_leccion
   set minutos_estudio = 1
 where coalesce(minutos_estudio, 0) = 0
   and estado = 'completado';

update public.progreso_curso pc
   set minutos_estudio = coalesce((
         select sum(pl.minutos_estudio)
           from public.progreso_leccion pl
          where pl.progreso_curso_id = pc.id
       ), 0)
 where pc.minutos_estudio = 0;

-- ---------- 2. RPC de guardianes: minimo 1 y SUMA por curso ----------
create or replace function public.fn_registrar_completado_leccion(
    p_estudiante_id uuid,
    p_curso_id       uuid,
    p_leccion_id     uuid,
    p_minutos        integer default 0
)
returns numeric
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := public.efectivo_user_id();
  v_matricula_id uuid;
  v_progreso_curso_id uuid;
  v_total_lecciones integer := 0;
  v_completadas integer := 0;
  v_porcentaje numeric := 0;
  v_minutos integer := greatest(coalesce(p_minutos, 0), 1);
begin
  if v_user is null or v_user <> p_estudiante_id then
    raise exception 'No autorizado para registrar progreso de otro usuario';
  end if;

  select m.id into v_matricula_id
  from public.matricula m
  where m.estudiante_id = p_estudiante_id
    and m.curso_id = p_curso_id
    and m.estado = 'activa'
  limit 1;

  if v_matricula_id is null then
    raise exception 'No existe una matrícula activa para este curso';
  end if;

  if not exists (
    select 1
    from public.leccion l
    join public.modulo mo on mo.id = l.modulo_id
    join public.unidad u on u.id = mo.unidad_id
    where l.id = p_leccion_id
      and u.curso_id = p_curso_id
  ) then
    raise exception 'La lección no pertenece al curso indicado';
  end if;

  insert into public.progreso_curso (
    matricula_id, estudiante_id, curso_id, estado, porcentaje, lecciones_completadas, minutos_estudio, iniciado_en, ultima_actividad_en
  )
  values (
    v_matricula_id, p_estudiante_id, p_curso_id, 'en_progreso', 0, 0, 0, now(), now()
  )
  on conflict (matricula_id) do update
    set ultima_actividad_en = now(),
        estado = case when public.progreso_curso.estado = 'no_iniciado' then 'en_progreso'::public.estado_progreso else public.progreso_curso.estado end,
        actualizado_en = now()
  returning id into v_progreso_curso_id;

  insert into public.progreso_leccion (
    progreso_curso_id, leccion_id, estudiante_id, estado, porcentaje, xp_obtenido, minutos_estudio, iniciado_en, completado_en, actualizado_en
  )
  values (
    v_progreso_curso_id, p_leccion_id, p_estudiante_id, 'completado', 100, 0, v_minutos, now(), now(), now()
  )
  on conflict (progreso_curso_id, leccion_id) do update
    set estado = 'completado'::public.estado_progreso,
        porcentaje = 100,
        minutos_estudio = greatest(public.progreso_leccion.minutos_estudio, excluded.minutos_estudio),
        completado_en = coalesce(public.progreso_leccion.completado_en, now()),
        actualizado_en = now();

  select count(*)::int into v_total_lecciones
  from public.leccion l
  join public.modulo mo on mo.id = l.modulo_id
  join public.unidad u on u.id = mo.unidad_id
  where u.curso_id = p_curso_id;

  select count(*)::int into v_completadas
  from public.progreso_leccion pl
  where pl.progreso_curso_id = v_progreso_curso_id
    and pl.estado = 'completado';

  if v_total_lecciones > 0 then
    v_porcentaje := round((v_completadas::numeric * 100.0) / v_total_lecciones::numeric, 2);
  else
    v_porcentaje := 0;
  end if;

  update public.progreso_curso pc
  set lecciones_completadas = v_completadas,
      porcentaje = least(v_porcentaje, 100),
      -- Antes: greatest(pc.minutos_estudio, v_minutos) -> nunca acumulaba.
      minutos_estudio = coalesce((
        select sum(pl.minutos_estudio)
          from public.progreso_leccion pl
         where pl.progreso_curso_id = pc.id
      ), 0),
      ultima_actividad_en = now(),
      actualizado_en = now(),
      estado = case
        when v_total_lecciones > 0 and v_completadas >= v_total_lecciones then 'completado'::public.estado_progreso
        else 'en_progreso'::public.estado_progreso
      end,
      completado_en = case
        when v_total_lecciones > 0 and v_completadas >= v_total_lecciones then coalesce(pc.completado_en, now())
        else pc.completado_en
      end
  where pc.id = v_progreso_curso_id;

  return least(v_porcentaje, 100);
end;
$$;

revoke all on function public.fn_registrar_completado_leccion(uuid, uuid, uuid, integer) from public, anon;
grant execute on function public.fn_registrar_completado_leccion(uuid, uuid, uuid, integer) to authenticated, service_role;

commit;
