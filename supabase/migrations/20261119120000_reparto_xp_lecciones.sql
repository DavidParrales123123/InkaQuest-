-- =============================================================================
-- Reparto de XP: cada curso suma EXACTAMENTE su xp_total repartido entre sus
-- lecciones. Regla por dificultad/profundidad:
--   peso 4   → "Práctica Calificada|Proyecto Final|Evaluación Final|Examen Final|Informe Final"
--   peso 2   → otra "Evaluación|Examen"
--   peso 1.5 → "Repaso|Taller"
--   peso 1   → resto
-- Distribución proporcional a peso; el residuo se reparte 1 XP a las lecciones
-- con mayor fracción decimal hasta cuadrar EXACTAMENTE xp_total.
-- =============================================================================

do $$
declare
  r_curso        record;
  v_total_weight numeric;
  v_resid        integer;
begin
  for r_curso in select id, slug, xp_total from public.curso order by slug loop

    -- Suma de pesos del curso
    select coalesce(sum(case
             when l.titulo ~* '(Proyecto Final|Examen Final|Evaluaci[oó]n Final|Informe Final|Pr[aá]ctica Calificada)' then 4
             when l.titulo ~* '(Evaluaci[oó]n|Examen)' then 2
             when l.titulo ~* '(Repaso|Taller)' then 1.5
             else 1.0
           end), 1.0)
      into v_total_weight
      from public.leccion l
      join public.modulo m on m.id = l.modulo_id
      join public.unidad u on u.id = m.unidad_id
     where u.curso_id = r_curso.id;

    if v_total_weight <= 0 then
      v_total_weight := 1.0;
    end if;

    -- Paso 1: valor base = floor(xp_total * peso / sum_peso)
    with base as (
      select l.id,
             floor(r_curso.xp_total * (
               case
                 when l.titulo ~* '(Proyecto Final|Examen Final|Evaluaci[oó]n Final|Informe Final|Pr[aá]ctica Calificada)' then 4
                 when l.titulo ~* '(Evaluaci[oó]n|Examen)' then 2
                 when l.titulo ~* '(Repaso|Taller)' then 1.5
                 else 1.0
               end
             ) / v_total_weight)::integer as xp_base
        from public.leccion l
        join public.modulo m on m.id = l.modulo_id
        join public.unidad u on u.id = m.unidad_id
       where u.curso_id = r_curso.id
    )
    update public.leccion l set xp_otorgado = b.xp_base
      from base b
     where l.id = b.id;

    -- Residuo exacto = xp_total - sum(floor(xp_raw))
    select r_curso.xp_total - coalesce(sum(l.xp_otorgado), 0)
      into v_resid
      from public.leccion l
      join public.modulo m on m.id = l.modulo_id
      join public.unidad u on u.id = m.unidad_id
     where u.curso_id = r_curso.id;

    if v_resid > 0 then
      -- Paso 2: +1 XP a las v_resid lecciones con mayor fracción decimal
      with w as (
        select l.id,
               r_curso.xp_total * (
                 case
                   when l.titulo ~* '(Proyecto Final|Examen Final|Evaluaci[oó]n Final|Informe Final|Pr[aá]ctica Calificada)' then 4
                   when l.titulo ~* '(Evaluaci[oó]n|Examen)' then 2
                   when l.titulo ~* '(Repaso|Taller)' then 1.5
                   else 1.0
                 end
               ) / v_total_weight as xp_raw
          from public.leccion l
          join public.modulo m on m.id = l.modulo_id
          join public.unidad u on u.id = m.unidad_id
         where u.curso_id = r_curso.id
      ),
      ranked as (
        select id,
               row_number() over (order by (xp_raw - floor(xp_raw)) desc, id) as rn
          from w
      )
      update public.leccion l
         set xp_otorgado = xp_otorgado + 1
        from ranked r
       where l.id = r.id
         and r.rn <= v_resid;
    end if;

  end loop;
end $$;
