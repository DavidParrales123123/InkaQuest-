-- =============================================================================
-- Propaga xp_otorgado desde leccion → modulo → unidad
-- =============================================================================
-- xp_otorgado en leccion ya está repartido correctamente (sumas exactas con
-- xp_total por curso). Esta migración rellena los totales acumulados:
--   modulo.xp_otorgado = sum(xp_otorgado) de sus lecciones
--   unidad.xp_otorgado = sum(xp) de sus módulos
-- =============================================================================

begin;

-- 1) Recalcular xp_otorgado de cada módulo desde sus lecciones
update public.modulo m
   set xp_otorgado = (
      select coalesce(sum(l.xp_otorgado), 0)
        from public.leccion l
       where l.modulo_id = m.id
   );

-- 2) Recalcular xp_otorgado de cada unidad desde sus módulos
update public.unidad u
   set xp_otorgado = (
      select coalesce(sum(mu.xp_otorgado), 0)
        from public.modulo mu
       where mu.unidad_id = u.id
   );

commit;
