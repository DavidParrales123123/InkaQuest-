-- Eliminar motores no comunes (motor no es generico) y sus juegos.
-- Conserva SOLO los 4 motores con es_comun = true:
--   arrastrar-soltar, emparejamiento, memoria, quiz-rapido.
--
-- ON DELETE CASCADE del esquema limpia:
--   juego (es_comun falso / creado_por null o cualquier origen)
--   motor_curso, configuracion_juego, version_motor, motor_comun
--   actividad_juego -> intento_juego -> resultado_juego, puntuacion_juego
--
-- Registra el evento en auditoría para que el admin vea qué pasó.

begin;

insert into public.registro_accion
    (codigo_evento, actor_id, entidad_tipo, accion, valor_nuevo, exito, correlation_id)
select 'motores_no_comunes_eliminados_bulk',
       null, 'motor', 'eliminar',
       jsonb_build_object('motores_eliminados', count(*),
                          'es_comun', false),
       true, gen_random_uuid()
  from public.motor
 where es_comun = false;

delete from public.motor where es_comun = false;

commit;
