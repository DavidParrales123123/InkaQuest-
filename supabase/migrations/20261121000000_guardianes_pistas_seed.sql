-- =============================================================================
-- Guardianes: pistas reales para el ítem "Pista"
-- -----------------------------------------------------------------------------
-- Las 144 preguntas tenían el campo pista vacío, así que el objeto comprado
-- solo devolvía un texto genérico. Esta migración genera una pista útil por
-- pregunta a partir de su respuesta correcta y su enunciado, SIN revelar la
-- respuesta literal: describe la pista temática (longitud de la respuesta,
-- tema y una palabra clave del concepto).
--
-- Idempotente: solo rellena preguntas con pista vacía.
-- =============================================================================

begin;

update public.guardianes_pregunta p
   set pista = (
     select case
       -- Si la respuesta correcta es una sola palabra, damos una pista de forma.
       when array_length(string_to_array(btrim(p.correcta), ' '), 1) = 1 then
         'Piensa en la forma geométrica o el símbolo de la respuesta: tiene '
         || length(btrim(p.correcta)) || ' letras y empieza por "'
         || upper(left(btrim(p.correcta), 1)) || '".'
       -- Si es una frase, damos la longitud y la primera palabra clave.
       else
         'La respuesta es una idea de '
         || array_length(string_to_array(btrim(p.correcta), ' '), 1)
         || ' palabras y comienza con "' || split_part(btrim(p.correcta), ' ', 1) || '". Relaciónala con: '
         || coalesce(nullif(btrim(p.tema), ''), 'el tema de la pregunta') || '.'
     end
   )
 where coalesce(btrim(p.pista), '') = '';

comment on column public.guardianes_pregunta.pista is
  'Pista mostrada por el objeto Pista del videojuego (no revela la respuesta literal).';

commit;
