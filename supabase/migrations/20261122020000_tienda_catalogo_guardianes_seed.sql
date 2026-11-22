-- Catálogo canónico de la tienda de Guardianes.
-- Estos códigos existían en producción pero NO en ninguna migración: una
-- instalación limpia no podía comprar Pista, 50/50, Congelar, Segunda
-- oportunidad ni Saltar. Seed idempotente (no pisa precios ni nombres
-- personalizados): solo inserta los códigos que falten.

begin;

insert into public.tienda_item (codigo, nombre, descripcion, precio_xp, activo, tipo)
select v.codigo, v.nombre, v.descripcion, 0, true, 'item'::public.tipo_recompensa
from (values
    ('bomba_total', 'Bomba Total', 'Detona una bomba que elimina a TODOS los enemigos en pantalla. Ideal para liberar la horda final.'),
    ('vida_extra', 'Vida Extra', 'Revive al jugador al caer en combate para continuar el intento.'),
    ('modin-pista', 'Pista', 'Muestra una pista o ayuda contextual para resolver la pregunta.'),
    ('modin-5050', '50/50', 'Elimina dos opciones incorrectas en una pregunta.'),
    ('modin-congelar', 'Congelar tiempo', 'Detiene temporalmente a los enemigos durante unos segundos.'),
    ('modin-segunda-oportunidad', 'Segunda oportunidad', 'Permite volver a responder una pregunta tras un error.'),
    ('modin-saltar', 'Saltar pregunta', 'Permite omitir una pregunta difícil sin perder la mejora en juego.')
) as v(codigo, nombre, descripcion)
where not exists (
    select 1 from public.tienda_item t where t.codigo = v.codigo
);

-- Retirado definitivamente: el juego no tiene temporizador.
update public.tienda_item set activo = false where codigo = 'modin-tiempo-extra';

commit;
