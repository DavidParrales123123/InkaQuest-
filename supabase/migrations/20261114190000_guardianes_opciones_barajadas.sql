-- Corrección: las respuestas correctas nunca aparecen siempre en la opción A.
--
-- 1) El RPC de pregunta aleatoria baraja las opciones en cada entrega:
--    cada vez que el estudiante ve una pregunta, las alternativas rotan;
--    'correcta' sigue siendo texto exacto, así la calificación no cambia.
-- 2) Reequilibrio de los datos actuales: rotación cíclica del array de
--    opciones por una clave hasheada del id de cada pregunta (determinista,
--    uniforme en las 4 posiciones).

create or replace function public.guardianes_pregunta_aleatoria(
    p_nivel_id uuid,
    p_excluir  uuid[] default '{}'
)
returns table (pregunta_id uuid, enunciado text, opciones jsonb, tema text, dificultad text, tipo text)
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_caller uuid := public.efectivo_user_id();
begin
    if v_caller is null then
        raise exception 'Autenticación requerida.' using errcode = '42501';
    end if;

    -- Solo estudiantes matriculados en el curso dueño del nivel
    if not exists (
        select 1
          from public.matricula m
          join public.leccion l  on l.id = (select leccion_id from public.guardianes_nivel where id = p_nivel_id)
          join public.modulo  mu on mu.id = l.modulo_id
          join public.unidad  u  on u.id = mu.unidad_id
         where m.estudiante_id = v_caller
           and m.curso_id      = u.curso_id
           and m.estado in ('activa', 'completada')
    ) then
        raise exception 'No estás matriculado en este curso.' using errcode = '42501';
    end if;

    return query
        select p.id, p.enunciado,
               jsonb_agg(op order by random()) as opciones,
               p.tema, p.dificultad, p.tipo
          from public.guardianes_pregunta p
          cross join lateral jsonb_array_elements(p.opciones) as op
         where p.nivel_id = p_nivel_id
           and p.estado = 'validada'
           and p.opciones is not null
           and jsonb_array_length(p.opciones) >= 2
           and not (p.id = any (coalesce(p_excluir, '{}'::uuid[])))
         group by p.id, p.enunciado, p.tema, p.dificultad, p.tipo
         order by random()
         limit 1;
end;
$$;

comment on function public.guardianes_pregunta_aleatoria(uuid, uuid[]) is
    'Devuelve 1 pregunta validada del nivel (barajada en cada entrega; sin revelar la correcta). Excluye ids ya vistos.';

-- ── Reequilibrio de posiciones actuales (rotación cíclica por hash del id) ──
update public.guardianes_pregunta
   set opciones = case abs(('x' || substr(md5(id::text), 1, 8))::bit(32)::int) % 4
        when 0 then opciones
        when 1 then jsonb_build_array(opciones->>1, opciones->>2, opciones->>3, opciones->>0)
        when 2 then jsonb_build_array(opciones->>2, opciones->>3, opciones->>0, opciones->>1)
        when 3 then jsonb_build_array(opciones->>3, opciones->>0, opciones->>1, opciones->>2)
      end
 where jsonb_array_length(opciones) = 4;
