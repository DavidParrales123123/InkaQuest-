-- =============================================================================
-- InkaQuest - Migración 20261127010000
-- Los pedidos AÚN PENDIENTES de pago deben reflejar el precio vigente del
-- curso (no un snapshot viejo). Pedidos pagados/fallidos no se modifican.
-- =============================================================================

begin;

-- Totales del pedido.
update public.pedido p
   set subtotal = c.precio,
       total = c.precio,
       actualizado_en = now()
  from public.detalle_pedido d
  join public.curso c on c.id = d.curso_id
 where d.pedido_id = p.id
   and p.estado = 'pendiente'
   and p.total <> c.precio;

-- Detalle del pedido.
update public.detalle_pedido d
   set precio_unitario = c.precio,
       subtotal = c.precio
  from public.curso c
 where c.id = d.curso_id
   and d.pedido_id in (select id from public.pedido where estado = 'pendiente');

-- Transacción iniciada asociada (aún no cobrada).
update public.transaccion t
   set monto = p.total
  from public.pedido p
 where p.id = t.pedido_id
   and p.estado = 'pendiente'
   and t.estado = 'iniciado'
   and t.monto <> p.total;

commit;

notify pgrst, 'reload schema';
