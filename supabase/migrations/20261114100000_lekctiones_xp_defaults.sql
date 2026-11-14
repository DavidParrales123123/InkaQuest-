-- Senior-assigned XP defaults for lessons (all had xp_otorgado = 0, so students
-- never received XP / monedas for completing lekctiones even though the system
-- had a fully working fn_registrar_xp + trigger chain).
--
-- Rule (one-time, safe, auditable):
--   lesson title includes 'Examen Final' / 'Proyecto Final'          → 200 XP
--   'Práctica calificada' / 'Evaluación' / 'Evaluación Final'        → 100 XP
--   'Participación'                                                   → 120 XP
--   everything else                                                     → 60 XP
--
-- Lessons that ALREADY have XP > 0 are not touched.

update public.leccion
   set xp_otorgado = case
        when lower(titulo) like '%examen final%' or lower(titulo) like '%proyecto final%' then 200
        when lower(titulo) like '%práctica calificada%' or lower(titulo) like '%evaluación final%' then 100
        when lower(titulo) like '%evaluación%' then 100
        when lower(titulo) like '%participación%' or lower(titulo) like '%avance%' then 80
        else 60
       end
 where xp_otorgado = 0;

-- Backfill XP for lessons ALREADY completed before this migration.
do $$
declare
    r record;
begin
    for r in
        select pl.estudiante_id, pl.leccion_id, l.xp_otorgado as v_xp
          from public.progreso_leccion pl
          join public.leccion l on l.id = pl.leccion_id
         where pl.estado = 'completado'
           and l.xp_otorgado > 0
           and not exists (select 1 from public.transaccion_xp tx
                            where tx.usuario_id = pl.estudiante_id
                              and tx.concepto = 'leccion_completada'
                              and tx.referencia_tipo = 'leccion'
                              and tx.referencia_id = pl.leccion_id)
    loop
        perform public.fn_registrar_xp(
            r.estudiante_id, r.v_xp,
            'leccion_completada',
            'leccion', r.leccion_id
        );
    end loop;
end $$;
