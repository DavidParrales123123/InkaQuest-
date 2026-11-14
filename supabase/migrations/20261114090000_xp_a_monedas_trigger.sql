-- 1 moneda por cada 5 XP: creditar automáticamente transaccion_moneda.
--
-- Hallazgo senior: ningún premio realmente acreditaba monedero.saldo hasta ahora,
-- porque fn_registrar_xp no toca monedero y fn_otorgar_monedas no se invocaba
-- desde ningún flujo. Esta migración cierra el hueco de forma irreversible pero
-- segura: solo aplica a nuevas transacciones de XP en positivo; las compras con
-- XP (negativo transaccion_xp) no otorgan monedas.

create or replace function public.trg_creditar_monedas_por_xp()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_monedas integer := 0;
    v_saldo   integer;
begin
    -- Solo transacciones de XP en positivo; compras negativas no otorgan monedas.
    if NEW.xp is not null and NEW.xp > 0 then
        v_monedas := floor(NEW.xp / 5)::integer;
    end if;

    if v_monedas <= 0 then
        return NEW;
    end if;

    insert into public.monedero (usuario_id, saldo)
    values (NEW.usuario_id, v_monedas)
    on conflict (usuario_id) do update
       set saldo = public.monedero.saldo + excluded.saldo,
           actualizado_en = now()
    returning saldo into v_saldo;

    insert into public.transaccion_moneda
        (usuario_id, monedas, saldo_resultante, concepto, referencia_tipo, referencia_id)
    values
        (NEW.usuario_id, v_monedas, v_saldo,
         'recompensasXP', 'xp', NEW.id);

    return NEW;
end;
$$;

comment on function public.trg_creditar_monedas_por_xp() is
    'Trigger AFTER INSERT sobre transaccion_xp: otorga monedas proporcionales (p. ej. 1 moneda cada 5 XP) y las registra en monedero y transaccion_moneda.';

drop trigger if exists trg_creditar_monedas_por_xp on public.transaccion_xp;
create trigger trg_creditar_monedas_por_xp
    after insert on public.transaccion_xp
    for each row execute function public.trg_creditar_monedas_por_xp();

-- Backfill histórico: monedas por las XP ya ganadas pero no acreditadas.
do $$
declare
    r             record;
    v_monedas     integer;
    v_saldo       integer;
begin
    for r in
        select t.usuario_id, sum(t.xp)::integer as xp_total
          from public.transaccion_xp t
         where t.xp > 0
           and t.id not in (select nullif(tm.referencia_id::text, '')::uuid
                              from public.transaccion_moneda tm
                             where tm.referencia_tipo = 'xp'
                               and tm.referencia_id is not null)
         group by t.usuario_id
    loop
        v_monedas := floor(r.xp_total / 5)::integer;
        if v_monedas > 0 then
            insert into public.monedero (usuario_id, saldo)
            values (r.usuario_id, v_monedas)
            on conflict (usuario_id) do update
               set saldo = public.monedero.saldo + excluded.saldo,
                   actualizado_en = now()
            returning saldo into v_saldo;

            insert into public.transaccion_moneda
                (usuario_id, monedas, saldo_resultante, concepto, referencia_tipo, referencia_id)
            values (r.usuario_id, v_monedas, v_saldo,
                    'recompensasXP', 'xp', null);

            insert into public.registro_accion
                (codigo_evento, actor_id, entidad_tipo, entidad_id, accion,
                 valor_nuevo, exito, correlation_id)
            values
                ('backfill_monedas_por_xp', r.usuario_id, 'perfil', r.usuario_id, 'actualizar',
                 jsonb_build_object('xp_total', r.xp_total, 'monedas_acreditadas', v_monedas),
                 true, gen_random_uuid());
        end if;
    end loop;
end $$;
