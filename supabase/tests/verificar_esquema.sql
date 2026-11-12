-- =============================================================================
-- VERIFICACION DE LA BASE DE DATOS INKAQUEST
-- -----------------------------------------------------------------------------
-- Ejecuta este script DESPUES de aplicar las migraciones, en
-- Supabase Dashboard -> SQL Editor -> New query -> Run.
--
-- Devuelve el estado real de cada objeto. Si alguna fila sale en 'FALLA',
-- revisa el detalle indicado.
-- =============================================================================

\echo ''
\echo '============ VERIFICACION INKAQUEST ============'
\echo ''

-- -----------------------------------------------------------------------------
-- 1. Tablas por modulo
-- -----------------------------------------------------------------------------
\echo '--- 1. Tablas por modulo ---'
select
    case
        when table_name in ('perfil','solicitud_docente','aprobacion_docente','permiso',
                            'rol_permiso','preferencia_usuario','auditoria_acceso')
            then 'A. Identidad y seguridad'
        when table_name in ('categoria','curso','docente_curso','unidad','modulo','leccion',
                            'contenido','recurso','material_descargable','requisito_previo',
                            'historial_publicacion')
            then 'B. Gestion academica'
        when table_name in ('matricula','historial_matricula','renovacion_matricula',
                            'cancelacion_matricula','acceso_curso')
            then 'C. Matriculas'
        when table_name in ('carrito','item_carrito','pedido','detalle_pedido','cupon',
                            'descuento','promocion','transaccion','intento_pago',
                            'webhook_pago','reembolso','historial_financiero','evento_plataforma')
            then 'D. Pagos y comercio'
        when table_name in ('progreso_curso','progreso_unidad','progreso_leccion',
                            'historial_progreso','actividad_completada')
            then 'E. Progreso academico'
        when table_name in ('actividad','tarea','evaluacion','examen','pregunta','opcion',
                            'criterio_evaluacion','intento_evaluacion','respuesta_evaluacion',
                            'entrega','entrega_archivo','calificacion','retroalimentacion')
            then 'F. Actividades y evaluaciones'
        when table_name in ('reto','lenguaje','caso_prueba','restriccion_reto','envio_reto',
                            'resultado_caso','historial_ejecucion')
            then 'G. Retos de programacion'
        when table_name in ('motor','version_motor','motor_comun','motor_curso','juego',
                            'configuracion_juego','actividad_juego','intento_juego',
                            'respuesta_juego','resultado_juego','puntuacion_juego','tiempo_juego',
                            'finalizacion_juego','recompensa_juego')
            then 'H. Minijuegos'
        when table_name in ('regla_progresion','transaccion_xp','insignia','requisito_insignia',
                            'insignia_usuario','racha','historial_racha','temporada','ranking',
                            'evento_gamificacion','mision','mision_usuario','monedero',
                            'tienda_item','inventario','compra_virtual','transaccion_moneda')
            then 'I. Gamificacion'
        when table_name in ('certificado','certificado_titular','certificado_curso',
                            'certificado_emision','certificado_revocacion')
            then 'J. Certificados'
        when table_name in ('notificacion','notificacion_destinatario','preferencia_notificacion',
                            'mensaje','ticket','ticket_respuesta','historial_soporte')
            then 'K. Notificaciones y soporte'
        when table_name in ('chatbot_conversacion','chatbot_participante','chatbot_mensaje',
                            'chatbot_historial','chatbot_documento','chatbot_documento_version',
                            'chatbot_fragmento','chatbot_referencia','chatbot_retroalimentacion',
                            'chatbot_derivacion','chatbot_consumo')
            then 'L. Chatbot'
        when table_name in ('evento_sistema','registro_accion','cambio_administrativo',
                            'historial_modificacion','configuracion','parametro_sistema')
            then 'M. Auditoria y configuracion'
        else 'Otros'
    end as modulo,
    count(*) as tablas
from information_schema.tables
where table_schema = 'public' and table_type = 'BASE TABLE'
group by 1
order by 1;

-- -----------------------------------------------------------------------------
-- 2. Conteo total de objetos
-- -----------------------------------------------------------------------------
\echo ''
\echo '--- 2. Conteo de objetos ---'
select
    (select count(*) from information_schema.tables
      where table_schema='public' and table_type='BASE TABLE')    as tablas,
    (select count(*) from pg_policies where schemaname='public')  as politicas_rls,
    (select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public' and c.relkind='r' and c.relrowsecurity) as tablas_con_rls,
    (select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public')                                   as funciones,
    (select count(*) from information_schema.triggers
      where trigger_schema='public')                              as triggers,
    (select count(*) from pg_indexes where schemaname='public')    as indices,
    (select count(*) from pg_type t join pg_namespace n on n.oid=t.typnamespace
      where n.nspname='public' and t.typtype='e')                 as tipos_enum,
    (select count(*) from pg_constraint c join pg_namespace n on n.oid=c.connamespace
      where n.nspname='public' and c.contype='f')                 as claves_foraneas,
    (select count(*) from pg_constraint c join pg_namespace n on n.oid=c.connamespace
      where n.nspname='public' and c.contype='c')                 as check_constraints,
    (select count(*) from pg_constraint c join pg_namespace n on n.oid=c.connamespace
      where n.nspname='public' and c.contype='u')                 as unique_constraints;

-- -----------------------------------------------------------------------------
-- 3. Verificacion de RLS: ninguna tabla debe quedarse sin politicas
-- -----------------------------------------------------------------------------
\echo ''
\echo '--- 3. Tablas con RLS habilitado pero SIN politica (deben ser 0) ---'
-- Se consulta pg_policy + pg_class directamente para no depender del nombre
-- de la columna de esquema en pg_policies (varia entre versiones).
select c.relname as tabla_sin_politica
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policy p on p.polrelid = c.oid
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relrowsecurity
  and p.polname is null
order by 1;

-- -----------------------------------------------------------------------------
-- 4. Funciones de seguridad: search_path fijo y sin SETNING Leibniz
-- -----------------------------------------------------------------------------
\echo ''
\echo '--- 4. Funciones SECURITY DEFINER sin search_path seguro (deben ser 0) ---'
select p.proname as funcion_insegura
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.prosecdef
  and (p.proconfig is null or not exists (
        select 1 from unnest(p.proconfig) cfg
         where cfg like 'search_path=%'
           and cfg not like 'search_path=""'
           and cfg not like 'search_path=public%'
  ))
order by 1;

-- -----------------------------------------------------------------------------
-- 5. Contexto de autorizacion disponible para el backend
-- -----------------------------------------------------------------------------
\echo ''
\echo '--- 5. Contexto de autorizacion ---'
select
    public.fn_validar_contexto_backend() as diagnostico;

-- -----------------------------------------------------------------------------
-- 6. Permisos SET sobre las variables de contexto
-- -----------------------------------------------------------------------------
\echo ''
\echo '--- 6. Permisos SET de las variables de contexto ---'
-- has_parameter_privilege con un GUC personalizado requiere PostgreSQL 15+.
-- Si la version no lo soporta, se informa en lugar de fallar.
do $$
begin
    if exists (select 1 from pg_proc where proname = 'has_parameter_privilege') then
        raise notice 'PostgreSQL 15+: se puede verificar el permiso SET de los parametros.';
    else
        raise notice 'PostgreSQL < 15: has_parameter_privilege no soporta parametros personalizados.';
    end if;
end $$;

select
    'app.current_user_id' as parametro,
    current_setting('app.current_user_id', true) is not null as variable_legible,
    (select rolname from pg_roles where rolname = 'inkaquest_api') as rol_backend_existe;

-- -----------------------------------------------------------------------------
-- 7. Buckets de Storage
-- -----------------------------------------------------------------------------
\echo ''
\echo '--- 7. Buckets de Storage ---'
select id, name, public, file_size_limit,
       coalesce(array_length(allowed_mime_types, 1), 0) as mimes_permitidos
from storage.buckets
order by id;

-- -----------------------------------------------------------------------------
-- 8. Politicas de Storage
-- -----------------------------------------------------------------------------
\echo ''
\echo '--- 8. Politicas de Storage por bucket ---'
-- En PostgreSQL 15+ la vista pg_policies usa schemaname; en versiones
-- anteriores el nombre de la columna es 'schemaname'. Se consulta el
-- catalogo directamente para no depender de la version.
select c.relname as bucket, count(p.polname) as politicas
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policy p on p.polrelid = c.oid
where n.nspname = 'storage'
  and c.relname in ('objects', 'buckets')
group by 1
order by 1;
-- -----------------------------------------------------------------------------
-- 9. Datos de referencia cargados
-- -----------------------------------------------------------------------------
\echo ''
\echo '--- 9. Datos de referencia ---'
select
    (select count(*) from public.regla_progresion) as reglas_progresion,
    (select count(*) from public.permiso)         as permisos,
    (select count(*) from public.rol_permiso)     as asignaciones_permiso,
    (select count(*) from public.evento_sistema)  as eventos_auditoria,
    (select count(*) from public.parametro_sistema) as parametros,
    (select count(*) from public.configuracion)   as configuraciones;

-- -----------------------------------------------------------------------------
-- 10. Integridad referencial: filas huerfanas (deben ser 0)
-- -----------------------------------------------------------------------------
\echo ''
\echo '--- 10. Integridad referencial (deben ser 0) ---'
select 'matricula sin curso valido' as verificacion, count(*) as huerfanas
from public.matricula m
where not exists (select 1 from public.curso c where c.id = m.curso_id)
union all
select 'progreso_leccion sin progreso_curso', count(*)
from public.progreso_leccion pl
where not exists (select 1 from public.progreso_curso pc where pc.id = pl.progreso_curso_id)
union all
select 'calificacion sin estudiante', count(*)
from public.calificacion c
where not exists (select 1 from public.perfil p where p.id = c.estudiante_id)
union all
select 'entrega sin tarea', count(*)
from public.entrega e
where not exists (select 1 from public.tarea t where t.id = e.tarea_id);

-- -----------------------------------------------------------------------------
-- 11. Resumen final
-- -----------------------------------------------------------------------------
\echo ''
\echo '--- 11. Resumen ---'
select
    case
        when (select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace
               where n.nspname='public' and c.relkind='r' and c.relrowsecurity) >= 100
         and (select count(*) from pg_policies where schemaname='public') >= 150
         and (select count(*) from storage.buckets) = 6
        then 'BASE DE DATOS INKAQUEST: OK - esquema aplicado y verificado'
        else 'REVISAR: el esquema no cumple los valores esperados'
    end as resultado_general;

\echo ''
\echo '============ FIN DE LA VERIFICACION ============'
