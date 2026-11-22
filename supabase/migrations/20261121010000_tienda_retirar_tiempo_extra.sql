-- =============================================================================
-- Tienda: retirar "Tiempo extra" (no aplicable)
-- -----------------------------------------------------------------------------
-- El videojuego Guardianes no tiene temporizador: el tiempo solo se mide para
-- el récord (mejor tiempo por nivel). Por eso el ítem "Tiempo extra" no puede
-- tener efecto y no debe seguir a la venta. La migración de items de combate
-- ya lo marcaba para retirar, pero quedó activo.
-- =============================================================================

begin;

update public.tienda_item
   set activo = false,
       actualizado_en = now()
 where codigo = 'modin-tiempo-extra';

commit;
