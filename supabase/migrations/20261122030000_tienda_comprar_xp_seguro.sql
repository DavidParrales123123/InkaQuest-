-- Compra con precio_xp > 0: el debito directo sobre perfil era rechazado por
-- trg_perfil_no_escalable y ademas insertaba texto en una columna enum.
-- Se delega en fn_registrar_xp (activa el flag de sistema y escribe el libro
-- mayor con un concepto valido). Hoy los precios son 0, pero la tienda debe
-- funcionar si se activa alguno.

begin;

create or replace function public.tienda_comprar(
    p_item_id            uuid,
    p_cantidad           integer default 1,
    p_clave_idempotencia text    default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_caller      uuid := public.efectivo_user_id();
    v_item        public.tienda_item%rowtype;
    v_existente   public.compra_virtual%rowtype;
    v_saldo       integer;
    v_xp          integer;
    v_inventario_id uuid;
    v_compra_id   uuid;
begin
    if v_caller is null then
        raise exception 'Autenticación requerida.' using errcode = '42501';
    end if;
    if p_cantidad is null or p_cantidad < 1 then
        raise exception 'La cantidad debe ser un entero positivo.' using errcode = '22023';
    end if;
    if p_cantidad > 10 then
        raise exception 'No se pueden comprar más de 10 unidades por operación.' using errcode = '22023';
    end if;

    if p_clave_idempotencia is not null then
        select * into v_existente
          from public.compra_virtual
         where usuario_id = v_caller
           and clave_idempotencia = p_clave_idempotencia;
        if found then
            return jsonb_build_object('ok', true, 'replay', true,
                                      'compra_id', v_existente.id,
                                      'mensaje', 'Operación ya procesada anteriormente (idempotencia).');
        end if;
    end if;

    select * into v_item
      from public.tienda_item
     where id = p_item_id and activo = true
       for update;
    if not found then
        raise exception 'El artículo no está disponible o no existe.' using errcode = '22023';
    end if;
    if v_item.stock is not null and v_item.stock < p_cantidad then
        raise exception 'No hay suficiente stock para completar la compra.' using errcode = '22023';
    end if;
    if v_item.limite_por_usuario is not null then
        if (select coalesce(sum(cantidad), 0) from public.inventario
              where usuario_id = v_caller and tienda_item_id = p_item_id) + p_cantidad
           > v_item.limite_por_usuario then
            raise exception 'Has alcanzado el límite del artículo por usuario.' using errcode = '22023';
        end if;
    end if;

    insert into public.monedero (usuario_id, saldo) values (v_caller, 0)
    on conflict (usuario_id) do nothing;
    update public.monedero set actualizado_en = now() where usuario_id = v_caller;
    select saldo into v_saldo from public.monedero where usuario_id = v_caller for update;
    select xp into v_xp from public.perfil where id = v_caller for update;

    if (v_item.precio_monedas * p_cantidad) > coalesce(v_saldo, 0) then
        raise exception 'No tienes suficientes monedas (necesitas %, tienes %).',
            v_item.precio_monedas * p_cantidad, coalesce(v_saldo, 0) using errcode = '22023';
    end if;
    if (v_item.precio_xp * p_cantidad) > coalesce(v_xp, 0) then
        raise exception 'No tienes suficiente XP (necesitas %, tienes %).',
            v_item.precio_xp * p_cantidad, coalesce(v_xp, 0) using errcode = '22023';
    end if;

    insert into public.compra_virtual (usuario_id, tienda_item_id, cantidad,
                                       monedas_gastadas, xp_gastado, clave_idempotencia)
    values (v_caller, p_item_id, p_cantidad,
            v_item.precio_monedas * p_cantidad,
            v_item.precio_xp * p_cantidad,
            coalesce(p_clave_idempotencia, gen_random_uuid()::text))
    returning id into v_compra_id;

    insert into public.inventario (usuario_id, tienda_item_id, cantidad, clave_idempotencia)
    values (v_caller, p_item_id, p_cantidad, 'inv-' || v_compra_id::text)
    on conflict (usuario_id, tienda_item_id) do update
       set cantidad = public.inventario.cantidad + excluded.cantidad
    returning id into v_inventario_id;

    if v_item.stock is not null then
        update public.tienda_item
           set stock = stock - p_cantidad, actualizado_en = now()
         where id = p_item_id;
    end if;

    if v_item.precio_monedas * p_cantidad > 0 then
        update public.monedero
           set saldo = saldo - (v_item.precio_monedas * p_cantidad), actualizado_en = now()
         where usuario_id = v_caller
        returning saldo into v_saldo;
        insert into public.transaccion_moneda (usuario_id, monedas, saldo_resultante, concepto, referencia_tipo, referencia_id)
        values (v_caller, -(v_item.precio_monedas * p_cantidad), coalesce(v_saldo, 0),
                'Compra en tienda: ' || v_item.nombre, 'compra_virtual', v_compra_id);
    end if;

    -- Antes: UPDATE perfil directo (bloqueado por trg_perfil_no_escalable) e
    -- insert con texto en concepto (enum). Ahora una sola llamada segura.
    if v_item.precio_xp * p_cantidad > 0 then
        perform public.fn_registrar_xp(
            v_caller,
            -(v_item.precio_xp * p_cantidad),
            'ajuste'::public.concepto_xp,
            'compra_virtual',
            v_compra_id);
        select xp into v_xp from public.perfil where id = v_caller;
    end if;

    insert into public.registro_accion
        (codigo_evento, actor_id, entidad_tipo, entidad_id, accion,
         valor_nuevo, exito, correlation_id)
    values
        ('tienda_comprada', v_caller, 'tienda_item', p_item_id, 'crear',
         jsonb_build_object('item_id', p_item_id, 'item_nombre', v_item.nombre,
                            'cantidad', p_cantidad,
                            'monedas_gastadas', v_item.precio_monedas * p_cantidad,
                            'xp_gastado', v_item.precio_xp * p_cantidad),
         true, gen_random_uuid());

    return jsonb_build_object('ok', true, 'compra_id', v_compra_id,
                              'cantidad', p_cantidad, 'item_nombre', v_item.nombre,
                              'saldo_restante', v_saldo, 'xp_restante', v_xp);
end;
$$;

revoke all on function public.tienda_comprar(uuid, integer, text) from public, anon;
grant execute on function public.tienda_comprar(uuid, integer, text) to authenticated;

commit;
