-- =============================================================================
-- MIGRACION 0001 - Extensiones, tipos enumerados y funciones base
-- -----------------------------------------------------------------------------
-- Objetivo: cimientos del esquema.
--   1. Extensiones requeridas (pgcrypto, pg_trgm, vector).
--   2. Todos los tipos ENUM del dominio (se crean aqui para que las
--      migraciones posteriores puedan referenciarlos).
--   3. Funciones base que resuelven el CONTEXTO DE AUTORIZACION.
--
-- CONTEXTO DE AUTORIZACION (clave de la integracion con Spring Boot)
-- -----------------------------------------------------------------
-- Spring Boot se conecta a PostgreSQL de forma DIRECTA, por lo que RLS no
-- conoce el usuario autenticado (a diferencia de PostgREST, que inyecta
-- auth.uid() a partir del JWT).
--
-- Estrategia implementada: contexto de transaccion (transaction-local GUC).
--   - El backend abre una transaccion y ejecuta:
--       SET LOCAL app.current_user_id    = '<uuid del usuario>';
--       SET LOCAL app.current_user_email = '<email>';
--   - Las politicas RLS consultan public.app_user_id() y public.app_user_role().
--   - El rol de base de datos usado por el backend tiene permiso SET sobre
--     esas variables; el resto de roles NO (ver migracion 0017).
--   - SET LOCAL muere al terminar la transaccion: no hay contaminación entre
--     peticiones, y el backend debe usarla para CADA operacion con datos de
--     usuario.
--   - El rol efectivo NO se toma de una variable de sesion (evitable por
--     spoofing): se deriva de public.perfil, dentro de la base de datos.
--
-- Para las llamadas directas desde Angular via PostgREST (anon/authenticated),
-- las politicas usan ademas auth.uid(), de modo que ambos caminos funcionan.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. EXTENSIONES
--    pgcrypto  -> gen_random_uuid(), digest() para codigos verificables
--    pg_trgm   -> busqueda difusa (catalogo de cursos, chatbot)
--    vector    -> embeddings para busqueda semantica del chatbot (opcional)
-- -----------------------------------------------------------------------------
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

do $$
begin
    create extension if not exists vector with schema extensions;
exception
    when others then
        raise notice 'pgvector no disponible en esta instancia; el chatbot usara busqueda por texto.';
end;
$$;


-- =============================================================================
-- 2. TIPOS ENUMERADOS
--    Un unico lugar para todos los dominios controlados.
-- =============================================================================

-- A. IDENTIDAD Y SEGURIDAD
do $$ begin create type public.rol_usuario as enum (
    'estudiante', 'docente', 'administrador'
); exception when duplicate_object then null; end $$;

do $$ begin create type public.estado_cuenta as enum (
    'pendiente_verificacion', 'activo', 'suspendido', 'eliminado'
); exception when duplicate_object then null; end $$;

do $$ begin create type public.estado_solicitud_docente as enum (
    'pendiente', 'en_revision', 'aprobada', 'rechazada'
); exception when duplicate_object then null; end $$;

-- B. GESTION ACADEMICA
do $$ begin create type public.estado_curso as enum (
    'borrador', 'en_revision', 'publicado', 'archivado'
); exception when duplicate_object then null; end $$;

do $$ begin create type public.tipo_contenido as enum (
    'texto', 'video', 'imagen', 'documento', 'enlace', 'quiz',
    'examen', 'reto', 'minijuego', 'foro', 'otro'
); exception when duplicate_object then null; end $$;

do $$ begin create type public.tipo_recurso as enum (
    'archivo', 'enlace', 'video', 'imagen', 'documento', 'otro'
); exception when duplicate_object then null; end $$;

-- C. MATRICULAS
do $$ begin create type public.estado_matricula as enum (
    'pendiente_pago', 'activa', 'completada', 'cancelada',
    'reembolsada', 'vencida'
); exception when duplicate_object then null; end $$;

-- D. PAGOS
do $$ begin create type public.estado_pedido as enum (
    'pendiente', 'pagado', 'procesando', 'cancelado', 'reembolsado', 'fallido'
); exception when duplicate_object then null; end $$;

do $$ begin create type public.estado_pago as enum (
    'iniciado', 'requiere_accion', 'autorizado', 'capturado',
    'fallido', 'reembolsado', 'anulado'
); exception when duplicate_object then null; end $$;

do $$ begin create type public.metodo_pago as enum (
    'tarjeta', 'transferencia', 'yape', 'plazo', 'otro'
); exception when duplicate_object then null; end $$;

do $$ begin create type public.estado_reembolso as enum (
    'solicitado', 'aprobado', 'rechazado', 'procesado'
); exception when duplicate_object then null; end $$;

do $$ begin create type public.tipo_descuento as enum (
    'porcentaje', 'monto_fijo', 'envio_gratis'
); exception when duplicate_object then null; end $$;

-- E. PROGRESO
do $$ begin create type public.estado_progreso as enum (
    'no_iniciado', 'en_progreso', 'completado'
); exception when duplicate_object then null; end $$;

-- F. ACTIVIDADES Y EVALUACIONES
do $$ begin create type public.tipo_actividad as enum (
    'lectura', 'video', 'tarea', 'quiz', 'examen', 'reto', 'minijuego', 'foro'
); exception when duplicate_object then null; end $$;

do $$ begin create type public.estado_entrega as enum (
    'borrador', 'enviado', 'en_revision', 'revisada', 'devuelta'
); exception when duplicate_object then null; end $$;

do $$ begin create type public.tipo_pregunta as enum (
    'opcion_unica', 'opcion_multiple', 'verdadero_falso',
    'respuesta_libre', 'codigo', 'orden_multiple'
); exception when duplicate_object then null; end $$;

do $$ begin create type public.estado_intento as enum (
    'iniciado', 'en_curso', 'entregado', 'expirado'
); exception when duplicate_object then null; end $$;

-- G. RETOS DE PROGRAMACION
do $$ begin create type public.nivel_dificultad as enum (
    'facil', 'media', 'dificil', 'extrema'
); exception when duplicate_object then null; end $$;

do $$ begin create type public.estado_envio as enum (
    'pendiente', 'ejecutando', 'evaluando', 'completado',
    'error_compilacion', 'tiempo_agotado', 'error_ejecucion'
); exception when duplicate_object then null; end $$;

do $$ begin create type public.estado_ejecucion as enum (
    'ok', 'error', 'timeout', 'memoria_excedida', 'error_compilacion'
); exception when duplicate_object then null; end $$;

-- H. MINIJUEGOS
do $$ begin create type public.estado_motor as enum (
    'activo', 'inactivo', 'deprecado'
); exception when duplicate_object then null; end $$;

do $$ begin create type public.estado_juego as enum (
    'borrador', 'publicado', 'archivado'
); exception when duplicate_object then null; end $$;

do $$ begin create type public.estado_intento_juego as enum (
    'iniciado', 'en_curso', 'completado', 'fallido', 'abandonado'
); exception when duplicate_object then null; end $$;

-- I. GAMIFICACION
do $$ begin create type public.tipo_recompensa as enum (
    'insignia', 'xp', 'moneda', 'cosmetic', 'certificado', 'descuento', 'item'
); exception when duplicate_object then null; end $$;

do $$ begin create type public.estado_temporada as enum (
    'programada', 'activa', 'finalizada'
); exception when duplicate_object then null; end $$;

do $$ begin create type public.tipo_mision as enum (
    'diaria', 'semanal', 'evento', 'permanente'
); exception when duplicate_object then null; end $$;

do $$ begin create type public.estado_mision as enum (
    'pendiente', 'en_progreso', 'completada', 'expirada', 'fallida'
); exception when duplicate_object then null; end $$;

do $$ begin create type public.concepto_xp as enum (
    'leccion_completada', 'actividad_completada', 'examen_aprobado',
    'reto_resuelto', 'minijuego_terminado', 'insignia', 'racha_diaria',
    'asistencia', 'curso_completado', 'mision', 'admin', 'ajuste'
); exception when duplicate_object then null; end $$;

-- K. NOTIFICACIONES Y SOPORTE
do $$ begin create type public.canal_notificacion as enum (
    'email', 'push', 'in_app', 'sms'
); exception when duplicate_object then null; end $$;

do $$ begin create type public.estado_notificacion as enum (
    'pendiente', 'enviada', 'fallida', 'leida'
); exception when duplicate_object then null; end $$;

do $$ begin create type public.estado_ticket as enum (
    'abierto', 'en_progreso', 'esperando_usuario', 'resuelto', 'cerrado'
); exception when duplicate_object then null; end $$;

do $$ begin create type public.prioridad_ticket as enum (
    'baja', 'media', 'alta', 'critica'
); exception when duplicate_object then null; end $$;

-- L. CHATBOT
do $$ begin create type public.rol_chatbot as enum (
    'usuario', 'asistente', 'sistema'
); exception when duplicate_object then null; end $$;

do $$ begin create type public.estado_conversacion as enum (
    'abierta', 'resuelta', 'cerrada', 'escalada'
); exception when duplicate_object then null; end $$;

do $$ begin create type public.origen_mensaje as enum (
    'usuario', 'asistente', 'sistema', 'documento'
); exception when duplicate_object then null; end $$;

do $$ begin create type public.estado_derivacion as enum (
    'abierta', 'atendida', 'cancelada'
); exception when duplicate_object then null; end $$;

-- M. AUDITORIA Y CONFIGURACION
do $$ begin create type public.tipo_accion as enum (
    'crear', 'leer', 'actualizar', 'eliminar', 'login', 'logout',
    'publicar', 'aprobar', 'rechazar', 'exportar', 'restaurar'
); exception when duplicate_object then null; end $$;

do $$ begin create type public.tipo_configuracion as enum (
    'string', 'number', 'boolean', 'json', 'fecha'
); exception when duplicate_object then null; end $$;


-- =============================================================================
-- 3. FUNCIONES BASE
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 3.1 Mantenimiento automatico de actualizado_en
-- -----------------------------------------------------------------------------
create or replace function public.fn_actualizar_timestamp()
returns trigger
language plpgsql
as $$
begin
    new.actualizado_en = now();
    return new;
end;
$$;


-- -----------------------------------------------------------------------------
-- 3.2 Identidad de la sesion actual
--     Lee el contexto de transaccion establecido por el backend.
--     Devuelve NULL si no hay contexto (p. ej. una sesion administrativa).
-- -----------------------------------------------------------------------------
create or replace function public.app_user_id()
returns uuid
language plpgsql
stable
set search_path = ''
as $$
declare
    v_raw text;
begin
    v_raw := current_setting('app.current_user_id', true);
    if v_raw is null or v_raw = '' then
        return null;
    end if;
    return v_raw::uuid;
exception
    when others then
        return null;
end;
$$;

comment on function public.app_user_id() is
    'UUID del usuario en el contexto de la transaccion actual (SET LOCAL app.current_user_id). NULL si no hay contexto.';


-- -----------------------------------------------------------------------------
-- 3.2.1 Contexto de escritura del sistema
--     Distingue "cambio de XP hecho por el motor de gamificacion" de
--     "cambio de XP hecho por el usuario". El flag solo puede activarlo el
--     codigo de confianza (funciones SECURITY DEFINER); el permiso SET sobre
--     la variable se revoca a PUBLIC en la migracion 0009, de modo que ni
--     'anon' ni 'authenticated' pueden activarlo por su cuenta.
-- -----------------------------------------------------------------------------
create or replace function public.fn_escritura_sistema()
returns boolean
language sql
stable
as $$
    select coalesce(current_setting('app.system_write', true), 'off') = 'on';
$$;

create or replace function public.fn_activar_escritura_sistema()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
    perform set_config('app.system_write', 'on', true);
end;
$$;

create or replace function public.fn_desactivar_escritura_sistema()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
    perform set_config('app.system_write', 'off', true);
end;
$$;

comment on function public.fn_escritura_sistema() is
    'TRUE si la escritura actual proviene del motor del sistema (gamificacion, aprobaciones).';


-- -----------------------------------------------------------------------------
-- 3.3 Rol efectivo: se deriva de la tabla perfil, NUNCA de una variable
--     de sesion que el cliente pudiera falsificar.
-- -----------------------------------------------------------------------------
create or replace function public.app_user_role()
returns public.rol_usuario
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
    v_user uuid;
    v_role public.rol_usuario;
begin
    v_user := public.app_user_id();
    if v_user is null then
        return null;
    end if;

    -- public.perfil se crea en la migracion 0002; esta funcion se define antes.
    if to_regclass('public.perfil') is null then
        return null;
    end if;

    select pr.rol into v_role
      from public.perfil pr
     where pr.id = v_user;

    return v_role;
exception
    when others then
        return null;
end;
$$;

comment on function public.app_user_role() is
    'Rol efectivo del usuario en contexto, leido desde public.perfil (no desde una variable de sesion).';


-- -----------------------------------------------------------------------------
-- 3.4 Utilidades de verificacion de rol
-- -----------------------------------------------------------------------------
create or replace function public.app_is_admin()
returns boolean
language sql
stable
as $$
    select coalesce(public.app_user_role() = 'administrador', false);
$$;

create or replace function public.app_is_docente()
returns boolean
language sql
stable
as $$
    select coalesce(public.app_user_role() = 'docente', false);
$$;

create or replace function public.app_is_estudiante()
returns boolean
language sql
stable
as $$
    select coalesce(public.app_user_role() = 'estudiante', false);
$$;


-- -----------------------------------------------------------------------------
-- 3.5 Identidad efectiva unificada
--     Cubre los dos caminos de acceso:
--       - Conexion directa de Spring Boot -> app.current_user_id
--       - Llamada via PostgREST con JWT     -> auth.uid()
--     Si ambos existen, la sesion de base de datos tiene prioridad.
-- -----------------------------------------------------------------------------
create or replace function public.efectivo_user_id()
returns uuid
language sql
stable
as $$
    select coalesce(
        public.app_user_id(),
        nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'sub', '')::uuid
    );
$$;

comment on function public.efectivo_user_id() is
    'UUID efectivo del usuario: contexto de transaccion (backend) o claims del JWT (PostgREST).';


-- -----------------------------------------------------------------------------
-- 3.6 Es el usuario docente del curso indicado
--     Se usa en todas las politicas de gestion academica.
-- -----------------------------------------------------------------------------
create or replace function public.app_es_docente_del_curso(p_curso_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
    -- La tabla docente_curso se crea en la migracion 0002; esta funcion se
    -- define antes. El guard to_regclass evita depender del orden de aplicado.
    if to_regclass('public.docente_curso') is null then
        return false;
    end if;

    return exists (
        select 1
          from public.docente_curso dc
         where dc.curso_id = p_curso_id
           and dc.docente_id = public.efectivo_user_id()
           and dc.activo
    );
exception
    when others then
        return false;
end;
$$;

comment on function public.app_es_docente_del_curso(uuid) is
    'TRUE si el usuario efectivo esta asignado como docente activo del curso.';


-- -----------------------------------------------------------------------------
-- 3.7 Es el usuario docente de la unidad/modulo/leccion indicados
--     Se resuelve por jerarquia (leccion -> modulo -> unidad -> curso).
-- -----------------------------------------------------------------------------
create or replace function public.app_es_docente_de_leccion(p_leccion_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
    v_unidad uuid;
    v_curso  uuid;
begin
    if to_regclass('public.leccion') is null
       or to_regclass('public.modulo') is null
       or to_regclass('public.unidad') is null then
        return false;
    end if;

    select m.unidad_id into v_unidad
      from public.leccion l
      join public.modulo m on m.id = l.modulo_id
     where l.id = p_leccion_id;

    select u.curso_id into v_curso
      from public.unidad u
     where u.id = v_unidad;

    return public.app_es_docente_del_curso(v_curso);
exception
    when others then
        return false;
end;
$$;


-- -----------------------------------------------------------------------------
-- 3.8 El usuario esta matriculado (y con acceso) en el curso
-- -----------------------------------------------------------------------------
create or replace function public.app_esta_matriculado(p_curso_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
    if to_regclass('public.matricula') is null then
        return false;
    end if;

    return exists (
        select 1
          from public.matricula m
         where m.curso_id = p_curso_id
           and m.estudiante_id = public.efectivo_user_id()
           and m.estado in ('activa', 'completada')
    );
exception
    when others then
        return false;
end;
$$;


-- =============================================================================
-- FIN DE LA MIGRACION 0001
-- =============================================================================
