-- =============================================================================
-- InkaQuest - Migración 20261126000000
-- Escala de calificación única: 0 a 20.
--
-- Cambia SOLO lo que es nota/calificación:
--   evaluacion.nota_maxima, evaluacion.porcentaje_aprobacion (ahora nota mínima sobre 20),
--   tarea.nota_maxima, calificacion.nota / nota_maxima, entrega.nota.
-- NO toca progreso de curso, precisión de Guardianes, porcentajes de pago ni XP.
-- =============================================================================

begin;

-- 1) Convertir datos existentes ANTES de poner las restricciones nuevas.
update public.evaluacion
   set nota_maxima = 20,
       porcentaje_aprobacion = least(20, round(porcentaje_aprobacion / 5.0, 2))
 where nota_maxima <> 20 or porcentaje_aprobacion > 20;

update public.tarea set nota_maxima = 20 where nota_maxima <> 20;

update public.calificacion set nota = least(20, round(nota / 5.0, 2)) where nota_maxima > 20;
update public.calificacion set nota_maxima = 20 where nota_maxima <> 20;
update public.entrega set nota = least(20, round(nota / 5.0, 2)) where nota > 20;

-- 2) Nuevos defaults y restricciones (0 a 20).
alter table public.evaluacion alter column nota_maxima set default 20;
alter table public.evaluacion alter column porcentaje_aprobacion set default 12;
alter table public.evaluacion add constraint evaluacion_nota_maxima_20_check
    check (nota_maxima between 0 and 20);
alter table public.evaluacion add constraint evaluacion_aprobacion_20_check
    check (porcentaje_aprobacion between 0 and 20);

alter table public.tarea alter column nota_maxima set default 20;
alter table public.tarea add constraint tarea_nota_maxima_20_check
    check (nota_maxima between 0 and 20);

alter table public.calificacion alter column nota_maxima set default 20;
alter table public.calificacion add constraint calificacion_nota_maxima_20_check
    check (nota_maxima between 0 and 20);
alter table public.calificacion add constraint calificacion_nota_20_check
    check (nota between 0 and 20);

comment on column public.evaluacion.porcentaje_aprobacion is
    'Nota mínima sobre 20 para aprobar la evaluación (antes era porcentaje 0-100).';

commit;

notify pgrst, 'reload schema';
