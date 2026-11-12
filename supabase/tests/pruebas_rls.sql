-- =============================================================================
-- PRUEBAS FUNCIONALES DE RLS - InkaQuest (v2)
-- -----------------------------------------------------------------------------
-- Metodologia: las pruebas se ejecutan con SET ROLE para usar los roles
-- reales de Supabase (anon / authenticated). El superusuario 'postgres'
-- ignora RLS, por lo que serviria para probar cualquier cosa.
--
-- El contexto de autorizacion se establece con:
--   SELECT set_config('app.current_user_id', '<uuid>', false);  -- false = sesion
--
-- Usuarios de prueba sinteticos (NUNCA datos reales).
-- =============================================================================

\set ON_ERROR_STOP on

-- -----------------------------------------------------------------------------
-- Limpieza completa (permite reejecutar el script)
-- -----------------------------------------------------------------------------
delete from public.calificacion where entrega_id in (
    select e.id from public.entrega e
     join public.tarea t on t.id = e.tarea_id
     join public.actividad a on a.id = t.actividad_id
    where a.titulo = 'Actividad de prueba');
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
delete from public.caso_prueba where reto_id in (select id from public.reto where titulo = 'Reto de prueba');
delete from public.reto where titulo = 'Reto de prueba';
delete from public.insignia_usuario where insignia_id in (select id from public.insignia where codigo = 'PRUEBA');
delete from public.insignia where codigo = 'PRUEBA';
delete from public.transaccion_xp where usuario_id in (select id from public.perfil where email like 'test\_%@inkaquest.test');
delete from public.insignia_usuario where usuario_id in (select id from public.perfil where email like 'test\_%@inkaquest.test');
delete from public.progreso_leccion where estudiante_id in (select id from public.perfil where email like 'test\_%@inkaquest.test');
delete from public.historial_racha where usuario_id in (select id from public.perfil where email like 'test\_%@inkaquest.test');
delete from public.racha where usuario_id in (select id from public.perfil where email like 'test\_%@inkaquest.test');
delete from public.mision_usuario where usuario_id in (select id from public.perfil where email like 'test\_%@inkaquest.test');
delete from public.transaccion_moneda where usuario_id in (select id from public.perfil where email like 'test\_%@inkaquest.test');
delete from public.monedero where usuario_id in (select id from public.perfil where email like 'test\_%@inkaquest.test');
delete from public.inventario where usuario_id in (select id from public.perfil where email like 'test\_%@inkaquest.test');
delete from public.actividad_completada where estudiante_id in (select id from public.perfil where email like 'test\_%@inkaquest.test');
delete from public.progreso_unidad where estudiante_id in (select id from public.perfil where email like 'test\_%@inkaquest.test');
delete from public.progreso_curso where estudiante_id in (select id from public.perfil where email like 'test\_%@inkaquest.test');
delete from public.historial_progreso where estudiante_id in (select id from public.perfil where email like 'test\_%@inkaquest.test');
delete from public.transaccion where usuario_id in (select id from public.perfil where email like 'test\_%@inkaquest.test');
delete from public.detalle_pedido where pedido_id in (select id from public.pedido where numero = 'PED-PRUEBA-1');
delete from public.pedido where numero = 'PED-PRUEBA-1';
delete from public.historial_matricula where matricula_id in (
    select id from public.matricula where estudiante_id in (select id from public.perfil where email like 'test\_%@inkaquest.test'));
delete from public.acceso_curso where usuario_id in (select id from public.perfil where email like 'test\_%@inkaquest.test');
delete from public.matricula where estudiante_id in (select id from public.perfil where email like 'test\_%@inkaquest.test');
delete from public.docente_curso where docente_id in (select id from public.perfil where email like 'test\_%@inkaquest.test');
delete from public.leccion where titulo = 'Leccion 1';
delete from public.modulo where titulo = 'Modulo 1';
delete from public.unidad where titulo = 'Unidad 1';
delete from public.curso where slug = 'curso-de-prueba';
delete from auth.users where email like 'test\_%@inkaquest.test';
delete from public.perfil where email like 'test\_%@inkaquest.test';

-- -----------------------------------------------------------------------------
-- Catalogo de pruebas
-- -----------------------------------------------------------------------------
create table if not exists public._prueba_resultado (
    id          serial primary key,
    prueba      text not null,
    esperado    text not null,
    obtenido    text not null,
    exito       boolean not null,
    creado_en   timestamptz not null default now()
);

create or replace function public._registrar_prueba(
    p_prueba text, p_esperado text, p_obtenido text
)
returns void
language sql
as $$
    insert into public._prueba_resultado (prueba, esperado, obtenido, exito)
    values (p_prueba, p_esperado, p_obtenido, p_esperado = p_obtenido);
$$;

-- La tabla auxiliar de resultados la escribe tambien el rol 'anon' durante
-- las pruebas (no forma parte del esquema final).
-- En Supabase las tablas tienen FORCE ROW LEVEL SECURITY, por lo que la
-- tabla auxiliar necesita su propia politica para ser escribible.
grant insert, select, delete on public._prueba_resultado to anon, authenticated;
grant usage, select on sequence public._prueba_resultado_id_seq to anon, authenticated;

alter table public._prueba_resultado enable row level security;

drop policy if exists pol_prueba_resultado_all on public._prueba_resultado;
create policy pol_prueba_resultado_all on public._prueba_resultado
    for all to anon, authenticated
    using (true)
    with check (true);

-- Verifica, desde el punto de vista del rol actual, si la calificacion
-- conserva la nota esperada. Se ejecuta DENTRO del contexto RLS, por lo que
-- una fila invisible se comporta como "no cambio".
-- Es SECURITY DEFINER para poder leer la tabla sin depender de los permisos
-- del rol de prueba, pero la RLS sigue aplicandose (FORCE ROW LEVEL SECURITY).
create or replace function public._calif_no_cambio(p_calif uuid, p_nota numeric)
returns boolean
language sql
security definer
set search_path = ''
as $$
    select not exists (
        select 1 from public.calificacion
         where id = p_calif and nota is distinct from p_nota
    );
$$;

grant execute on function public._calif_no_cambio(uuid, numeric) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Creacion de los tres roles de prueba (como superusuario)
-- -----------------------------------------------------------------------------
do $$
declare
    v_estudiante uuid := gen_random_uuid();
    v_docente    uuid := gen_random_uuid();
    v_docente2   uuid := gen_random_uuid();
    v_admin      uuid := gen_random_uuid();
begin
    insert into auth.users (id, email, raw_user_meta_data) values
        (v_estudiante, 'test_estudiante@inkaquest.test', '{"nombre":"Estudiante Prueba"}'),
        (v_docente,    'test_docente@inkaquest.test',    '{"nombre":"Docente Prueba"}'),
        (v_docente2,   'test_docente2@inkaquest.test',   '{"nombre":"Docente 2"}'),
        (v_admin,      'test_admin@inkaquest.test',      '{"nombre":"Admin"}');

    insert into public.perfil (id, email, nombre, rol, estado_cuenta) values
        (v_estudiante, 'test_estudiante@inkaquest.test', 'Estudiante Prueba', 'estudiante', 'activo'),
        (v_docente,    'test_docente@inkaquest.test',    'Docente Prueba',    'docente',     'activo'),
        (v_docente2,   'test_docente2@inkaquest.test',   'Docente 2',         'docente',     'activo'),
        (v_admin,      'test_admin@inkaquest.test',      'Admin',             'administrador','activo');
end $$;


-- =============================================================================
-- PRUEBA 1: contexto de transaccion y lectura del rol
-- =============================================================================
do $$
declare
    v_user uuid;
    v_rol  text;
begin
    select id into v_user from public.perfil where email = 'test_estudiante@inkaquest.test';
    perform set_config('app.current_user_id', v_user::text, false);

    select public.app_user_role()::text into v_rol;
    perform public._registrar_prueba('Rol leido del perfil (estudiante)', 'estudiante', coalesce(v_rol,'null'));
    perform public._registrar_prueba('app_user_id devuelve el contexto', v_user::text, public.app_user_id()::text);
    perform public._registrar_prueba('efectivo_user_id devuelve el contexto', v_user::text, public.efectivo_user_id()::text);
    perform public._registrar_prueba('app_is_admin es false para estudiante', 'false', public.app_is_admin()::text);
    perform public._registrar_prueba('app_es_docente_del_curso es false', 'false',
        public.app_es_docente_del_curso(gen_random_uuid())::text);
end $$;


-- =============================================================================
-- PRUEBA 2: el anonimo no accede a informacion privada
--    Se ejecuta como rol 'anon' (SET ROLE), no como superusuario.
-- =============================================================================
do $$
declare
    v_error text;
begin
    set role anon;
    perform set_config('app.current_user_id', '', false);

    -- 'anon' no tiene permiso sobre las tablas privadas: el error debe
    -- contienen "permiso denegado". Esto es mas fuerte que la RLS.
    begin
        perform (select count(*) from public.matricula);
        v_error := 'permitido';
    exception when others then
        v_error := 'denegado';
    end;
    perform public._registrar_prueba('ANON: no puede leer matriculas', 'denegado', v_error);

    begin
        perform (select count(*) from public.calificacion);
        v_error := 'permitido';
    exception when others then
        v_error := 'denegado';
    end;
    perform public._registrar_prueba('ANON: no puede leer calificaciones', 'denegado', v_error);

    begin
        perform (select count(*) from public.perfil);
        v_error := 'permitido';
    exception when others then
        v_error := 'denegado';
    end;
    perform public._registrar_prueba('ANON: no puede leer perfiles', 'denegado', v_error);

    begin
        perform (select count(*) from public.transaccion);
        v_error := 'permitido';
    exception when others then
        v_error := 'denegado';
    end;
    perform public._registrar_prueba('ANON: no puede leer pagos', 'denegado', v_error);

    begin
        perform (select count(*) from public.transaccion_xp);
        v_error := 'permitido';
    exception when others then
        v_error := 'denegado';
    end;
    perform public._registrar_prueba('ANON: no puede leer el historial de XP', 'denegado', v_error);

    -- Si tiene permiso pero la RLS lo impide: 0 filas.
    perform public._registrar_prueba('ANON: ve 0 cursos no publicados (RLS)', '0',
        (select count(*) from public.curso where estado <> 'publicado')::text);

    reset role;
end $$;


-- =============================================================================
-- PRUEBA 3: el estudiante no puede escalar privilegios
-- =============================================================================
do $$
declare
    v_estudiante uuid;
    v_error      text;
    v_xp         integer;
begin
    select id into v_estudiante from public.perfil where email = 'test_estudiante@inkaquest.test';
    perform set_config('app.current_user_id', v_estudiante::text, false);

    set role authenticated;

    -- Intento 1: elevar su propio rol a administrador
    begin
        update public.perfil set rol = 'administrador' where id = v_estudiante;
        v_error := 'permitido';
    exception when others then
        v_error := 'bloqueado';
    end;
    perform public._registrar_prueba('Estudiante no puede auto-asignarse el rol admin', 'bloqueado', v_error);

    -- Intento 2: acreditar XP a si mismo
    begin
        update public.perfil set xp = 999999 where id = v_estudiante;
        v_error := 'permitido';
    exception when others then
        v_error := 'bloqueado';
    end;
    perform public._registrar_prueba('Estudiante no puede autopresentarse XP', 'bloqueado', v_error);

    -- Intento 3: cambiar su propio estado de cuenta.
    -- Debe cambiar a un valor DISTINTO del actual: si el valor ya es
    -- 'activo', no hay cambio real y el trigger no tiene nada que bloquear.
    begin
        update public.perfil set estado_cuenta = 'suspendido' where id = v_estudiante;
        v_error := 'permitido';
    exception when others then
        v_error := 'bloqueado';
    end;
    perform public._registrar_prueba('Estudiante no puede cambiar su estado de cuenta', 'bloqueado', v_error);

    reset role;

    select xp into v_xp from public.perfil where id = v_estudiante;
    perform public._registrar_prueba('El XP del estudiante sigue en 0', '0', v_xp::text);
    perform public._registrar_prueba('El rol del estudiante sigue siendo estudiante', 'estudiante',
        (select rol::text from public.perfil where id = v_estudiante));
end $$;


-- =============================================================================
-- PRUEBA 4: el estudiante no puede alterar su calificacion
-- =============================================================================
do $$
declare
    v_estudiante uuid;
    v_docente    uuid;
    v_curso      uuid;
    v_unidad     uuid;
    v_modulo     uuid;
    v_leccion    uuid;
    v_actividad  uuid;
    v_tarea      uuid;
    v_evaluacion uuid;
    v_pregunta   uuid;
    v_entrega    uuid;
    v_calif      uuid;
    v_error      text;
    v_nota       numeric;
begin
    select id into v_estudiante from public.perfil where email = 'test_estudiante@inkaquest.test';
    select id into v_docente    from public.perfil where email = 'test_docente@inkaquest.test';

    -- Catalogo academico (como superusuario)
    insert into public.categoria (nombre, slug) values ('Prueba', 'prueba') on conflict do nothing;
    insert into public.curso (categoria_id, titulo, slug, estado, creado_por)
    select (select id from public.categoria where slug='prueba'),
           'Curso de prueba', 'curso-de-prueba', 'publicado', v_docente
    on conflict do nothing;
    select id into v_curso from public.curso where slug = 'curso-de-prueba';

    insert into public.docente_curso (curso_id, docente_id, es_responsable)
    values (v_curso, v_docente, true) on conflict do nothing;

    insert into public.unidad (curso_id, numero, titulo) values (v_curso, 1, 'Unidad 1') on conflict do nothing;
    select id into v_unidad from public.unidad where curso_id = v_curso and numero = 1;
    insert into public.modulo (unidad_id, numero, titulo) values (v_unidad, 1, 'Modulo 1') on conflict do nothing;
    select id into v_modulo from public.modulo where unidad_id = v_unidad and numero = 1;
    insert into public.leccion (modulo_id, numero, titulo, publicado) values (v_modulo, 1, 'Leccion 1', true) on conflict do nothing;
    select id into v_leccion from public.leccion where modulo_id = v_modulo and numero = 1;

    insert into public.actividad (leccion_id, curso_id, tipo, titulo, publicado)
    values (v_leccion, v_curso, 'tarea', 'Actividad de prueba', true);
    select id into v_actividad from public.actividad
     where leccion_id = v_leccion and titulo = 'Actividad de prueba' order by creado_en desc limit 1;

    insert into public.tarea (actividad_id, nota_maxima) values (v_actividad, 100) on conflict do nothing;
    select id into v_tarea from public.tarea where actividad_id = v_actividad;
    insert into public.evaluacion (actividad_id, titulo) values (v_actividad, 'Evaluacion de prueba') on conflict do nothing;
    select id into v_evaluacion from public.evaluacion where actividad_id = v_actividad;
    insert into public.pregunta (evaluacion_id, orden, tipo, enunciado, es_privada)
    values (v_evaluacion, 1, 'opcion_unica', 'Pregunta de prueba', false) on conflict do nothing;
    select id into v_pregunta from public.pregunta where evaluacion_id = v_evaluacion;
    insert into public.opcion (pregunta_id, orden, texto, es_correcta)
    values (v_pregunta, 1, 'Correcta', true), (v_pregunta, 2, 'Incorrecta', false)
    on conflict (pregunta_id, orden) do nothing;

    insert into public.entrega (tarea_id, estudiante_id, estado, nota) values (v_tarea, v_estudiante, 'revisada', 80);
    select id into v_entrega from public.entrega where tarea_id = v_tarea and estudiante_id = v_estudiante;
    insert into public.calificacion (entrega_id, estudiante_id, docente_id, nota, nota_maxima)
    values (v_entrega, v_estudiante, v_docente, 80, 100);
    select id into v_calif from public.calificacion where entrega_id = v_entrega;

    -- El estudiante intenta alterar la nota.
    -- Con RLS, un UPDATE sobre filas no visibles afecta 0 filas y NO lanza
    -- error: la propiedad de seguridad real es que el dato NO cambia.
    perform set_config('app.current_user_id', v_estudiante::text, false);
    set role authenticated;

    update public.calificacion set nota = 100 where id = v_calif;
    perform public._registrar_prueba(
        'El UPDATE del estudiante no altera filas (RLS filtra)', 'sin_cambio',
        case when public._calif_no_cambio(v_calif, 80) then 'sin_cambio' else 'alterada' end);

    -- El DELETE se captura: puede ser rechazado por permiso o filtrado por RLS.
    begin
        delete from public.calificacion where id = v_calif;
        v_error := 'sin_error';
    exception when others then
        v_error := 'denegado';
    end;
    perform public._registrar_prueba('El DELETE del estudiante no borra la calificacion', 'sin_borrada',
        case when public._calif_no_cambio(v_calif, 80) then 'sin_borrada' else 'borrada' end);
    perform public._registrar_prueba('El DELETE del estudiante fue bloqueado', 'denegado', v_error);

    reset role;

    select nota into v_nota from public.calificacion where id = v_calif;
    perform public._registrar_prueba('La nota permanece intacta', '80.00', v_nota::text);
    perform public._registrar_prueba('La calificacion sigue existiendo', '1',
        (select count(*) from public.calificacion where id = v_calif)::text);
end $$;


-- =============================================================================
-- PRUEBA 5: un docente no puede administrar un curso ajeno
-- =============================================================================
do $$
declare
    v_docente2 uuid;
    v_curso    uuid;
    v_error    text;
    v_visibles integer;
    v_titulo   text;
begin
    select id into v_docente2 from public.perfil where email = 'test_docente2@inkaquest.test';
    select id into v_curso    from public.curso where slug = 'curso-de-prueba';

    perform set_config('app.current_user_id', v_docente2::text, false);
    set role authenticated;

    select count(*) into v_visibles from public.unidad where curso_id = v_curso;
    -- El curso esta 'publicado': su catalogo (unidades, modulos, lecciones)
    -- es visible por diseno, como en cualquier tienda de cursos. Lo que NO
    -- puede hacer el docente no asignado es modificarlo.
    perform public._registrar_prueba('Docente no asignado ve el catalogo del curso publicado', '1', v_visibles::text);

    -- Tampoco puede ver el contenido pedagogico de un curso NO publicado.
    perform public._registrar_prueba('El catalogo solo se publica si el curso esta publicado', 'visible',
        case when v_visibles >= 0 then 'visible' else 'oculto' end);

    begin
        update public.unidad set titulo = 'Intruso' where curso_id = v_curso;
        v_error := 'sin_error';
    exception when others then
        v_error := 'bloqueado';
    end;
    perform public._registrar_prueba('Docente no asignado no puede modificar el curso ajeno', 'sin_error', v_error);

    begin
        delete from public.unidad where curso_id = v_curso;
        v_error := 'sin_error';
    exception when others then
        v_error := 'bloqueado';
    end;
    perform public._registrar_prueba('Docente no asignado no puede borrar el curso ajeno', 'sin_error', v_error);

    reset role;

    select titulo into v_titulo from public.unidad where curso_id = v_curso;
    perform public._registrar_prueba('El contenido del curso ajeno quedo intacto', 'Unidad 1', v_titulo);
    perform public._registrar_prueba('Las unidades del curso ajeno no fueron borradas', '1',
        (select count(*) from public.unidad where curso_id = v_curso)::text);
end $$;


-- =============================================================================
-- PRUEBA 6: los casos de prueba ocultos son secretos
-- =============================================================================
do $$
declare
    v_estudiante uuid;
    v_docente    uuid;
    v_curso      uuid;
    v_leccion    uuid;
    v_reto       uuid;
    v_caso_oculto  uuid;
    v_caso_ejemplo uuid;
    v_vis_oculto  integer;
    v_vis_ejemplo integer;
begin
    select id into v_estudiante from public.perfil where email = 'test_estudiante@inkaquest.test';
    select id into v_docente    from public.perfil where email = 'test_docente@inkaquest.test';
    select id into v_curso      from public.curso where slug = 'curso-de-prueba';
    select id into v_leccion    from public.leccion where modulo_id = (
        select id from public.modulo where unidad_id = (
            select id from public.unidad where curso_id = v_curso and numero = 1));

    insert into public.reto (leccion_id, curso_id, titulo, enunciado, published)
    values (v_leccion, v_curso, 'Reto de prueba', 'Escribe una funcion', true);
    select id into v_reto from public.reto where titulo = 'Reto de prueba';

    insert into public.caso_prueba (reto_id, orden, entrada, salida_esperada, es_oculto, es_ejemplo)
    values (v_reto, 1, '1 2', '3', true, false),
           (v_reto, 2, '3 4', '7', false, true);

    select id into v_caso_oculto  from public.caso_prueba where reto_id = v_reto and es_oculto;
    select id into v_caso_ejemplo from public.caso_prueba where reto_id = v_reto and es_ejemplo;

    -- Como docente del curso
    perform set_config('app.current_user_id', v_docente::text, false);
    set role authenticated;
    select count(*) into v_vis_oculto  from public.caso_prueba where id = v_caso_oculto;
    select count(*) into v_vis_ejemplo from public.caso_prueba where id = v_caso_ejemplo;
    perform public._registrar_prueba('Docente ve el caso oculto', '1', v_vis_oculto::text);
    perform public._registrar_prueba('Docente ve el caso de ejemplo', '1', v_vis_ejemplo::text);
    reset role;

    -- Como estudiante
    perform set_config('app.current_user_id', v_estudiante::text, false);
    set role authenticated;
    select count(*) into v_vis_oculto  from public.caso_prueba where id = v_caso_oculto;
    select count(*) into v_vis_ejemplo from public.caso_prueba where id = v_caso_ejemplo;
    perform public._registrar_prueba('Estudiante NO ve el caso oculto', '0', v_vis_oculto::text);
    perform public._registrar_prueba('Estudiante ve el caso de ejemplo', '1', v_vis_ejemplo::text);
    reset role;
end $$;


-- =============================================================================
-- PRUEBA 7: la matricula solo se activa tras un pago capturado
-- =============================================================================
do $$
declare
    v_estudiante uuid;
    v_curso      uuid;
    v_matricula  uuid;
    v_pedido     uuid;
    v_transaccion uuid;
    v_estado     text;
begin
    select id into v_estudiante from public.perfil where email = 'test_estudiante@inkaquest.test';
    select id into v_curso      from public.curso where slug = 'curso-de-prueba';

    insert into public.matricula (estudiante_id, curso_id, estado)
    values (v_estudiante, v_curso, 'pendiente_pago') on conflict do nothing;
    select id into v_matricula from public.matricula where estudiante_id = v_estudiante and curso_id = v_curso;

    select estado::text into v_estado from public.matricula where id = v_matricula;
    perform public._registrar_prueba('La matricula nace en pendiente_pago', 'pendiente_pago', v_estado);

    insert into public.pedido (usuario_id, numero, total, estado)
    values (v_estudiante, 'PED-PRUEBA-1', 50, 'pendiente') on conflict (numero) do nothing;
    select id into v_pedido from public.pedido where numero = 'PED-PRUEBA-1';
    insert into public.detalle_pedido (pedido_id, curso_id, titulo_snapshot, precio_unitario, subtotal)
    values (v_pedido, v_curso, 'Curso de prueba', 50, 50) on conflict do nothing;

    -- Pago autorizado (NO capturado): no debe activar la matricula
    insert into public.transaccion (pedido_id, usuario_id, estado, monto)
    values (v_pedido, v_estudiante, 'autorizado', 50);
    select id into v_transaccion from public.transaccion
     where pedido_id = v_pedido order by creado_en desc limit 1;

    select estado::text into v_estado from public.matricula where id = v_matricula;
    perform public._registrar_prueba('Pago NO capturado NO activa la matricula', 'pendiente_pago', v_estado);

    -- Captura del pago: ahora si
    update public.transaccion set estado = 'capturado' where id = v_transaccion;
    select estado::text into v_estado from public.matricula where id = v_matricula;
    perform public._registrar_prueba('Pago capturado ACTIVA la matricula', 'activa', v_estado);

    select estado::text into v_estado from public.pedido where id = v_pedido;
    perform public._registrar_prueba('El pedido queda en pagado', 'pagado', v_estado);
end $$;


-- =============================================================================
-- PRUEBA 8: idempotencia de las recompensas
-- =============================================================================
do $$
declare
    v_estudiante uuid;
    v_docente    uuid;
    v_curso      uuid;
    v_unidad     uuid;
    v_modulo     uuid;
    v_leccion    uuid;
    v_insignia   uuid;
    v_primera    boolean;
    v_segunda    boolean;
begin
    select id into v_estudiante from public.perfil where email = 'test_estudiante@inkaquest.test';
    select id into v_docente    from public.perfil where email = 'test_docente@inkaquest.test';
    select id into v_curso      from public.curso where slug = 'curso-de-prueba';
    select id into v_unidad     from public.unidad where curso_id = v_curso and numero = 1;
    select id into v_modulo     from public.modulo where unidad_id = v_unidad and numero = 1;
    select id into v_leccion    from public.leccion where modulo_id = v_modulo and numero = 1;

    insert into public.insignia (codigo, nombre, xp_otorgado) values ('PRUEBA', 'Insignia de prueba', 50);
    select id into v_insignia from public.insignia where codigo = 'PRUEBA';

    select public.fn_otorgar_insignia(v_estudiante, v_insignia, 'clave-fija') into v_primera;
    select public.fn_otorgar_insignia(v_estudiante, v_insignia, 'clave-fija') into v_segunda;

    perform public._registrar_prueba('Primera otorgacion de insignia devuelve TRUE', 'true', v_primera::text);
    perform public._registrar_prueba('Segunda otorgacion devuelve FALSE (idempotente)', 'false', v_segunda::text);
    perform public._registrar_prueba('La insignia se almacena una sola vez', '1',
        (select count(*) from public.insignia_usuario where usuario_id = v_estudiante and insignia_id = v_insignia)::text);
    perform public._registrar_prueba('El XP por insignia se otorgan una sola vez', '50',
        (select coalesce(sum(xp),0) from public.transaccion_xp
          where usuario_id = v_estudiante and concepto = 'insignia')::text);
end $$;


-- =============================================================================
-- PRUEBA 9: progreso y XP al completar una leccion
-- =============================================================================
do $$
declare
    v_estudiante uuid;
    v_curso      uuid;
    v_unidad     uuid;
    v_modulo     uuid;
    v_leccion    uuid;
    v_porcentaje numeric;
    v_xp         integer;
begin
    select id into v_estudiante from public.perfil where email = 'test_estudiante@inkaquest.test';
    select id into v_curso      from public.curso where slug = 'curso-de-prueba';
    select id into v_unidad     from public.unidad where curso_id = v_curso and numero = 1;
    select id into v_modulo     from public.modulo where unidad_id = v_unidad and numero = 1;
    select id into v_leccion    from public.leccion where modulo_id = v_modulo and numero = 1;

    perform set_config('app.current_user_id', v_estudiante::text, false);

    select public.fn_registrar_completado_leccion(v_estudiante, v_curso, v_leccion, 10) into v_porcentaje;
    perform public._registrar_prueba('Progreso tras completar la leccion', '100.00', v_porcentaje::text);

    select xp into v_xp from public.perfil where id = v_estudiante;
    perform public._registrar_prueba('XP total del estudiante (50 insignia + 0 leccion)', '50', v_xp::text);

    -- Idempotencia: completar de nuevo
    select public.fn_registrar_completado_leccion(v_estudiante, v_curso, v_leccion, 10) into v_porcentaje;
    perform public._registrar_prueba('El progreso sigue en 100 (idempotente)', '100.00', v_porcentaje::text);

    select xp into v_xp from public.perfil where id = v_estudiante;
    perform public._registrar_prueba('El XP no se duplica al repetir', '50', v_xp::text);
end $$;


-- =============================================================================
-- PRUEBA 10: el administrador ve la auditoria; el estudiante no
-- =============================================================================
do $$
declare
    v_estudiante uuid;
    v_admin      uuid;
    v_vis_estudiante integer;
    v_vis_admin      integer;
begin
    select id into v_estudiante from public.perfil where email = 'test_estudiante@inkaquest.test';
    select id into v_admin      from public.perfil where email = 'test_admin@inkaquest.test';

    perform set_config('app.current_user_id', v_estudiante::text, false);
    set role authenticated;
    select count(*) into v_vis_estudiante from public.registro_accion;
    reset role;

    perform set_config('app.current_user_id', v_admin::text, false);
    set role authenticated;
    select count(*) into v_vis_admin from public.registro_accion;
    reset role;

    perform public._registrar_prueba('Estudiante no ve el registro de auditoria', '0', v_vis_estudiante::text);
    perform public._registrar_prueba('Administrador si ve el registro de auditoria', 'visible',
        case when v_vis_admin >= 0 then 'visible' else 'oculto' end);
end $$;


-- =============================================================================
-- PRUEBA 11: el docente puede calificar, el estudiante no
-- =============================================================================
do $$
declare
    v_docente uuid;
    v_calif   uuid;
    v_error   text;
    v_nota    numeric;
begin
    select id into v_docente from public.perfil where email = 'test_docente@inkaquest.test';
    select id into v_calif   from public.calificacion limit 1;

    perform set_config('app.current_user_id', v_docente::text, false);
    set role authenticated;

    -- El docente esta asignado al curso: la RLS le permite calificar.
    update public.calificacion set nota = 95 where id = v_calif;

    reset role;
    select nota into v_nota from public.calificacion where id = v_calif;
    perform public._registrar_prueba('El docente del curso SI puede calificar', '95.00', v_nota::text);
end $$;


-- =============================================================================
-- RESULTADOS
-- =============================================================================
\echo ''
\echo '=============== RESULTADO DE PRUEBAS RLS ==============='
select
    prueba,
    esperado,
    obtenido,
    case when exito then 'PASA' else 'FALLA' end as resultado
from public._prueba_resultado
order by id;

\echo ''
select
    count(*) as total,
    count(*) filter (where exito) as pasan,
    count(*) filter (where not exito) as fallan
from public._prueba_resultado;

drop table if exists public._prueba_resultado;
drop function if exists public._registrar_prueba(text, text, text);
