-- Amplía a 9 hordas por nivel: reset de las 54 hordas existentes y re-seed.
-- Safe — solo afecta guardianes_nivel_horda.

do $$
declare
    rec record;
    h   int;
    enemigos integer := 7;
    enemigos_max integer := 60;
    spawn_base integer := 700;
begin
    -- Reset hordas por nivel
    delete from public.guardianes_nivel_horda
     where nivel_id in (select id from public.guardianes_nivel);

    -- Re-seed 9 hordas por nivel
    for rec in select id from public.guardianes_nivel loop
        for h in 1..9 loop
            enemigos := least(enemigos_max, enemigos + (h - 1) * 6);
            insert into public.guardianes_nivel_horda
                (nivel_id, numero, total_enemigos, spawn_cada_ms, tipo_enemy_id, multiplicador)
            select rec.id, h, enemigos, spawn_base / h, e.id, 1.0 + (h - 1) * 0.35
            from public.guardianes_enemy e
            where e.nombre = case
                when h <= 3 then 'Espinita'
                when h <= 6 then 'Bug Invalido'
                else 'Excepcion'
            end;
        end loop;
    end loop;

    -- Actualizar guardianes_nivel.hordas_totales para reflejar 9
    update public.guardianes_nivel set hordas_totales = 9;
end $$;
