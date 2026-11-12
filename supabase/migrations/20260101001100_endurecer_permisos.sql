-- =============================================================================
-- MIGRACION 0011 - Endurecer permisos: revocar a 'anon' y a 'authenticated'
--                   lo que no corresponde
-- -----------------------------------------------------------------------------
-- Corrige un hallazgo de la verificacion EN SUPABASE REAL (no aparecia en el
-- PostgreSQL local de validacion).
--
-- CAUSA RAIZ
-- Supabase define "default privileges" para el esquema public:
--
--   anon=arwdDxtm/postgres, authenticated=arwdDxtm/postgres, ...
--
-- Es decir, CADA tabla creada hereda TODOS los permisos (a=INSERT, r=SELECT,
-- w=UPDATE, d=DELETE, D=TRUNCATE, x=REFERENCES, t=TRIGGER) para 'anon' y
-- 'authenticated'. La migracion 0007 hacia GRANT SELECT explicito, pero nunca
-- REVOKE de 'anon': el permiso por defecto seabria ya.
--
-- IMPACTO
-- La RLS impide leer filas privadas (las politicas devuelven 0 filas), pero
-- 'anon' conservaba permisos INSERT/UPDATE/DELETE sobre tablas que no le
-- pertenecen. Es defensa en profundidad: si una politica cambiara por error,
-- el permiso no seria la unica barrera.
--
-- Lo que hace esta migracion:
--   1. 'anon' NO conserva NINGUN permiso sobre las tablas privadas.
--   2. 'anon' solo mantiene SELECT sobre las 15 tablas de catalogo publico.
--   3. 'authenticated' conserva SELECT en todo, pero la escritura queda
--      limitada a las tablas donde el cliente realmente escribe.
--   4. 'service_role' conserva todo (ignora RLS; es el backend).
--
-- Las tablas de escritura del cliente son exactamente las que el frontend
-- necesita: carrito, pedidos, matricula, entregas, intentos, progreso,
-- mensajes, tickets, chatbot, preferencias.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Tablas donde 'anon' NO debe tener NINGUN permiso
-- -----------------------------------------------------------------------------
do $$
declare
    t text;
begin
    foreach t in array array[
        -- A. Identidad
        'perfil', 'solicitud_docente', 'aprobacion_docente', 'preferencia_usuario',
        'auditoria_acceso',
        -- B. Academico (gestion del docente)
        'categoria', 'curso', 'docente_curso', 'unidad', 'modulo', 'leccion',
        'contenido', 'recurso', 'material_descargable', 'requisito_previo',
        'historial_publicacion',
        -- C. Matriculas
        'matricula', 'historial_matricula', 'renovacion_matricula',
        'cancelacion_matricula', 'acceso_curso',
        -- D. Pagos
        'carrito', 'item_carrito', 'pedido', 'detalle_pedido', 'cupon', 'descuento',
        'promocion', 'transaccion', 'intento_pago', 'webhook_pago', 'reembolso',
        'historial_financiero', 'evento_plataforma',
        -- E. Progreso
        'progreso_curso', 'progreso_unidad', 'progreso_leccion',
        'historial_progreso', 'actividad_completada',
        -- F. Evaluaciones
        'actividad', 'tarea', 'evaluacion', 'examen', 'pregunta', 'opcion',
        'criterio_evaluacion', 'intento_evaluacion', 'respuesta_evaluacion',
        'entrega', 'entrega_archivo', 'calificacion', 'retroalimentacion',
        -- G. Retos
        'reto', 'lenguaje', 'caso_prueba', 'restriccion_reto', 'envio_reto',
        'resultado_caso', 'historial_ejecucion',
        -- H. Minijuegos
        'motor', 'version_motor', 'motor_comun', 'motor_curso', 'juego',
        'configuracion_juego', 'actividad_juego', 'intento_juego',
        'respuesta_juego', 'resultado_juego', 'puntuacion_juego', 'tiempo_juego',
        'finalizacion_juego', 'recompensa_juego',
        -- I. Gamificacion
        'regla_progresion', 'transaccion_xp', 'insignia', 'requisito_insignia',
        'insignia_usuario', 'racha', 'historial_racha', 'temporada', 'ranking',
        'evento_gamificacion', 'mision', 'mision_usuario', 'monedero',
        'tienda_item', 'inventario', 'compra_virtual', 'transaccion_moneda',
        -- J. Certificados
        'certificado', 'certificado_titular', 'certificado_curso',
        'certificado_emision', 'certificado_revocacion',
        -- K. Soporte
        'notificacion', 'notificacion_destinatario', 'preferencia_notificacion',
        'mensaje', 'ticket', 'ticket_respuesta', 'historial_soporte',
        -- L. Chatbot
        'chatbot_conversacion', 'chatbot_participante', 'chatbot_mensaje',
        'chatbot_historial', 'chatbot_documento', 'chatbot_documento_version',
        'chatbot_fragmento', 'chatbot_referencia', 'chatbot_retroalimentacion',
        'chatbot_derivacion', 'chatbot_consumo',
        -- M. Auditoria
        'evento_sistema', 'registro_accion', 'cambio_administrativo',
        'historial_modificacion', 'configuracion', 'parametro_sistema',
        -- RBAC
        'permiso', 'rol_permiso'
    ] loop
        execute format('revoke all on table public.%I from anon', t);
    end loop;
end $$;

-- -----------------------------------------------------------------------------
-- 2. 'anon' conserva SOLO lectura sobre el catalogo publico
-- -----------------------------------------------------------------------------
grant select on
    public.categoria,
    public.curso,
    public.unidad,
    public.modulo,
    public.leccion,
    public.contenido,
    public.recurso,
    public.material_descargable,
    public.motor,
    public.version_motor,
    public.juego,
    public.configuracion_juego,
    public.certificado,
    public.certificado_titular,
    public.certificado_curso
to anon;

-- -----------------------------------------------------------------------------
-- 3. 'authenticated': lectura universal, escritura solo donde corresponde
-- -----------------------------------------------------------------------------
grant select on all tables in schema public to authenticated;

-- Tablas donde el cliente escribe (el resto queda en solo lectura).
do $$
declare
    t text;
begin
    foreach t in array array[
        'carrito', 'item_carrito', 'pedido', 'detalle_pedido',
        'matricula', 'entrega', 'entrega_archivo',
        'intento_evaluacion', 'respuesta_evaluacion',
        'progreso_curso', 'progreso_unidad', 'progreso_leccion',
        'historial_progreso', 'actividad_completada',
        'envio_reto', 'intento_juego', 'respuesta_juego',
        'mensaje', 'ticket', 'ticket_respuesta',
        'chatbot_conversacion', 'chatbot_mensaje', 'chatbot_retroalimentacion',
        'solicitud_docente', 'preferencia_usuario', 'preferencia_notificacion',
        'notificacion_destinatario', 'historial_soporte',
        'certificado', 'certificado_titular', 'certificado_curso',
        'retroalimentacion'
    ] loop
        execute format('grant insert, update, delete on table public.%I to authenticated', t);
    end loop;
end $$;

-- Tablas que el docente administra (contenido pedagogico y evaluaciones).
do $$
declare
    t text;
begin
    foreach t in array array[
        'categoria', 'curso', 'unidad', 'modulo', 'leccion', 'contenido',
        'recurso', 'material_descargable',
        'actividad', 'tarea', 'evaluacion', 'examen', 'pregunta', 'opcion',
        'criterio_evaluacion',
        'reto', 'lenguaje', 'caso_prueba', 'restriccion_reto',
        'motor', 'version_motor', 'motor_comun', 'motor_curso',
        'juego', 'configuracion_juego', 'actividad_juego'
    ] loop
        execute format('grant insert, update, delete on table public.%I to authenticated', t);
    end loop;
end $$;

-- Calificacion: solo UPDATE (el docente califica; no se inserta desde el cliente).
-- Se revocan INSERT y DELETE heredados de los default privileges: una
-- calificacion no se crea ni se borra desde el cliente, solo se corrige.
revoke insert, delete, truncate, references, trigger on public.calificacion from authenticated;
grant update on public.calificacion to authenticated;

grant insert on public.retroalimentacion to authenticated;
revoke delete on public.retroalimentacion from authenticated;

-- -----------------------------------------------------------------------------
-- 4. 'service_role' conserva el acceso total (lo usa el backend)
-- -----------------------------------------------------------------------------
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;

-- -----------------------------------------------------------------------------
-- 5. Verificacion: 'anon' no debe tener permisos de escritura en ninguna tabla
--    que contenga datos privados.
-- -----------------------------------------------------------------------------
do $$
declare
    v_count integer;
    v_list  text;
begin
    select count(*), string_agg(distinct table_name, ', ')
      into v_count, v_list
      from information_schema.role_table_grants
     where grantee = 'anon'
       and privilege_type in ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER');

    if v_count > 0 then
        raise notice 'anon todavia tiene permisos de escritura en: %', v_list;
    else
        raise notice 'OK: anon no tiene permisos de escritura en ninguna tabla.';
    end if;
end $$;

-- =============================================================================
-- FIN DE LA MIGRACION 0011
-- =============================================================================
