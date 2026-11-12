-- =============================================================================
-- InkaQuest - Migración 20261112000000
-- Un docente no puede inscribirse como estudiante en un curso que imparte.
--
-- Regla de negocio: si el perfil (estudiante_id) tiene una asignación activa
-- en docente_curso para el mismo curso, el INSERT de matrícula se rechaza.
-- El frontend muestra el aviso correspondiente, pero la garantía real está
-- en la base de datos: ninguna vía (RPC, API, insert directo) puede saltarlo.
-- =============================================================================

create or replace function public.fn_matricula_bloquear_docente()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    if exists (
        select 1
        from public.docente_curso dc
        where dc.docente_id = new.estudiante_id
          and dc.curso_id = new.curso_id
          and dc.activo
    ) then
        raise exception 'No puedes matricularte como estudiante en un curso que impartes.';
    end if;

    return new;
end;
$$;

comment on function public.fn_matricula_bloquear_docente() is
    'Impide que un docente se matricule como estudiante en su mismo curso.';

drop trigger if exists trg_matricula_bloquear_docente on public.matricula;
create trigger trg_matricula_bloquear_docente
    before insert on public.matricula
    for each row execute function public.fn_matricula_bloquear_docente();
