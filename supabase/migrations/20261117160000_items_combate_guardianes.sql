-- =============================================================================
-- Guardianes: items comprables y UTILIZABLES en el videojuego
-- -----------------------------------------------------------------------------
-- Nuevos items a la venta (todos tipo 'item'):
--   vida_extra  -> Revive tu personaje donde moriste (salud máxima), sin
--                  reiniciar el nivel ni perder horda.
--   bomba_total -> Detona y elimina a todos los enemigos en pantalla.
-- RPCs nuevas (security definer):
--   guardianes_usar_item(p_item_id)   -> consume 1 unidad del inventario del
--                                        llamante (valida matrícula y stock).
--   guardianes_pista_pregunta(p_id)   -> devuelve la PISTA de la pregunta de
--                                        chequeo (para el ítem 'Pista').
--   guardianes_eliminar_dos(p_id)     -> devuelve 2 opciones INCORRECTAS para
--                                        marcarlas como eliminadas (ítem '50/50').
-- Catálogo legado: 'saltar_pregunta' y 'tiempo_extra' se RETIRAN (activos=false)
-- porque el juego no tiene temporizador y el skip ya existe en la UI del chequeo.
-- =============================================================================

begin;

-- ---------- 1. Dejamos retirados los items obsoletos ----------
update public.tienda_item
   set activo = false, actualizado_en = now()
 where codigo in ('saltar_pregunta', 'tiempo_extra');

-- ---------- 2. Nuevos items de combate ----------
insert into public.tienda_item (codigo, nombre, descripcion, tipo, precio_monedas, precio_xp, stock, limite_por_usuario, activo)
select v.codigo, v.nombre, v.descripcion, v.tipo::public.tipo_recompensa, v.precio_monedas, 0, null, null, true
  from (values
    ('vida_extra',  'Vida Extra',
     'Sobrevive una muerte. Al caer en combate, tu siguiente vida te revive con la salud máxima, donde estabas, conservando la horda y tus mejoras.',
     'item', 200),
    ('bomba_total', 'Bomba Total',
     'Detona una bomba que elimina a TODOS los enemigos en pantalla. Ideal para liberar la horda final.',
     'item', 180)
  ) as v(codigo, nombre, descripcion, tipo, precio_monedas)
  where not exists (select 1 from public.tienda_item t where t.codigo = v.codigo);

-- ---------- 3. Consumir 1 unidad del inventario del usuario ----------
create or replace function public.guardianes_usar_item(p_item_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_caller uuid := public.efectivo_user_id();
    v_inv    public.inventario%rowtype;
    v_cant   integer;
begin
    if v_caller is null then raise exception 'Autenticación requerida.' using errcode = '42501'; end if;

    -- El usuario debe estar matriculado en el curso del videojuego (u operator el backend)
    if not exists (select 1 from public.matricula m
                    where m.estudiante_id = v_caller
                      and m.curso_id = 'ab8e59ef-ab9f-40eb-8f31-790ac7edba4a'
                      and m.estado in ('activa','completada'))
       and not public.app_is_admin() then
        raise exception 'No estás matriculado en el curso del videojuego.' using errcode = '42501';
    end if;

    select * into v_inv
      from public.inventario i
     where i.usuario_id = v_caller
       and i.tienda_item_id = p_item_id
     order by i.adquirido_en
     limit 1
     for update;
    if not found then
        return jsonb_build_object('ok', false, 'mensaje', 'No tienes ese ítem en tu inventario.');
    end if;

    v_cant := v_inv.cantidad - 1;
    if v_cant <= 0 then
        delete from public.inventario where id = v_inv.id;
    else
        update public.inventario set cantidad = v_cant where id = v_inv.id;
    end if;

    return jsonb_build_object('ok', true,
                              'cantidad_restante', greatest(v_cant, 0),
                              'mensaje', 'Ítem utilizado.');
end;
$$;

comment on function public.guardianes_usar_item(uuid) is
    'Consume 1 unidad del inventario del usuario en el contexto del videojuego. Idempotente por transacción.';

revoke all on function public.guardianes_usar_item(uuid) from public, anon;
grant execute on function public.guardianes_usar_item(uuid) to authenticated;

-- ---------- 4. Pista de una pregunta de chequeo ----------
create or replace function public.guardianes_pista_pregunta(p_pregunta_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_caller uuid := public.efectivo_user_id();
    v_pista  text;
begin
    if v_caller is null then raise exception 'Autenticación requerida.' using errcode = '42501'; end if;

    if not exists (select 1 from public.matricula m
                    where m.estudiante_id = v_caller
                      and m.curso_id = 'ab8e59ef-ab9f-40eb-8f31-790ac7edba4a'
                      and m.estado in ('activa','completada'))
       and not public.app_is_admin() then
        raise exception 'No estás matriculado en el curso.' using errcode = '42501';
    end if;

    select p.pista into v_pista from public.guardianes_pregunta p where p.id = p_pregunta_id;
    return coalesce(v_pista, 'Sigue los pasos del tema; la respuesta correcta está al final del algoritmo.');
end;
$$;

comment on function public.guardianes_pista_pregunta(uuid) is
    'Devuelve la PISTA de la pregunta de chequeo del videojuego (ítem Pista).';

revoke all on function public.guardianes_pista_pregunta(uuid) from public, anon;
grant execute on function public.guardianes_pista_pregunta(uuid) to authenticated;

-- ---------- 5. Dos opciones incorrectas para el ítem 50/50 ----------
create or replace function public.guardianes_eliminar_dos(p_pregunta_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_caller uuid := public.efectivo_user_id();
    v_correcta text;
    v_opciones jsonb;
    v_errores  jsonb;
begin
    if v_caller is null then raise exception 'Autenticación requerida.' using errcode = '42501'; end if;

    if not exists (select 1 from public.matricula m
                    where m.estudiante_id = v_caller
                      and m.curso_id = 'ab8e59ef-ab9f-40eb-8f31-790ac7edba4a'
                      and m.estado in ('activa','completada'))
       and not public.app_is_admin() then
        raise exception 'No estás matriculado en el curso.' using errcode = '42501';
    end if;

    select p.correcta, p.opciones into v_correcta, v_opciones
      from public.guardianes_pregunta p where p.id = p_pregunta_id;

    select coalesce(jsonb_agg(o), '[]'::jsonb) into v_errores
      from ( select o from jsonb_array_elements_text(v_opciones) as o where o <> v_correcta order by random() limit 2 ) w;

    return jsonb_build_object('ok', true, 'opciones', coalesce(v_errores, '[]'::jsonb));
end;
$$;

comment on function public.guardianes_eliminar_dos(uuid) is
    'Devuelve 2 opciones incorrectas de una pregunta de chequeo (ítem 50/50). Nunca revela la correcta.';

revoke all on function public.guardianes_eliminar_dos(uuid) from public, anon;
grant execute on function public.guardianes_eliminar_dos(uuid) to authenticated;

commit;
