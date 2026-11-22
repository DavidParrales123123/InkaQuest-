-- Una entrega por tarea y estudiante.
-- El servicio listarTareasCurso resuelve la relacion embedida con entrega[0]
-- y obtenerEntregaDeEstudiante usa maybeSingle(): dos filas hacen que el envio
-- falle o que se clasifique con una nota/timestamp obsoletos.
-- Produccion tenia 1 fila y 1 combinacion unica, asi que el constraint es seguro.

begin;

alter table public.entrega
    drop constraint if exists entrega_tarea_estudiante_uniq;

alter table public.entrega
    add constraint entrega_tarea_estudiante_uniq unique (tarea_id, estudiante_id);

commit;
