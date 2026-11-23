-- =============================================================================
-- Eliminacion de cursos para el panel admin.
-- -----------------------------------------------------------------------------
-- El panel permitia crear y publicar cursos pero no tenia accion de borrado.
-- Un DELETE directo puede cascadear matriculas, pedidos, progreso, etc. Esta
-- RPC valida dependencias sensibles antes de borrar y devuelve un mensaje
-- accionable para archivar en su lugar. Solo admin o creador del curso.
-- =============================================================================

begin;

create or replace function public.eliminar_curso(p_curso_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_admin      uuid := public.efectivo_user_id();
    v_titulo     text;
    v_creador    uuid;
    v_matriculas integer := 0;
    v_ventas     integer := 0;
    v_certificados integer := 0;
begin
    if v_admin is null then
        raise exception 'Autenticación requerida.' using errcode = '42501';
    end if;

    select titulo, creado_por into v_titulo, v_creador
      from public.curso
     where id = p_curso_id;
    if not found then
        raise exception 'Curso no encontrado.' using errcode = 'P0002';
    end if;

    if not public.app_is_admin() and v_creador is distinct from v_admin then
        raise exception 'Solo el administrador o quien creó el curso puede eliminarlo.'
            using errcode = '42501';
    end if;

    select count(*) into v_matriculas
      from public.matricula where curso_id = p_curso_id;
    select count(*) into v_ventas
      from public.detalle_pedido where curso_id = p_curso_id;
    select count(*) into v_certificados
      from public.certificado_curso where curso_id = p_curso_id;

    if v_matriculas > 0 or v_ventas > 0 or v_certificados > 0 then
        raise exception 'El curso «%» tiene % matrícula(s), % venta(s) y % certificado(s) asociados. No se puede eliminar; usa «Archivar» en su lugar.',
            v_titulo, v_matriculas, v_ventas, v_certificados using errcode = '23000';
    end if;

    delete from public.curso where id = p_curso_id;

    return jsonb_build_object('ok', true, 'mensaje', 'Curso eliminado correctamente.');
end;
$$;

revoke all on function public.eliminar_curso(uuid) from public, anon;
grant execute on function public.eliminar_curso(uuid) to authenticated;

commit;
