-- =============================================================================
-- Bonificación de XP por insignias
-- -----------------------------------------------------------------------------
-- El sistema ya otorga XP al desbloquear una insignia
-- (fn_otorgar_insignia -> fn_registrar_xp con concepto 'insignia'), pero solo
-- si la insignia tiene xp_otorgado > 0. El catálogo base tenía ese campo en 0,
-- así que las insignias no daban XP.
--
-- Esta migración:
--   1) Asigna XP por rareza a las insignias que siguen en 0 (idempotente).
--   2) Garante que las insignias nuevas también tengan bonificación.
--   3) Otorga retroactivamente el XP a insignias YA obtenidas que nunca lo
--      recibieron, sin duplicar transacciones (book ledger de transaccion_xp).
-- =============================================================================

begin;

-- ---------- 1) Catálogo existente: XP según rareza cuando estaba en 0 ----------
update public.insignia
   set xp_otorgado = case coalesce(rareza, 'comun')
       when 'raro'       then 60
       when 'epico'      then 120
       when 'legendario' then 250
       else 25
   end
 where coalesce(xp_otorgado, 0) = 0;

-- ---------- 2) Insignias nuevas: nunca quedar sin bonificación ----------
create or replace function public.fn_insignia_xp_por_rareza()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    if coalesce(new.xp_otorgado, 0) = 0 then
        new.xp_otorgado := case coalesce(new.rareza, 'comun')
            when 'raro'       then 60
            when 'epico'      then 120
            when 'legendario' then 250
            else 25
        end;
    end if;
    return new;
end;
$$;

drop trigger if exists trg_insignia_xp_por_rareza on public.insignia;
create trigger trg_insignia_xp_por_rareza
    before insert or update of xp_otorgado, rareza on public.insignia
    for each row execute function public.fn_insignia_xp_por_rareza();

comment on function public.fn_insignia_xp_por_rareza() is
    'Asigna XP de bonificación por rareza a insignias que no tenían xp_otorgado.';

-- ---------- 3) Backfill: XP a insignias ya obtenidas sin transacción ----------
do $$
declare
    r record;
begin
    for r in
        select iu.usuario_id, iu.insignia_id, i.xp_otorgado
          from public.insignia_usuario iu
          join public.insignia i on i.id = iu.insignia_id
         where iu.obtenida_en is not null
           and coalesce(i.xp_otorgado, 0) > 0
           and not exists (
               select 1
                 from public.transaccion_xp t
                where t.usuario_id = iu.usuario_id
                  and t.concepto = 'insignia'::public.concepto_xp
                  and t.referencia_tipo = 'insignia'
                  and t.referencia_id = iu.insignia_id
           )
    loop
        perform public.fn_registrar_xp(
            r.usuario_id, r.xp_otorgado, 'insignia', 'insignia', r.insignia_id
        );
    end loop;
end $$;

commit;
