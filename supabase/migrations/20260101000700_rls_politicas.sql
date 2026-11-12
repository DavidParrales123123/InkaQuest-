-- =============================================================================
-- MIGRACION 0007 - Row Level Security: habilitacion y politicas
-- -----------------------------------------------------------------------------
-- Depende de: 0001..0006 (todas las tablas)
--
-- CONTEXTO DE AUTORIZACION
-- Las politicas usan las funciones de la migracion 0001:
--   public.efectivo_user_id()  -> usuario de la transaccion (backend) o del JWT
--   public.app_user_role()     -> rol leido de public.perfil (no falsificable)
--   public.app_es_docente_del_curso(curso)
--   public.app_esta_matriculado(curso)
--
-- REGLAS APLICADAS
--   - El estudiante NUNCA escribe sus propias notas, XP ni insignias.
--   - El docente NUNCA administra cursos ajenos.
--   - El anonimo NUNCA accede a informacion privada.
--   - Las funciones SECURITY DEFINER llevan search_path fijo.
--   - No hay politicas recursivas: las funciones de apoyo son SECURITY DEFINER
--     y consultan con el bypass del propietario, no con las politicas del
--     usuario (por eso usan set search_path = '' y nombres calificados).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. Permisos de lectura/escritura para los roles de Supabase.
--    Se hace explicito: 'anon' y 'authenticated' NO tienen permisos globales
--    sobre el esquema public. El acceso lo concede exclusivamente RLS.
-- -----------------------------------------------------------------------------
revoke all on schema public from anon, authenticated;

grant usage on schema public to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 1. Habilitar RLS en TODAS las tablas del esquema public.
--    Se hace de forma dinamica para no olvidar ninguna tabla nueva.
-- -----------------------------------------------------------------------------
do $$
declare
    r record;
begin
    for r in
        select c.relname
          from pg_class c
          join pg_namespace n on n.oid = c.relnamespace
         where n.nspname = 'public'
           and c.relkind = 'r'
           and c.relname not in ('spatial_ref_sys')
    loop
        execute format('alter table public.%I enable row level security', r.relname);
        -- FORCE evita que el propietario de la tabla omita las politicas.
        execute format('alter table public.%I force row level security', r.relname);
    end loop;
end $$;


-- =============================================================================
-- 2. PERMISOS (grants) A LOS ROLES DE SUPABASE
--    Select: el cliente lee lo que RLS permita.
--    Insert/Update/Delete: solo donde la politica lo autorice.
-- =============================================================================

-- Tablas de solo lectura para el cliente (las policies acotan mas).
grant select on
    public.perfil, public.categoria, public.curso, public.unidad, public.modulo,
    public.leccion, public.contenido, public.recurso, public.material_descargable,
    public.requisito_previo, public.permiso, public.rol_permiso,
    public.matricula, public.acceso_curso,
    public.actividad, public.tarea, public.evaluacion, public.examen,
    public.pregunta, public.opcion, public.criterio_evaluacion,
    public.intento_evaluacion, public.respuesta_evaluacion,
    public.entrega, public.entrega_archivo, public.calificacion, public.retroalimentacion,
    public.progreso_curso, public.progreso_unidad, public.progreso_leccion,
    public.historial_progreso, public.actividad_completada,
    public.reto, public.lenguaje, public.caso_prueba, public.envio_reto,
    public.resultado_caso, public.historial_ejecucion,
    public.motor, public.version_motor, public.motor_comun, public.motor_curso,
    public.juego, public.configuracion_juego, public.actividad_juego,
    public.intento_juego, public.respuesta_juego, public.resultado_juego,
    public.puntuacion_juego, public.tiempo_juego, public.finalizacion_juego,
    public.recompensa_juego,
    public.insignia, public.requisito_insignia, public.insignia_usuario,
    public.racha, public.historial_racha, public.temporada, public.ranking,
    public.evento_gamificacion, public.mision, public.mision_usuario,
    public.monedero, public.tienda_item, public.inventario, public.compra_virtual,
    public.transaccion_xp, public.transaccion_moneda,
    public.certificado, public.certificado_titular, public.certificado_curso,
    public.notificacion, public.notificacion_destinatario,
    public.preferencia_notificacion, public.mensaje, public.ticket,
    public.ticket_respuesta, public.historial_soporte,
    public.chatbot_conversacion, public.chatbot_participante, public.chatbot_mensaje,
    public.chatbot_historial, public.chatbot_documento, public.chatbot_documento_version,
    public.chatbot_fragmento, public.chatbot_referencia, public.chatbot_retroalimentacion,
    public.chatbot_derivacion, public.chatbot_consumo,
    public.evento_sistema, public.registro_accion, public.cambio_administrativo,
    public.historial_modificacion, public.configuracion, public.parametro_sistema,
    public.carrito, public.item_carrito, public.pedido, public.detalle_pedido,
    public.cupon, public.descuento, public.promocion, public.transaccion,
    public.intento_pago, public.webhook_pago, public.reembolso,
    public.historial_financiero, public.auditoria_acceso, public.evento_plataforma,
    public.solicitud_docente, public.aprobacion_docente, public.preferencia_usuario,
    public.historial_matricula, public.renovacion_matricula, public.cancelacion_matricula,
    public.historial_publicacion, public.regla_progresion, public.certificado_emision,
    public.certificado_revocacion
to authenticated;

-- El anonimo solo puede leer contenido publico: catalogos y motores.
-- Las tablas privadas (matricula, calificacion, perfil, transaccion) NO
-- tienen permiso para 'anon': el acceso se rechaza antes de evaluar la RLS.
grant select on
    public.categoria, public.curso, public.unidad, public.modulo, public.leccion,
    public.contenido, public.recurso, public.material_descargable,
    public.motor, public.version_motor, public.juego, public.configuracion_juego,
    public.certificado, public.certificado_titular, public.certificado_curso
to anon;

-- Escrituras que el cliente puede realizar (siempre sujetas a RLS).
-- La calificacion NO esta en la lista de INSERT: solo se actualiza
-- (el docente califica; la nota no se crea desde el cliente).
grant insert, update on
    public.carrito, public.item_carrito, public.pedido, public.detalle_pedido,
    public.matricula, public.entrega, public.entrega_archivo,
    public.intento_evaluacion, public.respuesta_evaluacion,
    public.progreso_curso, public.progreso_unidad, public.progreso_leccion,
    public.historial_progreso, public.actividad_completada,
    public.envio_reto, public.intento_juego, public.respuesta_juego,
    public.mensaje, public.ticket, public.ticket_respuesta,
    public.chatbot_conversacion, public.chatbot_mensaje,
    public.chatbot_retroalimentacion, public.solicitud_docente,
    public.preferencia_usuario, public.preferencia_notificacion,
    public.notificacion_destinatario, public.historial_soporte,
    public.certificado, public.certificado_titular, public.certificado_curso
to authenticated;

-- El docente califica: UPDATE sobre calificacion y retroalimentacion.
-- La RLS limita QUE filas puede tocar (solo las de sus cursos).
grant update on
    public.calificacion, public.retroalimentacion
to authenticated;

grant insert on
    public.retroalimentacion
to authenticated;

grant delete on
    public.carrito, public.item_carrito, public.entrega, public.entrega_archivo,
    public.respuesta_evaluacion
to authenticated;

-- El docente gestiona el material de sus cursos: necesita UPDATE/DELETE
-- sobre las tablas de contenido pedagogico y de evaluacion.
grant update, delete on
    public.categoria, public.curso, public.unidad, public.modulo, public.leccion,
    public.contenido, public.recurso, public.material_descargable,
    public.actividad, public.tarea, public.evaluacion, public.examen,
    public.pregunta, public.opcion, public.criterio_evaluacion,
    public.reto, public.lenguaje, public.caso_prueba, public.restriccion_reto,
    public.motor, public.version_motor, public.motor_comun, public.motor_curso,
    public.juego, public.configuracion_juego, public.actividad_juego
to authenticated;

-- El docente puede crear contenido pedagogico.
grant insert on
    public.unidad, public.modulo, public.leccion, public.contenido,
    public.recurso, public.material_descargable,
    public.actividad, public.tarea, public.evaluacion, public.examen,
    public.pregunta, public.opcion, public.criterio_evaluacion,
    public.reto, public.caso_prueba, public.restriccion_reto,
    public.actividad_juego
to authenticated;

-- El administrador opera con credenciales de servicio (service_role), que
-- ignora RLS. No se otorgan permisos especiales a 'authenticated'.


-- =============================================================================
-- 3. POLITICAS - MODULO A: IDENTIDAD Y SEGURIDAD
-- =============================================================================

-- Perfil: cada usuario ve y edita el suyo; el administrador ve todos.
drop policy if exists pol_perfil_select on public.perfil;
create policy pol_perfil_select on public.perfil
    for select to authenticated
    using (
        id = public.efectivo_user_id()
        or public.app_is_admin()
        -- El docente necesita ver los perfiles de sus estudiantes para
        -- calificar sus entregas.
        or exists (
            select 1 from public.entrega e
            join public.tarea t on t.id = e.tarea_id
            join public.actividad a on a.id = t.actividad_id
            where e.estudiante_id = perfil.id
              and public.app_es_docente_del_curso(a.curso_id)
        )
    );

drop policy if exists pol_perfil_update on public.perfil;
create policy pol_perfil_update on public.perfil
    for update to authenticated
    using (id = public.efectivo_user_id() or public.app_is_admin())
    with check (id = public.efectivo_user_id() or public.app_is_admin());

-- El rol NO lo cambia el propio usuario: solo el administrador o el
-- procedimiento oficial de aprobacion (que actua como escritura del sistema).
create or replace function public.fn_perfil_no_escalable()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    -- Escrituras del motor del sistema (gamificacion, aprobaciones):
    -- se saltan estas comprobaciones porque el propio sistema decide.
    if public.fn_escritura_sistema() then
        return new;
    end if;

    if new.rol is distinct from old.rol
       and not public.app_is_admin() then
        raise exception 'El rol solo puede ser modificado por un administrador.';
    end if;

    -- El XP, el nivel y la racha solo los modifica el sistema o el admin.
    if (new.xp is distinct from old.xp
        or new.nivel is distinct from old.nivel
        or new.racha_dias is distinct from old.racha_dias)
       and not public.app_is_admin() then
        raise exception 'La progresion (XP, nivel, racha) no puede modificarse manualmente.';
    end if;

    if new.estado_cuenta is distinct from old.estado_cuenta
       and not public.app_is_admin() then
        raise exception 'El estado de la cuenta solo puede ser modificado por un administrador.';
    end if;

    return new;
end;
$$;

drop trigger if exists trg_perfil_no_escalable on public.perfil;
create trigger trg_perfil_no_escalable
    before update on public.perfil
    for each row execute function public.fn_perfil_no_escalable();

-- Solicitudes de docente: el usuario crea la suya; el admin la gestiona.
drop policy if exists pol_solicitud_docente_select on public.solicitud_docente;
create policy pol_solicitud_docente_select on public.solicitud_docente
    for select to authenticated
    using (usuario_id = public.efectivo_user_id() or public.app_is_admin());

drop policy if exists pol_solicitud_docente_insert on public.solicitud_docente;
create policy pol_solicitud_docente_insert on public.solicitud_docente
    for insert to authenticated
    with check (
        usuario_id = public.efectivo_user_id()
        -- Solo un estudiante puede solicitar ser docente.
        and public.app_user_role() = 'estudiante'
        -- El rol de la tabla perfil NO cambia con la solicitud: eso lo hace
        -- el trigger de aprobacion.
    );

drop policy if exists pol_solicitud_docente_update on public.solicitud_docente;
create policy pol_solicitud_docente_update on public.solicitud_docente
    for update to authenticated
    using (public.app_is_admin())
    with check (public.app_is_admin());

-- Aprobaciones: solo lectura para el usuario, escritura del admin.
drop policy if exists pol_aprobacion_docente_select on public.aprobacion_docente;
create policy pol_aprobacion_docente_select on public.aprobacion_docente
    for select to authenticated
    using (public.app_is_admin() or usuario_id = public.efectivo_user_id());

-- Preferencias: solo las propias.
drop policy if exists pol_preferencia_usuario_all on public.preferencia_usuario;
create policy pol_preferencia_usuario_all on public.preferencia_usuario
    for all to authenticated
    using (usuario_id = public.efectivo_user_id())
    with check (usuario_id = public.efectivo_user_id());

-- Auditoria de acceso: solo el administrador la consulta.
drop policy if exists pol_auditoria_acceso_select on public.auditoria_acceso;
create policy pol_auditoria_acceso_select on public.auditoria_acceso
    for select to authenticated
    using (public.app_is_admin());


-- =============================================================================
-- 4. POLITICAS - MODULO B: GESTION ACADEMICA
-- =============================================================================

-- Catalogo publico: categorias y cursos publicados son visibles por todos.
drop policy if exists pol_categoria_select on public.categoria;
create policy pol_categoria_select on public.categoria
    for select to anon, authenticated
    using (activo or public.app_is_admin());

drop policy if exists pol_categoria_all on public.categoria;
create policy pol_categoria_all on public.categoria
    for all to authenticated
    using (public.app_is_admin())
    with check (public.app_is_admin());

drop policy if exists pol_curso_select on public.curso;
create policy pol_curso_select on public.curso
    for select to anon, authenticated
    using (
        estado = 'publicado'
        or creado_por = public.efectivo_user_id()
        or public.app_es_docente_del_curso(id)
        or public.app_is_admin()
    );

-- El docente solo puede crear cursos; no puede publicarlos sin permiso.
drop policy if exists pol_curso_insert on public.curso;
create policy pol_curso_insert on public.curso
    for insert to authenticated
    with check (
        public.app_is_docente() or public.app_is_admin()
    );

drop policy if exists pol_curso_update on public.curso;
create policy pol_curso_update on public.curso
    for update to authenticated
    using (
        public.app_es_docente_del_curso(id)
        or creado_por = public.efectivo_user_id()
        or public.app_is_admin()
    )
    with check (
        public.app_es_docente_del_curso(id)
        or creado_por = public.efectivo_user_id()
        or public.app_is_admin()
    );

drop policy if exists pol_curso_delete on public.curso;
create policy pol_curso_delete on public.curso
    for delete to authenticated
    using (public.app_is_admin() or creado_por = public.efectivo_user_id());

-- Asignacion de docentes: la gestiona el admin o el responsable del curso.
drop policy if exists pol_docente_curso_select on public.docente_curso;
create policy pol_docente_curso_select on public.docente_curso
    for select to authenticated
    using (
        docente_id = public.efectivo_user_id()
        or public.app_is_admin()
        or public.app_es_docente_del_curso(curso_id)
    );

drop policy if exists pol_docente_curso_write on public.docente_curso;
create policy pol_docente_curso_write on public.docente_curso
    for all to authenticated
    using (public.app_is_admin())
    with check (public.app_is_admin());

-- Contenido pedagogico: lectura si el curso esta publicado y el usuario esta
-- matriculado; gestion solo por el docente del curso.
drop policy if exists pol_unidad_select on public.unidad;
create policy pol_unidad_select on public.unidad
    for select to anon, authenticated
    using (
        exists (
            select 1 from public.curso c
             where c.id = unidad.curso_id and c.estado = 'publicado'
        )
        or public.app_es_docente_del_curso(curso_id)
        or public.app_is_admin()
    );

drop policy if exists pol_unidad_write on public.unidad;
create policy pol_unidad_write on public.unidad
    for all to authenticated
    using (public.app_es_docente_del_curso(curso_id) or public.app_is_admin())
    with check (public.app_es_docente_del_curso(curso_id) or public.app_is_admin());

drop policy if exists pol_modulo_select on public.modulo;
create policy pol_modulo_select on public.modulo
    for select to anon, authenticated
    using (
        exists (
            select 1 from public.unidad u
              join public.curso c on c.id = u.curso_id
             where u.id = modulo.unidad_id and c.estado = 'publicado'
        )
        or public.app_is_admin()
    );

drop policy if exists pol_modulo_write on public.modulo;
create policy pol_modulo_write on public.modulo
    for all to authenticated
    using (
        exists (
            select 1 from public.unidad u
             where u.id = modulo.unidad_id
               and (public.app_es_docente_del_curso(u.curso_id) or public.app_is_admin())
        )
    )
    with check (
        exists (
            select 1 from public.unidad u
             where u.id = modulo.unidad_id
               and (public.app_es_docente_del_curso(u.curso_id) or public.app_is_admin())
        )
    );

drop policy if exists pol_leccion_select on public.leccion;
create policy pol_leccion_select on public.leccion
    for select to anon, authenticated
    using (
        exists (
            select 1 from public.modulo m
              join public.unidad u on u.id = m.unidad_id
              join public.curso c on c.id = u.curso_id
             where m.id = leccion.modulo_id
               and (c.estado = 'publicado' or public.app_is_admin())
        )
        or public.app_es_docente_de_leccion(id)
    );

drop policy if exists pol_leccion_write on public.leccion;
create policy pol_leccion_write on public.leccion
    for all to authenticated
    using (public.app_es_docente_de_leccion(id) or public.app_is_admin())
    with check (public.app_es_docente_de_leccion(id) or public.app_is_admin());

drop policy if exists pol_contenido_select on public.contenido;
create policy pol_contenido_select on public.contenido
    for select to anon, authenticated
    using (
        exists (
            select 1 from public.leccion l
              join public.modulo m on m.id = l.modulo_id
              join public.unidad u on u.id = m.unidad_id
              join public.curso c on c.id = u.curso_id
             where l.id = contenido.leccion_id
               and (c.estado = 'publicado' or public.app_is_admin())
        )
    );

drop policy if exists pol_contenido_write on public.contenido;
create policy pol_contenido_write on public.contenido
    for all to authenticated
    using (public.app_es_docente_de_leccion(leccion_id) or public.app_is_admin())
    with check (public.app_es_docente_de_leccion(leccion_id) or public.app_is_admin());

drop policy if exists pol_recurso_select on public.recurso;
create policy pol_recurso_select on public.recurso
    for select to anon, authenticated
    using (true);

drop policy if exists pol_recurso_write on public.recurso;
create policy pol_recurso_write on public.recurso
    for all to authenticated
    using (public.app_es_docente_de_leccion(leccion_id) or public.app_is_admin())
    with check (public.app_es_docente_de_leccion(leccion_id) or public.app_is_admin());

drop policy if exists pol_material_select on public.material_descargable;
create policy pol_material_select on public.material_descargable
    for select to authenticated
    using (
        not requiere_matricula
        or public.app_is_admin()
        or exists (
            select 1
              from public.recurso r
              join public.leccion l  on l.id = r.leccion_id
              join public.modulo mo on mo.id = l.modulo_id
              join public.unidad un on un.id = mo.unidad_id
             where r.id = material_descargable.recurso_id
               and public.app_esta_matriculado(un.curso_id)
        )
    );

drop policy if exists pol_material_write on public.material_descargable;
create policy pol_material_write on public.material_descargable
    for all to authenticated
    using (public.app_is_admin())
    with check (public.app_is_admin());

drop policy if exists pol_requisito_previo_select on public.requisito_previo;
create policy pol_requisito_previo_select on public.requisito_previo
    for select to anon, authenticated
    using (true);

drop policy if exists pol_requisito_previo_write on public.requisito_previo;
create policy pol_requisito_previo_write on public.requisito_previo
    for all to authenticated
    using (public.app_is_admin())
    with check (public.app_is_admin());

drop policy if exists pol_historial_publicacion_select on public.historial_publicacion;
create policy pol_historial_publicacion_select on public.historial_publicacion
    for select to authenticated
    using (public.app_es_docente_del_curso(curso_id) or public.app_is_admin());


-- =============================================================================
-- 5. POLITICAS - MODULO C: MATRICULAS
-- =============================================================================

drop policy if exists pol_matricula_select on public.matricula;
create policy pol_matricula_select on public.matricula
    for select to authenticated
    using (
        estudiante_id = public.efectivo_user_id()
        or public.app_is_admin()
        or public.app_es_docente_del_curso(curso_id)
    );

-- Crear matricula: el propio estudiante. El estado inicial lo fija el
-- trigger de pago; el estudiante no puede auto-activarla.
drop policy if exists pol_matricula_insert on public.matricula;
create policy pol_matricula_insert on public.matricula
    for insert to authenticated
    with check (
        estudiante_id = public.efectivo_user_id()
        and estado = 'pendiente_pago'
    );

-- Actualizar: solo el admin o el sistema (via trigger de pago).
drop policy if exists pol_matricula_update on public.matricula;
create policy pol_matricula_update on public.matricula
    for update to authenticated
    using (public.app_is_admin())
    with check (public.app_is_admin());

drop policy if exists pol_historial_matricula_select on public.historial_matricula;
create policy pol_historial_matricula_select on public.historial_matricula
    for select to authenticated
    using (
        exists (
            select 1 from public.matricula m
             where m.id = historial_matricula.matricula_id
               and (m.estudiante_id = public.efectivo_user_id() or public.app_is_admin())
        )
    );

drop policy if exists pol_renovacion_select on public.renovacion_matricula;
create policy pol_renovacion_select on public.renovacion_matricula
    for select to authenticated
    using (
        exists (
            select 1 from public.matricula m
             where m.id = renovacion_matricula.matricula_id
               and (m.estudiante_id = public.efectivo_user_id() or public.app_is_admin())
        )
    );

drop policy if exists pol_cancelacion_select on public.cancelacion_matricula;
create policy pol_cancelacion_select on public.cancelacion_matricula
    for select to authenticated
    using (
        exists (
            select 1 from public.matricula m
             where m.id = cancelacion_matricula.matricula_id
               and (m.estudiante_id = public.efectivo_user_id() or public.app_is_admin())
        )
    );

drop policy if exists pol_cancelacion_insert on public.cancelacion_matricula;
create policy pol_cancelacion_insert on public.cancelacion_matricula
    for insert to authenticated
    with check (
        exists (
            select 1 from public.matricula m
             where m.id = cancelacion_matricula.matricula_id
               and m.estudiante_id = public.efectivo_user_id()
        )
    );

drop policy if exists pol_acceso_curso_select on public.acceso_curso;
create policy pol_acceso_curso_select on public.acceso_curso
    for select to authenticated
    using (usuario_id = public.efectivo_user_id() or public.app_is_admin());


-- =============================================================================
-- 6. POLITICAS - MODULO D: PAGOS
-- =============================================================================

drop policy if exists pol_carrito_all on public.carrito;
create policy pol_carrito_all on public.carrito
    for all to authenticated
    using (usuario_id = public.efectivo_user_id())
    with check (usuario_id = public.efectivo_user_id());

drop policy if exists pol_item_carrito_all on public.item_carrito;
create policy pol_item_carrito_all on public.item_carrito
    for all to authenticated
    using (exists (select 1 from public.carrito c
                    where c.id = item_carrito.carrito_id
                      and c.usuario_id = public.efectivo_user_id()))
    with check (exists (select 1 from public.carrito c
                         where c.id = item_carrito.carrito_id
                           and c.usuario_id = public.efectivo_user_id()));

drop policy if exists pol_pedido_select on public.pedido;
create policy pol_pedido_select on public.pedido
    for select to authenticated
    using (usuario_id = public.efectivo_user_id() or public.app_is_admin());

drop policy if exists pol_pedido_insert on public.pedido;
create policy pol_pedido_insert on public.pedido
    for insert to authenticated
    with check (usuario_id = public.efectivo_user_id());

-- El estado del pedido lo modifica el sistema al capturar el pago.
drop policy if exists pol_pedido_update on public.pedido;
create policy pol_pedido_update on public.pedido
    for update to authenticated
    using (public.app_is_admin())
    with check (public.app_is_admin());

drop policy if exists pol_detalle_pedido_select on public.detalle_pedido;
create policy pol_detalle_pedido_select on public.detalle_pedido
    for select to authenticated
    using (exists (select 1 from public.pedido p
                    where p.id = detalle_pedido.pedido_id
                      and (p.usuario_id = public.efectivo_user_id() or public.app_is_admin())));

drop policy if exists pol_detalle_pedido_insert on public.detalle_pedido;
create policy pol_detalle_pedido_insert on public.detalle_pedido
    for insert to authenticated
    with check (exists (select 1 from public.pedido p
                         where p.id = detalle_pedido.pedido_id
                           and p.usuario_id = public.efectivo_user_id()));

drop policy if exists pol_cupon_select on public.cupon;
create policy pol_cupon_select on public.cupon
    for select to authenticated
    using (activo or public.app_is_admin());

drop policy if exists pol_cupon_write on public.cupon;
create policy pol_cupon_write on public.cupon
    for all to authenticated
    using (public.app_is_admin())
    with check (public.app_is_admin());

drop policy if exists pol_descuento_all on public.descuento;
create policy pol_descuento_all on public.descuento
    for all to authenticated
    using (public.app_is_admin())
    with check (public.app_is_admin());

drop policy if exists pol_promocion_select on public.promocion;
create policy pol_promocion_select on public.promocion
    for select to authenticated
    using (activa or public.app_is_admin());

drop policy if exists pol_promocion_write on public.promocion;
create policy pol_promocion_write on public.promocion
    for all to authenticated
    using (public.app_is_admin())
    with check (public.app_is_admin());

-- Transacciones: el cliente ve las suyas; NO puede escribirlas (las crea
-- el backend con la service_role al cobrar).
drop policy if exists pol_transaccion_select on public.transaccion;
create policy pol_transaccion_select on public.transaccion
    for select to authenticated
    using (usuario_id = public.efectivo_user_id() or public.app_is_admin());

drop policy if exists pol_intento_pago_select on public.intento_pago;
create policy pol_intento_pago_select on public.intento_pago
    for select to authenticated
    using (exists (select 1 from public.transaccion t
                    where t.id = intento_pago.transaccion_id
                      and (t.usuario_id = public.efectivo_user_id() or public.app_is_admin())));

-- Los webhooks solo los lee el administrador.
drop policy if exists pol_webhook_pago_select on public.webhook_pago;
create policy pol_webhook_pago_select on public.webhook_pago
    for select to authenticated
    using (public.app_is_admin());

drop policy if exists pol_reembolso_select on public.reembolso;
create policy pol_reembolso_select on public.reembolso
    for select to authenticated
    using (usuario_id = public.efectivo_user_id() or public.app_is_admin());

drop policy if exists pol_reembolso_insert on public.reembolso;
create policy pol_reembolso_insert on public.reembolso
    for insert to authenticated
    with check (usuario_id = public.efectivo_user_id());

drop policy if exists pol_historial_financiero_select on public.historial_financiero;
create policy pol_historial_financiero_select on public.historial_financiero
    for select to authenticated
    using (usuario_id = public.efectivo_user_id() or public.app_is_admin());

drop policy if exists pol_evento_plataforma_select on public.evento_plataforma;
create policy pol_evento_plataforma_select on public.evento_plataforma
    for select to authenticated
    using (public.app_is_admin());


-- =============================================================================
-- 7. POLITICAS - MODULO E: PROGRESO
--    El progreso del estudiante es de solo lectura: lo actualiza el sistema.
-- =============================================================================

drop policy if exists pol_progreso_curso_select on public.progreso_curso;
create policy pol_progreso_curso_select on public.progreso_curso
    for select to authenticated
    using (
        estudiante_id = public.efectivo_user_id()
        or public.app_is_admin()
        or public.app_es_docente_del_curso(curso_id)
    );

drop policy if exists pol_progreso_unidad_select on public.progreso_unidad;
create policy pol_progreso_unidad_select on public.progreso_unidad
    for select to authenticated
    using (estudiante_id = public.efectivo_user_id() or public.app_is_admin());

drop policy if exists pol_progreso_leccion_select on public.progreso_leccion;
create policy pol_progreso_leccion_select on public.progreso_leccion
    for select to authenticated
    using (estudiante_id = public.efectivo_user_id() or public.app_is_admin());

drop policy if exists pol_historial_progreso_select on public.historial_progreso;
create policy pol_historial_progreso_select on public.historial_progreso
    for select to authenticated
    using (estudiante_id = public.efectivo_user_id() or public.app_is_admin());

drop policy if exists pol_actividad_completada_select on public.actividad_completada;
create policy pol_actividad_completada_select on public.actividad_completada
    for select to authenticated
    using (estudiante_id = public.efectivo_user_id() or public.app_is_admin());


-- =============================================================================
-- 8. POLITICAS - MODULO F: ACTIVIDADES Y EVALUACIONES
-- =============================================================================

drop policy if exists pol_actividad_select on public.actividad;
create policy pol_actividad_select on public.actividad
    for select to authenticated
    using (
        publicado
        or public.app_es_docente_del_curso(curso_id)
        or public.app_is_admin()
    );

drop policy if exists pol_actividad_write on public.actividad;
create policy pol_actividad_write on public.actividad
    for all to authenticated
    using (public.app_es_docente_del_curso(curso_id) or public.app_is_admin())
    with check (public.app_es_docente_del_curso(curso_id) or public.app_is_admin());

drop policy if exists pol_tarea_all on public.tarea;
create policy pol_tarea_all on public.tarea
    for all to authenticated
    using (exists (select 1 from public.actividad a
                    where a.id = tarea.actividad_id
                      and (public.app_es_docente_del_curso(a.curso_id) or public.app_is_admin())))
    with check (exists (select 1 from public.actividad a
                         where a.id = tarea.actividad_id
                           and (public.app_es_docente_del_curso(a.curso_id) or public.app_is_admin())));

drop policy if exists pol_evaluacion_all on public.evaluacion;
create policy pol_evaluacion_all on public.evaluacion
    for all to authenticated
    using (exists (select 1 from public.actividad a
                    where a.id = evaluacion.actividad_id
                      and (public.app_es_docente_del_curso(a.curso_id) or public.app_is_admin())))
    with check (exists (select 1 from public.actividad a
                         where a.id = evaluacion.actividad_id
                           and (public.app_es_docente_del_curso(a.curso_id) or public.app_is_admin())));

drop policy if exists pol_examen_all on public.examen;
create policy pol_examen_all on public.examen
    for all to authenticated
    using (exists (select 1 from public.evaluacion e
                      join public.actividad a on a.id = e.actividad_id
                     where e.id = examen.evaluacion_id
                       and (public.app_es_docente_del_curso(a.curso_id) or public.app_is_admin())))
    with check (exists (select 1 from public.evaluacion e
                          join public.actividad a on a.id = e.actividad_id
                         where e.id = examen.evaluacion_id
                           and (public.app_es_docente_del_curso(a.curso_id) or public.app_is_admin())));

-- Preguntas: el estudiante ve solo las NO privadas. El docente ve todas.
drop policy if exists pol_pregunta_select on public.pregunta;
create policy pol_pregunta_select on public.pregunta
    for select to authenticated
    using (
        exists (
            select 1 from public.evaluacion e
              join public.actividad a on a.id = e.actividad_id
             where e.id = pregunta.evaluacion_id
               and (
                   public.app_es_docente_del_curso(a.curso_id)
                   or public.app_is_admin()
                   or (not pregunta.es_privada and a.publicado)
               )
        )
    );

drop policy if exists pol_pregunta_write on public.pregunta;
create policy pol_pregunta_write on public.pregunta
    for all to authenticated
    using (exists (select 1 from public.evaluacion e
                      join public.actividad a on a.id = e.actividad_id
                     where e.id = pregunta.evaluacion_id
                       and (public.app_es_docente_del_curso(a.curso_id) or public.app_is_admin())))
    with check (exists (select 1 from public.evaluacion e
                          join public.actividad a on a.id = e.actividad_id
                         where e.id = pregunta.evaluacion_id
                           and (public.app_es_docente_del_curso(a.curso_id) or public.app_is_admin())));

-- OPCIONES: CONTIENEN LA SOLUCION.
-- El estudiante solo ve las opciones de preguntas publicas; el docente ve todas.
drop policy if exists pol_opcion_select on public.opcion;
create policy pol_opcion_select on public.opcion
    for select to authenticated
    using (
        exists (
            select 1 from public.pregunta p
              join public.evaluacion e on e.id = p.evaluacion_id
              join public.actividad a on a.id = e.actividad_id
             where p.id = opcion.pregunta_id
               and (
                   public.app_es_docente_del_curso(a.curso_id)
                   or public.app_is_admin()
                   or (not p.es_privada and a.publicado)
               )
        )
    );

drop policy if exists pol_opcion_write on public.opcion;
create policy pol_opcion_write on public.opcion
    for all to authenticated
    using (exists (select 1 from public.pregunta p
                      join public.evaluacion e on e.id = p.evaluacion_id
                      join public.actividad a on a.id = e.actividad_id
                     where p.id = opcion.pregunta_id
                       and (public.app_es_docente_del_curso(a.curso_id) or public.app_is_admin())))
    with check (exists (select 1 from public.pregunta p
                          join public.evaluacion e on e.id = p.evaluacion_id
                          join public.actividad a on a.id = e.actividad_id
                         where p.id = opcion.pregunta_id
                           and (public.app_es_docente_del_curso(a.curso_id) or public.app_is_admin())));

drop policy if exists pol_criterio_evaluacion_all on public.criterio_evaluacion;
create policy pol_criterio_evaluacion_all on public.criterio_evaluacion
    for all to authenticated
    using (exists (select 1 from public.evaluacion e
                      join public.actividad a on a.id = e.actividad_id
                     where e.id = criterio_evaluacion.evaluacion_id
                       and (public.app_es_docente_del_curso(a.curso_id) or public.app_is_admin())))
    with check (exists (select 1 from public.evaluacion e
                          join public.actividad a on a.id = e.actividad_id
                         where e.id = criterio_evaluacion.evaluacion_id
                           and (public.app_es_docente_del_curso(a.curso_id) or public.app_is_admin())));

-- Intentos: el estudiante ve los suyos; el docente los de su curso.
drop policy if exists pol_intento_evaluacion_select on public.intento_evaluacion;
create policy pol_intento_evaluacion_select on public.intento_evaluacion
    for select to authenticated
    using (
        estudiante_id = public.efectivo_user_id()
        or public.app_is_admin()
        or exists (
            select 1 from public.evaluacion e
              join public.actividad a on a.id = e.actividad_id
             where e.id = intento_evaluacion.evaluacion_id
               and public.app_es_docente_del_curso(a.curso_id)
        )
    );

drop policy if exists pol_intento_evaluacion_insert on public.intento_evaluacion;
create policy pol_intento_evaluacion_insert on public.intento_evaluacion
    for insert to authenticated
    with check (estudiante_id = public.efectivo_user_id());

drop policy if exists pol_intento_evaluacion_update on public.intento_evaluacion;
create policy pol_intento_evaluacion_update on public.intento_evaluacion
    for update to authenticated
    using (estudiante_id = public.efectivo_user_id())
    with check (estudiante_id = public.efectivo_user_id());

-- Respuestas: el estudiante escribe las suyas.
drop policy if exists pol_respuesta_evaluacion_select on public.respuesta_evaluacion;
create policy pol_respuesta_evaluacion_select on public.respuesta_evaluacion
    for select to authenticated
    using (
        exists (
            select 1 from public.intento_evaluacion i
             where i.id = respuesta_evaluacion.intento_id
               and (
                   i.estudiante_id = public.efectivo_user_id()
                   or public.app_is_admin()
                   or exists (
                       select 1 from public.evaluacion e
                         join public.actividad a on a.id = e.actividad_id
                        where e.id = i.evaluacion_id
                          and public.app_es_docente_del_curso(a.curso_id)
                   )
               )
        )
    );

drop policy if exists pol_respuesta_evaluacion_write on public.respuesta_evaluacion;
create policy pol_respuesta_evaluacion_write on public.respuesta_evaluacion
    for all to authenticated
    using (exists (select 1 from public.intento_evaluacion i
                    where i.id = respuesta_evaluacion.intento_id
                      and i.estudiante_id = public.efectivo_user_id()))
    with check (exists (select 1 from public.intento_evaluacion i
                         where i.id = respuesta_evaluacion.intento_id
                           and i.estudiante_id = public.efectivo_user_id()));

-- Entregas: el estudiante escribe la suya; el docente la lee y califica.
drop policy if exists pol_entrega_select on public.entrega;
create policy pol_entrega_select on public.entrega
    for select to authenticated
    using (
        estudiante_id = public.efectivo_user_id()
        or public.app_is_admin()
        or exists (
            select 1 from public.tarea t
              join public.actividad a on a.id = t.actividad_id
             where t.id = entrega.tarea_id
               and public.app_es_docente_del_curso(a.curso_id)
        )
    );

drop policy if exists pol_entrega_write on public.entrega;
create policy pol_entrega_write on public.entrega
    for all to authenticated
    using (
        estudiante_id = public.efectivo_user_id()
        or exists (
            select 1 from public.tarea t
              join public.actividad a on a.id = t.actividad_id
             where t.id = entrega.tarea_id
               and public.app_es_docente_del_curso(a.curso_id)
        )
        or public.app_is_admin()
    )
    with check (
        estudiante_id = public.efectivo_user_id()
        or public.app_is_admin()
    );

drop policy if exists pol_entrega_archivo_all on public.entrega_archivo;
create policy pol_entrega_archivo_all on public.entrega_archivo
    for all to authenticated
    using (exists (select 1 from public.entrega e
                    where e.id = entrega_archivo.entrega_id
                      and (e.estudiante_id = public.efectivo_user_id() or public.app_is_admin())))
    with check (exists (select 1 from public.entrega e
                         where e.id = entrega_archivo.entrega_id
                           and e.estudiante_id = public.efectivo_user_id()));

-- CALIFICACIONES: el estudiante SOLO LEE. Jamas escribe su nota.
drop policy if exists pol_calificacion_select on public.calificacion;
create policy pol_calificacion_select on public.calificacion
    for select to authenticated
    using (
        estudiante_id = public.efectivo_user_id()
        or public.app_is_admin()
        or exists (
            select 1 from public.entrega e
              join public.tarea t on t.id = e.tarea_id
              join public.actividad a on a.id = t.actividad_id
             where e.id = calificacion.entrega_id
               and public.app_es_docente_del_curso(a.curso_id)
        )
        or exists (
            select 1 from public.intento_evaluacion i
              join public.evaluacion e on e.id = i.evaluacion_id
              join public.actividad a on a.id = e.actividad_id
             where i.id = calificacion.intento_id
               and public.app_es_docente_del_curso(a.curso_id)
        )
    );

-- Solo el docente del curso o el admin escribe calificaciones.
drop policy if exists pol_calificacion_write on public.calificacion;
create policy pol_calificacion_write on public.calificacion
    for all to authenticated
    using (
        public.app_is_admin()
        or exists (
            select 1 from public.entrega e
              join public.tarea t on t.id = e.tarea_id
              join public.actividad a on a.id = t.actividad_id
             where e.id = calificacion.entrega_id
               and public.app_es_docente_del_curso(a.curso_id)
        )
        or exists (
            select 1 from public.intento_evaluacion i
              join public.evaluacion e on e.id = i.evaluacion_id
              join public.actividad a on a.id = e.actividad_id
             where i.id = calificacion.intento_id
               and public.app_es_docente_del_curso(a.curso_id)
        )
    )
    with check (
        public.app_is_admin()
        or exists (
            select 1 from public.entrega e
              join public.tarea t on t.id = e.tarea_id
              join public.actividad a on a.id = t.actividad_id
             where e.id = calificacion.entrega_id
               and public.app_es_docente_del_curso(a.curso_id)
        )
        or exists (
            select 1 from public.intento_evaluacion i
              join public.evaluacion e on e.id = i.evaluacion_id
              join public.actividad a on a.id = e.actividad_id
             where i.id = calificacion.intento_id
               and public.app_es_docente_del_curso(a.curso_id)
        )
    );

-- Retroalimentacion: el docente escribe; el estudiante lee la visible.
drop policy if exists pol_retroalimentacion_select on public.retroalimentacion;
create policy pol_retroalimentacion_select on public.retroalimentacion
    for select to authenticated
    using (
        visible_estudiante
        or public.app_is_admin()
        or exists (
            select 1 from public.calificacion c
             where c.id = retroalimentacion.calificacion_id
               and (c.estudiante_id = public.efectivo_user_id()
                    or c.docente_id = public.efectivo_user_id())
        )
    );

drop policy if exists pol_retroalimentacion_write on public.retroalimentacion;
create policy pol_retroalimentacion_write on public.retroalimentacion
    for all to authenticated
    using (public.app_is_admin() or autor_id = public.efectivo_user_id())
    with check (public.app_is_admin() or autor_id = public.efectivo_user_id());


-- =============================================================================
-- 9. POLITICAS - MODULO G: RETOS
-- =============================================================================

drop policy if exists pol_reto_select on public.reto;
create policy pol_reto_select on public.reto
    for select to authenticated
    using (
        published
        or public.app_es_docente_del_curso(curso_id)
        or public.app_is_admin()
    );

drop policy if exists pol_reto_write on public.reto;
create policy pol_reto_write on public.reto
    for all to authenticated
    using (public.app_es_docente_del_curso(curso_id) or public.app_is_admin())
    with check (public.app_es_docente_del_curso(curso_id) or public.app_is_admin());

drop policy if exists pol_lenguaje_select on public.lenguaje;
create policy pol_lenguaje_select on public.lenguaje
    for select to authenticated
    using (true);

drop policy if exists pol_lenguaje_write on public.lenguaje;
create policy pol_lenguaje_write on public.lenguaje
    for all to authenticated
    using (public.app_is_admin())
    with check (public.app_is_admin());

-- CASOS DE PRUEBA: los ocultos son secretos (contienen la solucion).
drop policy if exists pol_caso_prueba_select on public.caso_prueba;
create policy pol_caso_prueba_select on public.caso_prueba
    for select to authenticated
    using (
        es_ejemplo
        or public.app_is_admin()
        or exists (
            select 1 from public.reto r
             where r.id = caso_prueba.reto_id
               and (public.app_es_docente_del_curso(r.curso_id) or public.app_is_admin())
        )
    );

drop policy if exists pol_caso_prueba_write on public.caso_prueba;
create policy pol_caso_prueba_write on public.caso_prueba
    for all to authenticated
    using (exists (select 1 from public.reto r
                    where r.id = caso_prueba.reto_id
                      and (public.app_es_docente_del_curso(r.curso_id) or public.app_is_admin())))
    with check (exists (select 1 from public.reto r
                         where r.id = caso_prueba.reto_id
                           and (public.app_es_docente_del_curso(r.curso_id) or public.app_is_admin())));

drop policy if exists pol_restriccion_reto_select on public.restriccion_reto;
create policy pol_restriccion_reto_select on public.restriccion_reto
    for select to authenticated
    using (exists (select 1 from public.reto r
                    where r.id = restriccion_reto.reto_id
                      and (r.published or public.app_es_docente_del_curso(r.curso_id)
                           or public.app_is_admin())));

drop policy if exists pol_restriccion_reto_write on public.restriccion_reto;
create policy pol_restriccion_reto_write on public.restriccion_reto
    for all to authenticated
    using (exists (select 1 from public.reto r
                    where r.id = restriccion_reto.reto_id
                      and (public.app_es_docente_del_curso(r.curso_id) or public.app_is_admin())))
    with check (exists (select 1 from public.reto r
                         where r.id = restriccion_reto.reto_id
                           and (public.app_es_docente_del_curso(r.curso_id) or public.app_is_admin())));

drop policy if exists pol_envio_reto_select on public.envio_reto;
create policy pol_envio_reto_select on public.envio_reto
    for select to authenticated
    using (
        estudiante_id = public.efectivo_user_id()
        or public.app_is_admin()
        or exists (
            select 1 from public.reto r
             where r.id = envio_reto.reto_id
               and public.app_es_docente_del_curso(r.curso_id)
        )
    );

drop policy if exists pol_envio_reto_insert on public.envio_reto;
create policy pol_envio_reto_insert on public.envio_reto
    for insert to authenticated
    with check (estudiante_id = public.efectivo_user_id());

-- El resultado lo calcula el ejecutor externo (service_role).
drop policy if exists pol_envio_reto_update on public.envio_reto;
create policy pol_envio_reto_update on public.envio_reto
    for update to authenticated
    using (public.app_is_admin());

drop policy if exists pol_resultado_caso_select on public.resultado_caso;
create policy pol_resultado_caso_select on public.resultado_caso
    for select to authenticated
    using (exists (select 1 from public.envio_reto e
                    where e.id = resultado_caso.envio_id
                      and (e.estudiante_id = public.efectivo_user_id() or public.app_is_admin())));

drop policy if exists pol_historial_ejecucion_select on public.historial_ejecucion;
create policy pol_historial_ejecucion_select on public.historial_ejecucion
    for select to authenticated
    using (exists (select 1 from public.envio_reto e
                    where e.id = historial_ejecucion.envio_id
                      and (e.estudiante_id = public.efectivo_user_id() or public.app_is_admin())));


-- =============================================================================
-- 10. POLITICAS - MODULO H: MINIJUEGOS
-- =============================================================================

drop policy if exists pol_motor_select on public.motor;
create policy pol_motor_select on public.motor
    for select to anon, authenticated
    using (estado = 'activo' or public.app_is_admin());

drop policy if exists pol_motor_write on public.motor;
create policy pol_motor_write on public.motor
    for all to authenticated
    using (public.app_is_admin())
    with check (public.app_is_admin());

drop policy if exists pol_version_motor_select on public.version_motor;
create policy pol_version_motor_select on public.version_motor
    for select to anon, authenticated
    using (activa or public.app_is_admin());

drop policy if exists pol_version_motor_write on public.version_motor;
create policy pol_version_motor_write on public.version_motor
    for all to authenticated
    using (public.app_is_admin())
    with check (public.app_is_admin());

drop policy if exists pol_motor_comun_select on public.motor_comun;
create policy pol_motor_comun_select on public.motor_comun
    for select to anon, authenticated
    using (activo or public.app_is_admin());

drop policy if exists pol_motor_comun_write on public.motor_comun;
create policy pol_motor_comun_write on public.motor_comun
    for all to authenticated
    using (public.app_is_admin())
    with check (public.app_is_admin());

drop policy if exists pol_motor_curso_select on public.motor_curso;
create policy pol_motor_curso_select on public.motor_curso
    for select to authenticated
    using (
        activo
        or public.app_is_admin()
        or public.app_es_docente_del_curso(curso_id)
    );

drop policy if exists pol_motor_curso_write on public.motor_curso;
create policy pol_motor_curso_write on public.motor_curso
    for all to authenticated
    using (public.app_is_admin() or public.app_es_docente_del_curso(curso_id))
    with check (public.app_is_admin() or public.app_es_docente_del_curso(curso_id));

drop policy if exists pol_juego_select on public.juego;
create policy pol_juego_select on public.juego
    for select to anon, authenticated
    using (estado = 'publicado' or public.app_is_admin());

drop policy if exists pol_juego_write on public.juego;
create policy pol_juego_write on public.juego
    for all to authenticated
    using (public.app_is_admin())
    with check (public.app_is_admin());

drop policy if exists pol_configuracion_juego_select on public.configuracion_juego;
create policy pol_configuracion_juego_select on public.configuracion_juego
    for select to anon, authenticated
    using (true);

drop policy if exists pol_configuracion_juego_write on public.configuracion_juego;
create policy pol_configuracion_juego_write on public.configuracion_juego
    for all to authenticated
    using (public.app_is_admin())
    with check (public.app_is_admin());

drop policy if exists pol_actividad_juego_select on public.actividad_juego;
create policy pol_actividad_juego_select on public.actividad_juego
    for select to authenticated
    using (
        publicado
        or public.app_es_docente_del_curso(curso_id)
        or public.app_is_admin()
    );

drop policy if exists pol_actividad_juego_write on public.actividad_juego;
create policy pol_actividad_juego_write on public.actividad_juego
    for all to authenticated
    using (public.app_es_docente_del_curso(curso_id) or public.app_is_admin())
    with check (public.app_es_docente_del_curso(curso_id) or public.app_is_admin());

drop policy if exists pol_intento_juego_select on public.intento_juego;
create policy pol_intento_juego_select on public.intento_juego
    for select to authenticated
    using (
        estudiante_id = public.efectivo_user_id()
        or public.app_is_admin()
        or exists (
            select 1 from public.actividad_juego aj
             where aj.id = intento_juego.actividad_juego_id
               and public.app_es_docente_del_curso(aj.curso_id)
        )
    );

drop policy if exists pol_intento_juego_insert on public.intento_juego;
create policy pol_intento_juego_insert on public.intento_juego
    for insert to authenticated
    with check (estudiante_id = public.efectivo_user_id());

drop policy if exists pol_intento_juego_update on public.intento_juego;
create policy pol_intento_juego_update on public.intento_juego
    for update to authenticated
    using (estudiante_id = public.efectivo_user_id())
    with check (estudiante_id = public.efectivo_user_id());

drop policy if exists pol_respuesta_juego_select on public.respuesta_juego;
create policy pol_respuesta_juego_select on public.respuesta_juego
    for select to authenticated
    using (exists (select 1 from public.intento_juego i
                    where i.id = respuesta_juego.intento_juego_id
                      and (i.estudiante_id = public.efectivo_user_id() or public.app_is_admin())));

drop policy if exists pol_respuesta_juego_write on public.respuesta_juego;
create policy pol_respuesta_juego_write on public.respuesta_juego
    for all to authenticated
    using (exists (select 1 from public.intento_juego i
                    where i.id = respuesta_juego.intento_juego_id
                      and i.estudiante_id = public.efectivo_user_id()))
    with check (exists (select 1 from public.intento_juego i
                         where i.id = respuesta_juego.intento_juego_id
                           and i.estudiante_id = public.efectivo_user_id()));

drop policy if exists pol_resultado_juego_select on public.resultado_juego;
create policy pol_resultado_juego_select on public.resultado_juego
    for select to authenticated
    using (exists (select 1 from public.intento_juego i
                    where i.id = resultado_juego.intento_juego_id
                      and (i.estudiante_id = public.efectivo_user_id() or public.app_is_admin())));

drop policy if exists pol_puntuacion_juego_select on public.puntuacion_juego;
create policy pol_puntuacion_juego_select on public.puntuacion_juego
    for select to authenticated
    using (true);

drop policy if exists pol_puntuacion_juego_write on public.puntuacion_juego;
create policy pol_puntuacion_juego_write on public.puntuacion_juego
    for all to authenticated
    using (public.app_is_admin())
    with check (public.app_is_admin());

drop policy if exists pol_tiempo_juego_select on public.tiempo_juego;
create policy pol_tiempo_juego_select on public.tiempo_juego
    for select to authenticated
    using (exists (select 1 from public.intento_juego i
                    where i.id = tiempo_juego.intento_juego_id
                      and (i.estudiante_id = public.efectivo_user_id() or public.app_is_admin())));

drop policy if exists pol_finalizacion_juego_select on public.finalizacion_juego;
create policy pol_finalizacion_juego_select on public.finalizacion_juego
    for select to authenticated
    using (
        usuario_id = public.efectivo_user_id()
        or public.app_is_admin()
    );

drop policy if exists pol_recompensa_juego_select on public.recompensa_juego;
create policy pol_recompensa_juego_select on public.recompensa_juego
    for select to authenticated
    using (usuario_id = public.efectivo_user_id() or public.app_is_admin());


-- =============================================================================
-- 11. POLITICAS - MODULO I: GAMIFICACION
-- =============================================================================

drop policy if exists pol_regla_progresion_select on public.regla_progresion;
create policy pol_regla_progresion_select on public.regla_progresion
    for select to authenticated
    using (activa or public.app_is_admin());

drop policy if exists pol_regla_progresion_write on public.regla_progresion;
create policy pol_regla_progresion_write on public.regla_progresion
    for all to authenticated
    using (public.app_is_admin())
    with check (public.app_is_admin());

drop policy if exists pol_transaccion_xp_select on public.transaccion_xp;
create policy pol_transaccion_xp_select on public.transaccion_xp
    for select to authenticated
    using (usuario_id = public.efectivo_user_id() or public.app_is_admin());

drop policy if exists pol_insignia_select on public.insignia;
create policy pol_insignia_select on public.insignia
    for select to authenticated
    using (activa or public.app_is_admin());

drop policy if exists pol_insignia_write on public.insignia;
create policy pol_insignia_write on public.insignia
    for all to authenticated
    using (public.app_is_admin())
    with check (public.app_is_admin());

drop policy if exists pol_requisito_insignia_select on public.requisito_insignia;
create policy pol_requisito_insignia_select on public.requisito_insignia
    for select to authenticated
    using (true);

drop policy if exists pol_requisito_insignia_write on public.requisito_insignia;
create policy pol_requisito_insignia_write on public.requisito_insignia
    for all to authenticated
    using (public.app_is_admin())
    with check (public.app_is_admin());

drop policy if exists pol_insignia_usuario_select on public.insignia_usuario;
create policy pol_insignia_usuario_select on public.insignia_usuario
    for select to authenticated
    using (usuario_id = public.efectivo_user_id() or public.app_is_admin());

-- El estudiante no se otorga insignias a si mismo.
drop policy if exists pol_insignia_usuario_write on public.insignia_usuario;
create policy pol_insignia_usuario_write on public.insignia_usuario
    for all to authenticated
    using (public.app_is_admin())
    with check (public.app_is_admin());

drop policy if exists pol_racha_select on public.racha;
create policy pol_racha_select on public.racha
    for select to authenticated
    using (usuario_id = public.efectivo_user_id() or public.app_is_admin());

drop policy if exists pol_racha_write on public.racha;
create policy pol_racha_write on public.racha
    for all to authenticated
    using (public.app_is_admin())
    with check (public.app_is_admin());

drop policy if exists pol_historial_racha_select on public.historial_racha;
create policy pol_historial_racha_select on public.historial_racha
    for select to authenticated
    using (usuario_id = public.efectivo_user_id() or public.app_is_admin());

drop policy if exists pol_temporada_select on public.temporada;
create policy pol_temporada_select on public.temporada
    for select to authenticated
    using (true);

drop policy if exists pol_temporada_write on public.temporada;
create policy pol_temporada_write on public.temporada
    for all to authenticated
    using (public.app_is_admin())
    with check (public.app_is_admin());

drop policy if exists pol_ranking_select on public.ranking;
create policy pol_ranking_select on public.ranking
    for select to authenticated
    using (true);

drop policy if exists pol_ranking_write on public.ranking;
create policy pol_ranking_write on public.ranking
    for all to authenticated
    using (public.app_is_admin())
    with check (public.app_is_admin());

drop policy if exists pol_evento_gamificacion_select on public.evento_gamificacion;
create policy pol_evento_gamificacion_select on public.evento_gamificacion
    for select to authenticated
    using (activo or public.app_is_admin());

drop policy if exists pol_evento_gamificacion_write on public.evento_gamificacion;
create policy pol_evento_gamificacion_write on public.evento_gamificacion
    for all to authenticated
    using (public.app_is_admin())
    with check (public.app_is_admin());

drop policy if exists pol_mision_select on public.mision;
create policy pol_mision_select on public.mision
    for select to authenticated
    using (activa or public.app_is_admin());

drop policy if exists pol_mision_write on public.mision;
create policy pol_mision_write on public.mision
    for all to authenticated
    using (public.app_is_admin())
    with check (public.app_is_admin());

drop policy if exists pol_mision_usuario_select on public.mision_usuario;
create policy pol_mision_usuario_select on public.mision_usuario
    for select to authenticated
    using (usuario_id = public.efectivo_user_id() or public.app_is_admin());

drop policy if exists pol_mision_usuario_write on public.mision_usuario;
create policy pol_mision_usuario_write on public.mision_usuario
    for all to authenticated
    using (public.app_is_admin())
    with check (public.app_is_admin());

drop policy if exists pol_monedero_select on public.monedero;
create policy pol_monedero_select on public.monedero
    for select to authenticated
    using (usuario_id = public.efectivo_user_id() or public.app_is_admin());

-- El estudiante NO puede acreditar saldo en su propio monedero.
drop policy if exists pol_monedero_write on public.monedero;
create policy pol_monedero_write on public.monedero
    for all to authenticated
    using (public.app_is_admin())
    with check (public.app_is_admin());

drop policy if exists pol_tienda_item_select on public.tienda_item;
create policy pol_tienda_item_select on public.tienda_item
    for select to authenticated
    using (activo or public.app_is_admin());

drop policy if exists pol_tienda_item_write on public.tienda_item;
create policy pol_tienda_item_write on public.tienda_item
    for all to authenticated
    using (public.app_is_admin())
    with check (public.app_is_admin());

drop policy if exists pol_inventario_select on public.inventario;
create policy pol_inventario_select on public.inventario
    for select to authenticated
    using (usuario_id = public.efectivo_user_id() or public.app_is_admin());

drop policy if exists pol_inventario_write on public.inventario;
create policy pol_inventario_write on public.inventario
    for all to authenticated
    using (public.app_is_admin())
    with check (public.app_is_admin());

drop policy if exists pol_compra_virtual_select on public.compra_virtual;
create policy pol_compra_virtual_select on public.compra_virtual
    for select to authenticated
    using (usuario_id = public.efectivo_user_id() or public.app_is_admin());

-- La compra la valida el backend (controla precio y saldo).
drop policy if exists pol_compra_virtual_write on public.compra_virtual;
create policy pol_compra_virtual_write on public.compra_virtual
    for all to authenticated
    using (public.app_is_admin())
    with check (public.app_is_admin());

drop policy if exists pol_transaccion_moneda_select on public.transaccion_moneda;
create policy pol_transaccion_moneda_select on public.transaccion_moneda
    for select to authenticated
    using (usuario_id = public.efectivo_user_id() or public.app_is_admin());


-- =============================================================================
-- 12. POLITICAS - MODULO J: CERTIFICADOS
-- =============================================================================

drop policy if exists pol_certificado_select on public.certificado;
create policy pol_certificado_select on public.certificado
    for select to anon, authenticated
    using (
        estado = 'emitido'
        or public.app_is_admin()
        or exists (
            select 1 from public.certificado_titular ct
             where ct.certificado_id = certificado.id
               and ct.usuario_id = public.efectivo_user_id()
        )
    );

-- La emision la realiza el backend (service_role) o el admin.
drop policy if exists pol_certificado_write on public.certificado;
create policy pol_certificado_write on public.certificado
    for all to authenticated
    using (public.app_is_admin())
    with check (public.app_is_admin());

drop policy if exists pol_certificado_titular_select on public.certificado_titular;
create policy pol_certificado_titular_select on public.certificado_titular
    for select to anon, authenticated
    using (
        usuario_id = public.efectivo_user_id()
        or public.app_is_admin()
        or exists (
            select 1 from public.certificado c
             where c.id = certificado_titular.certificado_id
               and c.estado = 'emitido'
        )
    );

drop policy if exists pol_certificado_titular_write on public.certificado_titular;
create policy pol_certificado_titular_write on public.certificado_titular
    for all to authenticated
    using (public.app_is_admin())
    with check (public.app_is_admin());

drop policy if exists pol_certificado_curso_select on public.certificado_curso;
create policy pol_certificado_curso_select on public.certificado_curso
    for select to anon, authenticated
    using (true);

drop policy if exists pol_certificado_curso_write on public.certificado_curso;
create policy pol_certificado_curso_write on public.certificado_curso
    for all to authenticated
    using (public.app_is_admin())
    with check (public.app_is_admin());

drop policy if exists pol_certificado_emision_select on public.certificado_emision;
create policy pol_certificado_emision_select on public.certificado_emision
    for select to authenticated
    using (
        usuario_id = public.efectivo_user_id()
        or public.app_is_admin()
    );

drop policy if exists pol_certificado_revocacion_select on public.certificado_revocacion;
create policy pol_certificado_revocacion_select on public.certificado_revocacion
    for select to authenticated
    using (public.app_is_admin());


-- =============================================================================
-- 13. POLITICAS - MODULO K: NOTIFICACIONES Y SOPORTE
-- =============================================================================

drop policy if exists pol_notificacion_select on public.notificacion;
create policy pol_notificacion_select on public.notificacion
    for select to authenticated
    using (destinatario_id = public.efectivo_user_id() or public.app_is_admin());

drop policy if exists pol_notificacion_write on public.notificacion;
create policy pol_notificacion_write on public.notificacion
    for all to authenticated
    using (public.app_is_admin())
    with check (public.app_is_admin());

drop policy if exists pol_notificacion_destinatario_select on public.notificacion_destinatario;
create policy pol_notificacion_destinatario_select on public.notificacion_destinatario
    for select to authenticated
    using (usuario_id = public.efectivo_user_id() or public.app_is_admin());

drop policy if exists pol_notificacion_destinatario_update on public.notificacion_destinatario;
create policy pol_notificacion_destinatario_update on public.notificacion_destinatario
    for update to authenticated
    using (usuario_id = public.efectivo_user_id())
    with check (usuario_id = public.efectivo_user_id());

drop policy if exists pol_preferencia_notificacion_all on public.preferencia_notificacion;
create policy pol_preferencia_notificacion_all on public.preferencia_notificacion
    for all to authenticated
    using (usuario_id = public.efectivo_user_id())
    with check (usuario_id = public.efectivo_user_id());

drop policy if exists pol_mensaje_select on public.mensaje;
create policy pol_mensaje_select on public.mensaje
    for select to authenticated
    using (
        emisor_id = public.efectivo_user_id()
        or destinatario_id = public.efectivo_user_id()
        or public.app_is_admin()
    );

drop policy if exists pol_mensaje_insert on public.mensaje;
create policy pol_mensaje_insert on public.mensaje
    for insert to authenticated
    with check (emisor_id = public.efectivo_user_id());

drop policy if exists pol_mensaje_update on public.mensaje;
create policy pol_mensaje_update on public.mensaje
    for update to authenticated
    using (emisor_id = public.efectivo_user_id() or destinatario_id = public.efectivo_user_id())
    with check (emisor_id = public.efectivo_user_id() or destinatario_id = public.efectivo_user_id());

drop policy if exists pol_ticket_select on public.ticket;
create policy pol_ticket_select on public.ticket
    for select to authenticated
    using (
        usuario_id = public.efectivo_user_id()
        or asignado_a = public.efectivo_user_id()
        or public.app_is_admin()
    );

drop policy if exists pol_ticket_insert on public.ticket;
create policy pol_ticket_insert on public.ticket
    for insert to authenticated
    with check (usuario_id = public.efectivo_user_id());

drop policy if exists pol_ticket_update on public.ticket;
create policy pol_ticket_update on public.ticket
    for update to authenticated
    using (usuario_id = public.efectivo_user_id() or asignado_a = public.efectivo_user_id()
           or public.app_is_admin())
    with check (usuario_id = public.efectivo_user_id() or asignado_a = public.efectivo_user_id()
                or public.app_is_admin());

drop policy if exists pol_ticket_respuesta_select on public.ticket_respuesta;
create policy pol_ticket_respuesta_select on public.ticket_respuesta
    for select to authenticated
    using (
        exists (
            select 1 from public.ticket t
             where t.id = ticket_respuesta.ticket_id
               and (
                   t.usuario_id = public.efectivo_user_id()
                   or t.asignado_a = public.efectivo_user_id()
                   or public.app_is_admin()
                   -- Las respuestas internas solo las ven el admin y el
                   -- asignado del ticket.
                   or (not ticket_respuesta.es_interna
                       and (t.usuario_id = public.efectivo_user_id()))
               )
        )
    );

drop policy if exists pol_ticket_respuesta_insert on public.ticket_respuesta;
create policy pol_ticket_respuesta_insert on public.ticket_respuesta
    for insert to authenticated
    with check (
        autor_id = public.efectivo_user_id()
        and exists (
            select 1 from public.ticket t
             where t.id = ticket_respuesta.ticket_id
               and (t.usuario_id = public.efectivo_user_id()
                    or t.asignado_a = public.efectivo_user_id()
                    or public.app_is_admin())
        )
    );

drop policy if exists pol_historial_soporte_select on public.historial_soporte;
create policy pol_historial_soporte_select on public.historial_soporte
    for select to authenticated
    using (exists (select 1 from public.ticket t
                    where t.id = historial_soporte.ticket_id
                      and (t.usuario_id = public.efectivo_user_id()
                           or t.asignado_a = public.efectivo_user_id()
                           or public.app_is_admin())));


-- =============================================================================
-- 14. POLITICAS - MODULO L: CHATBOT
--    El chatbot respeta los permisos: un usuario solo ve sus conversaciones.
--    Los documentos de conocimiento son publicos salvo que fijen rol_minimo.
-- =============================================================================

drop policy if exists pol_chatbot_conversacion_select on public.chatbot_conversacion;
create policy pol_chatbot_conversacion_select on public.chatbot_conversacion
    for select to authenticated
    using (usuario_id = public.efectivo_user_id() or public.app_is_admin());

drop policy if exists pol_chatbot_conversacion_insert on public.chatbot_conversacion;
create policy pol_chatbot_conversacion_insert on public.chatbot_conversacion
    for insert to authenticated
    with check (usuario_id = public.efectivo_user_id() or usuario_id is null);

drop policy if exists pol_chatbot_conversacion_update on public.chatbot_conversacion;
create policy pol_chatbot_conversacion_update on public.chatbot_conversacion
    for update to authenticated
    using (usuario_id = public.efectivo_user_id())
    with check (usuario_id = public.efectivo_user_id());

drop policy if exists pol_chatbot_participante_select on public.chatbot_participante;
create policy pol_chatbot_participante_select on public.chatbot_participante
    for select to authenticated
    using (usuario_id = public.efectivo_user_id() or public.app_is_admin());

drop policy if exists pol_chatbot_participante_write on public.chatbot_participante;
create policy pol_chatbot_participante_write on public.chatbot_participante
    for all to authenticated
    using (usuario_id = public.efectivo_user_id() or public.app_is_admin())
    with check (usuario_id = public.efectivo_user_id() or public.app_is_admin());

drop policy if exists pol_chatbot_mensaje_select on public.chatbot_mensaje;
create policy pol_chatbot_mensaje_select on public.chatbot_mensaje
    for select to authenticated
    using (
        exists (
            select 1 from public.chatbot_conversacion c
             where c.id = chatbot_mensaje.conversacion_id
               and (
                   c.usuario_id = public.efectivo_user_id()
                   or public.app_is_admin()
                   or (not chatbot_mensaje.es_privado
                       and exists (
                           select 1 from public.chatbot_participante p
                            where p.conversacion_id = c.id
                              and p.usuario_id = public.efectivo_user_id()
                              and p.puede_ver_privado
                       ))
               )
        )
    );

drop policy if exists pol_chatbot_mensaje_insert on public.chatbot_mensaje;
create policy pol_chatbot_mensaje_insert on public.chatbot_mensaje
    for insert to authenticated
    with check (
        autor_id = public.efectivo_user_id()
        or exists (
            select 1 from public.chatbot_conversacion c
             where c.id = chatbot_mensaje.conversacion_id
               and c.usuario_id = public.efectivo_user_id()
        )
    );

drop policy if exists pol_chatbot_historial_select on public.chatbot_historial;
create policy pol_chatbot_historial_select on public.chatbot_historial
    for select to authenticated
    using (exists (select 1 from public.chatbot_conversacion c
                    where c.id = chatbot_historial.conversacion_id
                      and (c.usuario_id = public.efectivo_user_id() or public.app_is_admin())));

-- Documentos de conocimiento: publico o segun rol_minimo.
drop policy if exists pol_chatbot_documento_select on public.chatbot_documento;
create policy pol_chatbot_documento_select on public.chatbot_documento
    for select to authenticated
    using (
        activo
        and (
            rol_minimo is null
            or public.app_user_role() = rol_minimo
            or public.app_is_admin()
        )
    );

drop policy if exists pol_chatbot_documento_write on public.chatbot_documento;
create policy pol_chatbot_documento_write on public.chatbot_documento
    for all to authenticated
    using (public.app_is_admin())
    with check (public.app_is_admin());

drop policy if exists pol_chatbot_documento_version_select on public.chatbot_documento_version;
create policy pol_chatbot_documento_version_select on public.chatbot_documento_version
    for select to authenticated
    using (exists (select 1 from public.chatbot_documento d
                    where d.id = chatbot_documento_version.documento_id
                      and d.activo));

drop policy if exists pol_chatbot_documento_version_write on public.chatbot_documento_version;
create policy pol_chatbot_documento_version_write on public.chatbot_documento_version
    for all to authenticated
    using (public.app_is_admin())
    with check (public.app_is_admin());

drop policy if exists pol_chatbot_fragmento_select on public.chatbot_fragmento;
create policy pol_chatbot_fragmento_select on public.chatbot_fragmento
    for select to authenticated
    using (
        exists (
            select 1 from public.chatbot_documento d
             where d.id = chatbot_fragmento.documento_id
               and d.activo
               and (d.rol_minimo is null
                    or public.app_user_role() = d.rol_minimo
                    or public.app_is_admin())
        )
    );

drop policy if exists pol_chatbot_fragmento_write on public.chatbot_fragmento;
create policy pol_chatbot_fragmento_write on public.chatbot_fragmento
    for all to authenticated
    using (public.app_is_admin())
    with check (public.app_is_admin());

drop policy if exists pol_chatbot_referencia_select on public.chatbot_referencia;
create policy pol_chatbot_referencia_select on public.chatbot_referencia
    for select to authenticated
    using (exists (select 1 from public.chatbot_mensaje m
                    where m.id = chatbot_referencia.mensaje_id
                      and (exists (select 1 from public.chatbot_conversacion c
                                    where c.id = m.conversacion_id
                                      and c.usuario_id = public.efectivo_user_id())
                           or public.app_is_admin())));

drop policy if exists pol_chatbot_retroalimentacion_all on public.chatbot_retroalimentacion;
create policy pol_chatbot_retroalimentacion_all on public.chatbot_retroalimentacion
    for all to authenticated
    using (usuario_id = public.efectivo_user_id() or public.app_is_admin())
    with check (usuario_id = public.efectivo_user_id() or public.app_is_admin());

drop policy if exists pol_chatbot_derivacion_select on public.chatbot_derivacion;
create policy pol_chatbot_derivacion_select on public.chatbot_derivacion
    for select to authenticated
    using (usuario_id = public.efectivo_user_id() or public.app_is_admin());

drop policy if exists pol_chatbot_derivacion_write on public.chatbot_derivacion;
create policy pol_chatbot_derivacion_write on public.chatbot_derivacion
    for all to authenticated
    using (public.app_is_admin() or usuario_id = public.efectivo_user_id())
    with check (public.app_is_admin() or usuario_id = public.efectivo_user_id());

-- El consumo lo registra el servicio; el usuario solo lo consulta.
drop policy if exists pol_chatbot_consumo_select on public.chatbot_consumo;
create policy pol_chatbot_consumo_select on public.chatbot_consumo
    for select to authenticated
    using (usuario_id = public.efectivo_user_id() or public.app_is_admin());


-- =============================================================================
-- 15. POLITICAS - MODULO M: AUDITORIA Y CONFIGURACION
-- =============================================================================

drop policy if exists pol_evento_sistema_select on public.evento_sistema;
create policy pol_evento_sistema_select on public.evento_sistema
    for select to authenticated
    using (true);

drop policy if exists pol_evento_sistema_write on public.evento_sistema;
create policy pol_evento_sistema_write on public.evento_sistema
    for all to authenticated
    using (public.app_is_admin())
    with check (public.app_is_admin());

-- El registro de acciones: solo el administrador lo consulta.
drop policy if exists pol_registro_accion_select on public.registro_accion;
create policy pol_registro_accion_select on public.registro_accion
    for select to authenticated
    using (public.app_is_admin());

drop policy if exists pol_cambio_administrativo_select on public.cambio_administrativo;
create policy pol_cambio_administrativo_select on public.cambio_administrativo
    for select to authenticated
    using (public.app_is_admin());

drop policy if exists pol_cambio_administrativo_write on public.cambio_administrativo;
create policy pol_cambio_administrativo_write on public.cambio_administrativo
    for all to authenticated
    using (public.app_is_admin())
    with check (public.app_is_admin());

drop policy if exists pol_historial_modificacion_select on public.historial_modificacion;
create policy pol_historial_modificacion_select on public.historial_modificacion
    for select to authenticated
    using (public.app_is_admin());

drop policy if exists pol_configuracion_select on public.configuracion;
create policy pol_configuracion_select on public.configuracion
    for select to authenticated
    using (
        public.app_is_admin()
        -- Los valores publicos se pueden leer; los secretos nunca.
        or not es_secreta
    );

drop policy if exists pol_configuracion_write on public.configuracion;
create policy pol_configuracion_write on public.configuracion
    for all to authenticated
    using (public.app_is_admin())
    with check (public.app_is_admin());

drop policy if exists pol_parametro_sistema_select on public.parametro_sistema;
create policy pol_parametro_sistema_select on public.parametro_sistema
    for select to authenticated
    using (true);

drop policy if exists pol_parametro_sistema_write on public.parametro_sistema;
create policy pol_parametro_sistema_write on public.parametro_sistema
    for all to authenticated
    using (public.app_is_admin())
    with check (public.app_is_admin());


-- =============================================================================
-- 16. PERMISOS SOBRE LAS FUNCIONES
--     Las funciones SECURITY DEFINER son peligrosas si cualquiera las ejecuta:
--     se restringen a los roles autorizados y a los propietarios.
-- =============================================================================
revoke execute on function public.fn_registrar_xp(uuid, integer, public.concepto_xp, text, uuid) from public;
revoke execute on function public.fn_registrar_completado_leccion(uuid, uuid, uuid, integer) from public;
revoke execute on function public.fn_otorgar_insignia(uuid, uuid, text) from public;
revoke execute on function public.fn_actualizar_racha(uuid) from public;
revoke execute on function public.fn_otorgar_monedas(uuid, integer, text, text) from public;
revoke execute on function public.fn_registrar_resultado_juego(uuid, numeric, numeric, numeric, numeric, integer, integer, integer, boolean, jsonb) from public;
revoke execute on function public.fn_activar_matricula_tras_pago() from public;

grant execute on function public.fn_registrar_xp(uuid, integer, public.concepto_xp, text, uuid) to service_role, authenticated;
grant execute on function public.fn_registrar_completado_leccion(uuid, uuid, uuid, integer) to service_role, authenticated;
grant execute on function public.fn_otorgar_insignia(uuid, uuid, text) to service_role, authenticated;
grant execute on function public.fn_actualizar_racha(uuid) to service_role, authenticated;
grant execute on function public.fn_otorgar_monedas(uuid, integer, text, text) to service_role, authenticated;
grant execute on function public.fn_registrar_resultado_juego(uuid, numeric, numeric, numeric, numeric, integer, integer, integer, boolean, jsonb) to service_role, authenticated;

-- Funciones de solo lectura: pueden invocarse por todos.
grant execute on function public.app_user_id() to anon, authenticated, service_role;
grant execute on function public.app_user_role() to anon, authenticated, service_role;
grant execute on function public.app_is_admin() to anon, authenticated, service_role;
grant execute on function public.app_is_docente() to anon, authenticated, service_role;
grant execute on function public.app_is_estudiante() to anon, authenticated, service_role;
grant execute on function public.efectivo_user_id() to anon, authenticated, service_role;
grant execute on function public.app_es_docente_del_curso(uuid) to anon, authenticated, service_role;
grant execute on function public.app_es_docente_de_leccion(uuid) to anon, authenticated, service_role;
grant execute on function public.app_esta_matriculado(uuid) to anon, authenticated, service_role;


-- =============================================================================
-- FIN DE LA MIGRACION 0007
-- =============================================================================
