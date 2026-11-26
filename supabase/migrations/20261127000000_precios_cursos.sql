-- =============================================================================
-- InkaQuest - Migración 20261127000000
-- Ajuste de precios de cursos pagados: rango S/ 660 a S/ 725.
-- "Principios de Algoritmos" permanece gratuito (S/ 0).
-- Los pedidos ya creados conservan su total (snapshot histórico).
-- =============================================================================

begin;

update public.curso set precio = 690, moneda = 'PEN' where titulo = 'Algoritmos y Estructuras de Datos';
update public.curso set precio = 695, moneda = 'PEN' where titulo = 'Analisis y Diseno de Algoritmos';
update public.curso set precio = 670, moneda = 'PEN' where titulo = 'Base de Datos 1: SQL y Esquemas';
update public.curso set precio = 700, moneda = 'PEN' where titulo = 'Base de Datos 2: Futuro SQL';
update public.curso set precio = 720, moneda = 'PEN' where titulo = 'Diseno de Patrones: Guia Visual de Software';
update public.curso set precio = 660, moneda = 'PEN' where titulo = 'Introduccion a las TICS';
update public.curso set precio = 0,   moneda = 'PEN' where titulo = 'Principios de Algoritmos';
update public.curso set precio = 705, moneda = 'PEN' where titulo = 'Programacion Orientada a Objetos';
update public.curso set precio = 675, moneda = 'PEN' where titulo = 'Redes y Comunicacion de Datos 1';
update public.curso set precio = 715, moneda = 'PEN' where titulo = 'Sistemas Operativos: Guia Visual Futurista';
update public.curso set precio = 680, moneda = 'PEN' where titulo = 'Taller de Programacion Java';
update public.curso set precio = 725, moneda = 'PEN' where titulo = 'Taller de Programacion Web';

commit;

notify pgrst, 'reload schema';
