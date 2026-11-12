-- =============================================================================
-- LIMPIEZA de datos de prueba
-- -----------------------------------------------------------------------------
-- Elimina TODO lo que dejaron las pruebas RLS (supabase/tests/pruebas_rls.sql).
-- Es seguro ejecutarlo: solo toca filas con el patron de correo de prueba
-- 'test\_%@inkaquest.test' y los objetos creados por esas pruebas.
--
-- Ejecutar en Supabase -> SQL Editor -> New query
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Tablas dependientes (orden inverso al de creacion)
-- -----------------------------------------------------------------------------
delete from public.calificacion where estudiante_id in (
    select id from public.perfil where email like 'test\_%@inkaquest.test');

delete from public.entrega_archivo where entrega_id in (
    select e.id from public.entrega e
     join public.tarea t on t.id = e.tarea_id
     join public.actividad a on a.id = t.actividad_id
    where a.titulo = 'Actividad de prueba');

delete from public.entrega where tarea_id in (
    select t.id from public.tarea t
     join public.actividad a on a.id = t.actividad_id
    where a.titulo = 'Actividad de prueba');

delete from public.opcion where pregunta_id in (
    select p.id from public.pregunta p
      join public.evaluacion e on e.id = p.evaluacion_id
      join public.actividad a on a.id = e.actividad_id
    where a.titulo = 'Actividad de prueba');

delete from public.pregunta where evaluacion_id in (
    select e.id from public.evaluacion e
      join public.actividad a on a.id = e.actividad_id
    where a.titulo = 'Actividad de prueba');

delete from public.criterio_evaluacion where evaluacion_id in (
    select e.id from public.evaluacion e
      join public.actividad a on a.id = e.actividad_id
    where a.titulo = 'Actividad de prueba');

delete from public.evaluacion where actividad_id in (
    select id from public.actividad where titulo = 'Actividad de prueba');

delete from public.tarea where actividad_id in (
    select id from public.actividad where titulo = 'Actividad de prueba');

delete from public.actividad where titulo = 'Actividad de prueba';

delete from public.caso_prueba where reto_id in (
    select id from public.reto where titulo = 'Reto de prueba');

delete from public.reto where titulo = 'Reto de prueba';

delete from public.insignia_usuario where insignia_id in (
    select id from public.insignia where codigo = 'PRUEBA');

delete from public.insignia where codigo = 'PRUEBA';

-- Gamificacion y progreso del usuario de prueba
delete from public.transaccion_xp where usuario_id in (
    select id from public.perfil where email like 'test\_%@inkaquest.test');

delete from public.insignia_usuario where usuario_id in (
    select id from public.perfil where email like 'test\_%@inkaquest.test');

delete from public.progreso_leccion where estudiante_id in (
    select id from public.perfil where email like 'test\_%@inkaquest.test');

delete from public.historial_racha where usuario_id in (
    select id from public.perfil where email like 'test\_%@inkaquest.test');

delete from public.racha where usuario_id in (
    select id from public.perfil where email like 'test\_%@inkaquest.test');

delete from public.mision_usuario where usuario_id in (
    select id from public.perfil where email like 'test\_%@inkaquest.test');

delete from public.transaccion_moneda where usuario_id in (
    select id from public.perfil where email like 'test\_%@inkaquest.test');

delete from public.monedero where usuario_id in (
    select id from public.perfil where email like 'test\_%@inkaquest.test');

delete from public.inventario where usuario_id in (
    select id from public.perfil where email like 'test\_%@inkaquest.test');

delete from public.actividad_completada where estudiante_id in (
    select id from public.perfil where email like 'test\_%@inkaquest.test');

delete from public.progreso_unidad where estudiante_id in (
    select id from public.perfil where email like 'test\_%@inkaquest.test');

delete from public.progreso_curso where estudiante_id in (
    select id from public.perfil where email like 'test\_%@inkaquest.test');

delete from public.historial_progreso where estudiante_id in (
    select id from public.perfil where email like 'test\_%@inkaquest.test');

-- Pagos
delete from public.transaccion where usuario_id in (
    select id from public.perfil where email like 'test\_%@inkaquest.test');

delete from public.detalle_pedido where pedido_id in (
    select id from public.pedido where numero = 'PED-PRUEBA-1');

delete from public.pedido where numero = 'PED-PRUEBA-1';

-- Matriculas (el progreso_curso la referencia, por eso va despues)
delete from public.historial_matricula where matricula_id in (
    select id from public.matricula where estudiante_id in (
        select id from public.perfil where email like 'test\_%@inkaquest.test'));

delete from public.acceso_curso where usuario_id in (
    select id from public.perfil where email like 'test\_%@inkaquest.test');

delete from public.matricula where estudiante_id in (
    select id from public.perfil where email like 'test\_%@inkaquest.test');

-- Catalogo academico de prueba
delete from public.docente_curso where docente_id in (
    select id from public.perfil where email like 'test\_%@inkaquest.test');

delete from public.leccion where titulo = 'Leccion 1';
delete from public.modulo where titulo = 'Modulo 1';
delete from public.unidad where titulo = 'Unidad 1';
delete from public.curso where slug = 'curso-de-prueba';
delete from public.categoria where slug = 'prueba';

-- Usuarios de prueba (auth.users tiene ON DELETE CASCADE hacia perfil)
delete from auth.users where email like 'test\_%@inkaquest.test';
delete from public.perfil where email like 'test\_%@inkaquest.test';

-- Tabla auxiliar de pruebas (por si quedo)
drop table if exists public._prueba_resultado;
drop function if exists public._registrar_prueba(text, text, text);
drop function if exists public._calif_no_cambio(uuid, numeric);

-- -----------------------------------------------------------------------------
-- 2. Verificacion
-- -----------------------------------------------------------------------------
select
    (select count(*) from public.perfil
      where email like 'test\_%@inkaquest.test')            as perfiles_test,
    (select count(*) from auth.users
      where email like 'test\_%@inkaquest.test')            as usuarios_auth_test,
    (select count(*) from public.curso
      where slug = 'curso-de-prueba')                       as cursos_test,
    (select count(*) from public.insignia
      where codigo = 'PRUEBA')                               as insignias_test,
    (select count(*) from information_schema.tables
      where table_name = '_prueba_resultado')               as tablas_auxiliares;
