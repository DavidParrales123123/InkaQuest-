-- =============================================================================
-- MIGRACION 0009 - Rol de backend, permisos de sesion y datos de referencia
-- -----------------------------------------------------------------------------
-- Depende de: 0001..0008
--
-- SEGURIDAD DEL CONTEXTO DE AUTORIZACION
-- El backend (Spring Boot) se conecta a PostgreSQL con un rol DEDICADO, no
-- con 'postgres' ni con 'service_role'. Ese rol:
--   - Puede SET sobre las variables de contexto (para-USAR el contexto).
--   - NO puede alterar el esquema ni las politicas (para NO saltarse la RLS).
--
-- El punto clave: PostgreSQL permite revocar el permiso SET sobre una variable
-- de sesion personalizada. Se revoca a PUBLIC y se concede solo al rol del
-- backend, de modo que ni 'anon' ni 'authenticated' pueden SUPLANTAR el
-- contexto de otro usuario.
--
-- La regla del rol NO se toma de una variable: se lee de public.perfil
-- (public.app_user_role()). Aunque alguien pudiera modificar la variable, el
-- rol efectivo seguiria siendo el de la base de datos.
--
-- COMO CREAR EL USUARIO DE CONEXION (ejecutar manualmente, con la clave real):
--   CREATE ROLE inkaquest_api LOGIN PASSWORD '<CLAVE_FUERTE>';
--   GRANT inkaquest_api TO authenticated;   -- solo si usa SET LOCAL ROLE
--   GRANT USAGE ON SCHEMA public TO inkaquest_api;
--   SELECT public.fn_validar_contexto_backend();
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Rol dedicado del backend
--    NOLOGIN: la clave la defines tu. El backend se conecta con este rol.
-- -----------------------------------------------------------------------------
do $$
begin
    if not exists (select 1 from pg_roles where rolname = 'inkaquest_api') then
        create role inkaquest_api nologin;
    end if;
end $$;

grant usage on schema public to inkaquest_api;

-- Permisos de lectura/escritura sobre las tablas. NO es superusuario:
-- no puede saltarse RLS ni alterar el esquema.
grant select, insert, update, delete on all tables in schema public to inkaquest_api;
grant usage, select on all sequences in schema public to inkaquest_api;

-- Permisos de ejecucion sobre las funciones de negocio.
grant execute on all functions in schema public to inkaquest_api;

-- Sin permiso para alterar el esquema ni las politicas.
revoke create on schema public from inkaquest_api;
revoke all on schema auth from inkaquest_api;


-- -----------------------------------------------------------------------------
-- 2. Permisos SET sobre las variables de contexto
--    Revocar a PUBLIC impide que anon/authenticated falseeen el contexto.
-- -----------------------------------------------------------------------------
do $$
begin
    -- Se revoca el SET a PUBLIC para las variables que transportan la
    -- identidad del usuario en la transaccion.
    execute 'revoke set on parameter app.current_user_id from public';
    execute 'revoke set on parameter app.current_user_email from public';
    execute 'revoke set on parameter app.current_user_rol from public';

    -- El backend si puede establecerlas.
    execute 'grant set on parameter app.current_user_id to inkaquest_api';
    execute 'grant set on parameter app.current_user_email to inkaquest_api';
    execute 'grant set on parameter app.current_user_rol to inkaquest_api';
exception
    when insufficient_privilege then
        raise notice 'No se pudieron ajustar los permisos SET de las variables de contexto. Revisa los privilegios del ejecutor.';
    when others then
        raise notice 'Permisos SET de contexto no aplicados: %', sqlerrm;
end $$;


-- -----------------------------------------------------------------------------
-- 3. Funcion de diagnostico: confirma si el contexto es utilizable
-- -----------------------------------------------------------------------------
create or replace function public.fn_validar_contexto_backend()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
    v_contexto uuid := public.app_user_id();
    v_rol     public.rol_usuario := public.app_user_role();
begin
    return jsonb_build_object(
        'contexto_establecido', v_contexto is not null,
        'usuario_id', v_contexto,
        'rol_efectivo', v_rol,
        'es_admin', public.app_is_admin(),
        'current_user', current_user,
        'instruccion', case
            when v_contexto is null then
                'SIN CONTEXTO: el backend debe ejecutar SET LOCAL app.current_user_id antes de operar con datos de usuario.'
            else
                'Contexto activo. El rol se lee de public.perfil (no es falsificable).'
        end
    );
end;
$$;

comment on function public.fn_validar_contexto_backend() is
    'Diagnostico del contexto de autorizacion de la transaccion actual.';

grant execute on function public.fn_validar_contexto_backend() to inkaquest_api, service_role, authenticated;


-- -----------------------------------------------------------------------------
-- 4. Helper: ejecutar una operacion en el contexto de un usuario.
--    Uso tipico desde el backend:
--      select public.fn_ejecutar_como_usuario(
--          '<uuid>', 'fn_registrar_completado_leccion(...)'::text);
--    (La funcion se evalua dentro de la transaccion del backend, que ya hizo
--     SET LOCAL app.current_user_id, de modo que las politicas RLS aplican.)
-- -----------------------------------------------------------------------------
create or replace function public.fn_contexto_usuario(p_usuario_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
    if p_usuario_id is null then
        raise exception 'El identificador de usuario no puede ser nulo.';
    end if;

    perform set_config('app.current_user_id', p_usuario_id::text, true);
    perform set_config('app.current_user_email', '', true);
end;
$$;

comment on function public.fn_contexto_usuario(uuid) is
    'Establece el contexto de autorizacion de la transaccion actual (transaction-local).';

grant execute on function public.fn_contexto_usuario(uuid) to inkaquest_api, service_role;


-- =============================================================================
-- 5. DATOS DE REFERENCIA
--    Reglas de progresion, permisos base, eventos de auditoria y el motor
--    comun inicial. Todo insertado con ON CONFLICT para que la migracion
--    sea idempotente.
-- =============================================================================

-- Reglas de progresion: nivel 1 al_BEGIN de la ruta.
insert into public.regla_progresion (tipo, nombre, xp_requerido, valor, descripcion)
values
    ('nivel', 'Nivel 1',    0,   1, 'Nivel inicial'),
    ('nivel', 'Nivel 2',    100,  2, 'Primer hito'),
    ('nivel', 'Nivel 3',    250,  3, 'Constancia'),
    ('nivel', 'Nivel 4',    500,  4, 'Dedicacion'),
    ('nivel', 'Nivel 5',   1000,  5, 'Maestria'),
    ('nivel', 'Nivel 10', 5000, 10, 'Experto'),
    ('racha', 'Racha diaria', 0, 10, 'XP otorgado por mantener la racha')
on conflict (tipo, xp_requerido) do nothing;

-- Permisos base del sistema.
insert into public.permiso (codigo, nombre, descripcion, modulo)
values
    ('curso.crear',        'Crear curso',        'Puede crear cursos',                 'academico'),
    ('curso.editar',       'Editar curso',       'Puede editar los cursos asignados',  'academico'),
    ('curso.publicar',     'Publicar curso',     'Puede publicar cursos',              'academico'),
    ('contenido.editar',   'Editar contenido',   'Puede editar lecciones y recursos',  'academico'),
    ('evaluacion.crear',   'Crear evaluacion',   'Puede crear evaluaciones',           'evaluaciones'),
    ('evaluacion.calificar','Calificar',          'Puede calificar entregas',          'evaluaciones'),
    ('recurso.crear',      'Crear reto',         'Puede crear retos de programacion',  'retos'),
    ('minijuego.crear',    'Crear minijuego',    'Puede crear actividades de juego',   'minijuegos'),
    ('usuario.gestionar',  'Gestionar usuarios', 'Puede gestionar usuarios y roles',   'identidad'),
    ('docente.aprobar',    'Aprobar docentes',   'Puede aprobar solicitudes docente',  'identidad'),
    ('pago.gestionar',     'Gestionar pagos',    'Puede revisar pagos y reembolsos',   'pagos'),
    ('gamificacion.config','Configurar gamificacion','Puede configurar insignias y misiones','gamificacion'),
    ('auditoria.ver',      'Ver auditoria',      'Puede consultar la bitacora',        'auditoria'),
    ('configuracion.editar','Editar configuracion','Puede editar la configuracion',     'configuracion'),
    ('soporte.gestionar',  'Gestionar soporte',  'Puede responder tickets',            'soporte')
on conflict (codigo) do nothing;

-- Asignacion de permisos por rol.
insert into public.rol_permiso (rol, permiso_id)
select r.rol, p.id
  from (values
      ('estudiante'),
      ('docente'),
      ('administrador')
  ) as r(rol)
  join public.permiso p on true
 where r.rol = 'administrador'
on conflict do nothing;

insert into public.rol_permiso (rol, permiso_id)
select 'docente', p.id
  from public.permiso p
 where p.codigo in ('curso.crear', 'curso.editar', 'curso.publicar',
                    'contenido.editar', 'evaluacion.crear', 'evaluacion.calificar',
                    'recurso.crear', 'minijuego.crear')
on conflict do nothing;

insert into public.rol_permiso (rol, permiso_id)
select 'estudiante', p.id
  from public.permiso p
 where p.codigo in ('soporte.gestionar')   -- placeholder vacio: no permisos special
on conflict do nothing;

-- Eventos de auditoria del sistema.
insert into public.evento_sistema (codigo, nombre, descripcion, modulo, nivel)
values
    ('auth.login',              'Inicio de sesion',        'El usuario inicia sesion',              'identidad', 'info'),
    ('auth.logout',             'Cierre de sesion',        'El usuario cierra sesion',              'identidad', 'info'),
    ('perfil.actualizado',      'Perfil actualizado',      'El usuario actualiza su perfil',        'identidad', 'info'),
    ('rol.solicitado',          'Rol docente solicitado',  'Un usuario solicita ser docente',       'identidad', 'aviso'),
    ('rol.aprobado',            'Rol docente aprobado',    'Un administrador aprueba a un docente',  'identidad', 'info'),
    ('curso.creado',            'Curso creado',            'Se crea un curso',                      'academico', 'info'),
    ('curso.publicado',         'Curso publicado',         'Se publica un curso',                   'academico', 'info'),
    ('curso.archivado',         'Curso archivado',         'Se archiva un curso',                   'academico', 'aviso'),
    ('matricula.creada',        'Matricula creada',        'Se crea una matricula',                 'matriculas','info'),
    ('matricula.activada',      'Matricula activada',      'Una matricula se activa tras el pago',  'matriculas','info'),
    ('pago.capturado',          'Pago capturado',          'Se confirma un pago',                   'pagos',     'info'),
    ('pago.reembolsado',        'Pago reembolsado',        'Se procesa un reembolso',               'pagos',     'aviso'),
    ('calificacion.registrada', 'Calificacion registrada', 'El docente califica una entrega',       'evaluaciones','info'),
    ('insignia.otorgada',       'Insignia otorgada',       'El usuario obtiene una insignia',       'gamificacion','info'),
    ('certificado.emitido',     'Certificado emitido',     'Se emite un certificado',               'certificados','info'),
    ('certificado.revocado',    'Certificado revocado',    'Se revoca un certificado',              'certificados','critico'),
    ('ticket.creado',           'Ticket creado',           'El usuario abre un ticket de soporte',   'soporte',   'info'),
    ('ticket.resuelto',         'Ticket resuelto',         'Se resuelve un ticket',                 'soporte',   'info'),
    ('chatbot.consulta',        'Consulta al chatbot',     'El usuario interactua con el asistente','chatbot',   'info'),
    ('configuracion.actualizada','Configuracion actualizada','Se cambia un parametro del sistema',  'configuracion','aviso')
on conflict (codigo) do nothing;

-- Parametros del sistema.
insert into public.parametro_sistema (clave, valor, tipo, descripcion, categoria)
values
    ('plataforma.nombre',        'InkaQuest',          'string', 'Nombre visible de la plataforma',  'general'),
    ('plataforma.version',       '0.1.0',              'string', 'Version desplegada',               'general'),
    ('gamificacion.xp_por_leccion', '10',              'number', 'XP por defecto al completar',      'gamificacion'),
    ('inscripcion.matricula_gratis','false',           'boolean','Permite matricular sin pago',      'matriculas'),
    ('certificados.verificacion_publica','true',       'boolean','Permite verificar por codigo',     'certificados'),
    ('chatbot.habilitado',       'true',              'boolean', 'Activa el asistente virtual',      'chatbot')
on conflict (clave) do nothing;

-- Configuracion no secreta.
insert into public.configuracion (clave, valor, tipo, descripcion, categoria)
values
    ('plataforma.marca', '{"nombre":"InkaQuest","lema":"Aprende jugando"}'::jsonb,
     'json', 'Identidad visible de la plataforma', 'general'),
    ('gamificacion.curso_completado_xp', '200'::jsonb,
     'number', 'XP por completar un curso', 'gamificacion'),
    ('chatbot.limite_consultas_diarias', '50'::jsonb,
     'number', 'Consultas diarias por usuario', 'chatbot')
on conflict (clave) do nothing;


-- =============================================================================
-- FIN DE LA MIGRACION 0009
-- =============================================================================
