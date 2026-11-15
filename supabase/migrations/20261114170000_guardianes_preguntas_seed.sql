-- Seed de banco de preguntas académicas para Guardianes del Conocimiento
-- 144 preguntas (8 por nivel, 18 niveles) redactadas desde los PDFs S01-S18
-- del curso Principios de Algoritmos.
-- Idempotente: borra preguntas y respuestas previas del juego antes de insertar.
-- Incluye corrección del RPC guardianes_pregunta_aleatoria: sólo preguntas VALIDADAS.

-- ── Corrección RPC: estado válido es validada (no activa) ─────────────
create or replace function public.guardianes_pregunta_aleatoria(
    p_nivel_id uuid,
    p_excluir  uuid[] default '{}'
)
returns table (pregunta_id uuid, enunciado text, opciones jsonb, tema text, dificultad text, tipo text)
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_caller uuid := public.efectivo_user_id();
begin
    if v_caller is null then
        raise exception 'Autenticación requerida.' using errcode = '42501';
    end if;

    if not exists (
        select 1
          from public.matricula m
          join public.leccion l  on l.id = (select leccion_id from public.guardianes_nivel where id = p_nivel_id)
          join public.modulo  mu on mu.id = l.modulo_id
          join public.unidad  u  on u.id = mu.unidad_id
         where m.estudiante_id = v_caller
           and m.curso_id      = u.curso_id
           and m.estado in ('activa', 'completada')
    ) then
        raise exception 'No estás matriculado en este curso.' using errcode = '42501';
    end if;

    return query
        select p.id, p.enunciado, p.opciones, p.tema, p.dificultad, p.tipo
          from public.guardianes_pregunta p
         where p.nivel_id = p_nivel_id
           and p.estado = 'validada'
           and p.opciones is not null
           and jsonb_array_length(p.opciones) >= 2
           and not (p.id = any (coalesce(p_excluir, '{}'::uuid[])))
         order by random()
         limit 1;
end;
$$;

comment on function public.guardianes_pregunta_aleatoria(uuid, uuid[]) is
    'Devuelve 1 pregunta validada del nivel (sin revelar la correcta), excluyendo ids ya vistos.';

-- ── Limpieza del seed previo (respuestas primero por la FK) ────────────
delete from public.guardianes_respuesta;
delete from public.guardianes_pregunta;

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Definición de algoritmo', 'pensamiento_algoritmico', 'opcion_multiple', 'facil',
    '¿Qué es un algoritmo?',
    jsonb_build_array('Una secuencia lógica y finita de pasos para resolver un problema', 'Un programa escrito en un lenguaje de programación', 'Un diagrama que muestra las áreas de un hospital', 'Un dato almacenado en memoria'),
    'Una secuencia lógica y finita de pasos para resolver un problema',
    'Según la sesión 1, un algoritmo es una secuencia paso a paso, con datos de entrada, que genera una solución mediante un método eficiente y preciso.', 'validada'
from public.guardianes_nivel n
where n.numero = 1
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Características de un algoritmo', 'pensamiento_algoritmico', 'opcion_multiple', 'facil',
    '¿Qué significa que un algoritmo sea FINITO?',
    jsonb_build_array('Debe finalizar en un número finito de pasos', 'Debe tener un número exacto de entradas', 'Debe ocupar poco espacio en disco', 'Debe ejecutarse sin variables'),
    'Debe finalizar en un número finito de pasos',
    'Finito (Knuth): al seguir el algoritmo, debe finalizar en un número finito de pasos.', 'validada'
from public.guardianes_nivel n
where n.numero = 1
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Características de un algoritmo', 'pensamiento_algoritmico', 'opcion_multiple', 'facil',
    '¿Cuántas entradas tiene un algoritmo?',
    jsonb_build_array('Cero o más entradas', 'Exactamente una entrada', 'Siempre dos entradas', 'Ninguna entrada'),
    'Cero o más entradas',
    'Un algoritmo puede tener cero o más entradas; en cambio, debe tener una o más salidas.', 'validada'
from public.guardianes_nivel n
where n.numero = 1
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Características de un algoritmo', 'pensamiento_algoritmico', 'opcion_multiple', 'facil',
    'Si sigues varias veces el mismo algoritmo con los mismos datos, obtendrás siempre los mismos resultados. ¿Qué característica es esa?',
    jsonb_build_array('Definido', 'Preciso', 'Eficaz', 'Finito'),
    'Definido',
    'Definido: con los mismos datos de entrada se deben obtener los mismos resultados.', 'validada'
from public.guardianes_nivel n
where n.numero = 1
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Etapas en el desarrollo de un algoritmo', 'pensamiento_algoritmico', 'opcion_multiple', 'media',
    '¿Cuál es el orden correcto de las etapas en el desarrollo de un algoritmo?',
    jsonb_build_array('Análisis del problema → Diseño del algoritmo → Implementación', 'Implementación → Diseño del algoritmo → Análisis del problema', 'Diseño del algoritmo → Implementación → Análisis del problema', 'Análisis del problema → Implementación → Diseño del algoritmo'),
    'Análisis del problema → Diseño del algoritmo → Implementación',
    'Primero se revisa el problema (análisis), luego se describe la secuencia de pasos (diseño) y finalmente se expresa como programa en un lenguaje de programación (implementación).', 'validada'
from public.guardianes_nivel n
where n.numero = 1
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Partes de un algoritmo', 'pensamiento_algoritmico', 'opcion_multiple', 'facil',
    '¿Cuál es la parte de un algoritmo encargada de mostrar los resultados obtenidos?',
    jsonb_build_array('Salida', 'Entrada', 'Proceso', 'Análisis'),
    'Salida',
    'Entrada: introduce datos para ser transformados. Proceso: operaciones. Salida: resultados obtenidos a través del proceso.', 'validada'
from public.guardianes_nivel n
where n.numero = 1
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Características de un algoritmo', 'pensamiento_algoritmico', 'opcion_multiple', 'media',
    '¿Qué significa que un algoritmo sea PRECISO?',
    jsonb_build_array('Cada paso debe estar especificado con claridad y sin ambigüedad', 'Debe producir un resultado muy exacto', 'Debe funcionar solo con números enteros', 'Debe ocupar el menor tiempo posible'),
    'Cada paso debe estar especificado con claridad y sin ambigüedad',
    'Preciso: los pasos están especificados con claridad y sin ambigüedades, por lo que cualquiera los realiza igual.', 'validada'
from public.guardianes_nivel n
where n.numero = 1
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Características de un algoritmo', 'pensamiento_algoritmico', 'opcion_multiple', 'media',
    'La característica de EFICACIA implica que…',
    jsonb_build_array('Las operaciones a realizar deben ser suficientemente básicas', 'El algoritmo debe ejecutarse lo más rápido posible', 'El algoritmo debe funcionar en cualquier computadora', 'El algoritmo debe usar pocos recursos de memoria'),
    'Las operaciones a realizar deben ser suficientemente básicas',
    'Eficaz: todas las operaciones que realiza el algoritmo deben ser lo bastante básicas para hacerlas en poco tiempo.', 'validada'
from public.guardianes_nivel n
where n.numero = 1
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Proposiciones lógicas', 'pensamiento_algoritmico', 'opcion_multiple', 'facil',
    '¿Cuál de las siguientes oraciones es una proposición SIMPLE?',
    jsonb_build_array('La Tierra es redonda', 'La Tierra es redonda y gira alrededor del Sol', 'O bien ganas o bien pierdes', 'Juan ni es inteligente ni es trabajador'),
    'La Tierra es redonda',
    'Una proposición simple expresa un solo juicio o idea; las demás unen varias ideas mediante conectivos.', 'validada'
from public.guardianes_nivel n
where n.numero = 2
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Conectivos lógicos', 'pensamiento_algoritmico', 'opcion_multiple', 'media',
    '¿Cuándo es verdadera una CONJUNCIÓN p ∧ q?',
    jsonb_build_array('Solo si ambas proposiciones p y q son verdaderas', 'Si al menos una de ellas es verdadera', 'Solo si ambas son falsas', 'Si p es falsa o q es falsa'),
    'Solo si ambas proposiciones p y q son verdaderas',
    'La tabla de verdad de p ∧ q (Y): V V→V, V F→F, F V→F, F F→F. Solo es verdadera cuando ambas son verdaderas.', 'validada'
from public.guardianes_nivel n
where n.numero = 2
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Conectivos lógicos', 'pensamiento_algoritmico', 'opcion_multiple', 'media',
    '¿Cuándo es verdadera una DISYUNCIÓN p ∨ q?',
    jsonb_build_array('Si al menos una de las proposiciones es verdadera', 'Solo si ambas son verdaderas', 'Solo si ambas son falsas', 'Cuando p y q tienen valores distintos'),
    'Si al menos una de las proposiciones es verdadera',
    'La disyunción (O) es falsa únicamente en el caso F F; en cualquier otro caso es verdadera.', 'validada'
from public.guardianes_nivel n
where n.numero = 2
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Conectivos lógicos', 'pensamiento_algoritmico', 'opcion_multiple', 'media',
    'Si p es VERDADERA, ¿cuál es el valor de ¬p?',
    jsonb_build_array('Falso', 'Verdadero', 'Indefinido', 'Depende de q'),
    'Falso',
    'La negación invierte el valor de verdad: si p es verdadera, ¬p (no p) es falsa.', 'validada'
from public.guardianes_nivel n
where n.numero = 2
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Conectivos lógicos', 'pensamiento_algoritmico', 'opcion_multiple', 'media',
    'Dadas p (verdadera) y q (falsa), ¿cuál es el valor de p ∧ q?',
    jsonb_build_array('Falso', 'Verdadero', 'Indefinido', 'Depende del orden'),
    'Falso',
    'Consulta la tabla de p ∧ q del material: V F → F. La conjunción exige ambos verdaderos.', 'validada'
from public.guardianes_nivel n
where n.numero = 2
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Conectivos lógicos', 'pensamiento_algoritmico', 'opcion_multiple', 'facil',
    'La disyunción EXCLUSIVA se suele expresar con las palabras…',
    jsonb_build_array('o bien', 'o también', 'y además', 'no solo sino también'),
    'o bien',
    'La disyunción exclusiva implica que solo una de las proposiciones es verdadera y se expresa con ''o bien'' (ej. ''O bien ganas o bien pierdes'').', 'validada'
from public.guardianes_nivel n
where n.numero = 2
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Proposiciones lógicas', 'pensamiento_algoritmico', 'opcion_multiple', 'media',
    '¿Cuál es una proposición COORDINADA?',
    jsonb_build_array('La Tierra es redonda y gira alrededor del Sol', 'La Tierra es redonda', 'La Tierra es redonda porque así lo demuestran las observaciones', 'Ninguna de las anteriores'),
    'La Tierra es redonda y gira alrededor del Sol',
    'Las proposiciones coordinadas son compuestas unidas por conjunciones coordinantes (y, ni, pero…). Las subordinadas usan ''porque''.', 'validada'
from public.guardianes_nivel n
where n.numero = 2
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Conectivos lógicos', 'pensamiento_algoritmico', 'opcion_multiple', 'facil',
    '¿Cuál NO es un conectivo de conjunción en español?',
    jsonb_build_array('o', 'y', 'ni', 'además'),
    'o',
    '''o'' expresa disyunción. La conjunción usa y, e, ni, además, tanto… como, también, no solo… sino también.', 'validada'
from public.guardianes_nivel n
where n.numero = 2
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Pseudocódigo', 'pensamiento_algoritmico', 'opcion_multiple', 'facil',
    '¿Qué es el pseudocódigo?',
    jsonb_build_array('Un lenguaje de especificación de algoritmos usando lenguaje natural y simple', 'Un lenguaje de programación compilado', 'Un tipo especial de diagrama de flujo', 'Un código binario de máquina'),
    'Un lenguaje de especificación de algoritmos usando lenguaje natural y simple',
    'El pseudocódigo describe los pasos del algoritmo con lenguaje natural; no tiene una sintaxis fija ni reglas estrictas y luego se traduce a un lenguaje de programación.', 'validada'
from public.guardianes_nivel n
where n.numero = 3
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Pseudocódigo', 'pensamiento_algoritmico', 'opcion_multiple', 'media',
    '¿Cuál es una ventaja del pseudocódigo?',
    jsonb_build_array('Se enfoca en la lógica del programa, no en las reglas de un lenguaje', 'Se compila automáticamente a lenguaje máquina', 'Solo puede usarse en PseInt', 'Es más rápido que el lenguaje de máquina'),
    'Se enfoca en la lógica del programa, no en las reglas de un lenguaje',
    'El pseudocódigo prioriza la lógica frente a las reglas sintácticas, y se traduce fácilmente a lenguajes estructurados como Pascal, C o C++.', 'validada'
from public.guardianes_nivel n
where n.numero = 3
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Tipos de datos', 'pensamiento_algoritmico', 'opcion_multiple', 'facil',
    '¿Qué tipo de dato usarías para almacenar la EDAD de una persona?',
    jsonb_build_array('Entero', 'Real', 'Caracteres', 'Lógico'),
    'Entero',
    'La edad se representa como un número entero (20, 30, 51…). El precio usa Real; el nombre usa Caracteres.', 'validada'
from public.guardianes_nivel n
where n.numero = 3
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Tipos de datos', 'pensamiento_algoritmico', 'opcion_multiple', 'facil',
    '¿Qué tipo de dato usarías para almacenar el PRECIO de un producto (20.50)?',
    jsonb_build_array('Real', 'Entero', 'Caracteres', 'Lógico'),
    'Real',
    'Los precios tienen decimales, por lo que se expresan con números reales (20.50, 11.99).', 'validada'
from public.guardianes_nivel n
where n.numero = 3
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Palabras reservadas', 'pensamiento_algoritmico', 'opcion_multiple', 'facil',
    'En PseInt, ¿qué palabra reservada se usa para INGRESAR datos por teclado?',
    jsonb_build_array('Leer', 'Escribir', 'Definir', 'Proceso'),
    'Leer',
    'Leer indica al computador que reciba un valor desde el teclado y lo almacene en la variable indicada.', 'validada'
from public.guardianes_nivel n
where n.numero = 3
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Operadores', 'pensamiento_algoritmico', 'opcion_multiple', 'media',
    '¿Cuál es el operador de POTENCIA en PseInt?',
    jsonb_build_array('^', '**', 'pow', '*'),
    '^',
    'En PseInt la potencia se escribe con el símbolo ^ (10 ^ 2 = 100).', 'validada'
from public.guardianes_nivel n
where n.numero = 3
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Operadores', 'pensamiento_algoritmico', 'opcion_multiple', 'media',
    '¿Cuál es el residuo de 10 mod 3?',
    jsonb_build_array('1', '0', '3', '2'),
    '1',
    'El operador % o mod devuelve el residuo de la división entera: 10 / 3 = 3 residuo 1.', 'validada'
from public.guardianes_nivel n
where n.numero = 3
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Operadores', 'pensamiento_algoritmico', 'opcion_multiple', 'dificil',
    '¿Qué devuelve TRUNC(10 / 3)?',
    jsonb_build_array('3', '3.33', '4', '0'),
    '3',
    'TRUNC devuelve la parte entera del número, truncando los decimales: TRUNC(10/3) = TRUNC(3.33…) = 3.', 'validada'
from public.guardianes_nivel n
where n.numero = 3
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Variables', 'pensamiento_algoritmico', 'opcion_multiple', 'facil',
    '¿Qué es una variable?',
    jsonb_build_array('Una posición de memoria que almacena temporalmente un valor que puede cambiar', 'Un valor constante que nunca cambia', 'Un nombre reservado del lenguaje', 'Un resultado de una operación'),
    'Una posición de memoria que almacena temporalmente un valor que puede cambiar',
    'Una variable posee valor, tipo, nombre (identificador) y tamaño; su valor puede cambiar durante la ejecución del algoritmo.', 'validada'
from public.guardianes_nivel n
where n.numero = 4
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Variables', 'pensamiento_algoritmico', 'opcion_multiple', 'facil',
    '¿Cómo se declara en PseInt una variable REAL llamada ''precio''?',
    jsonb_build_array('Definir precio Como Real', 'precio Real', 'Declarar precio Real', 'Definirprecio Como Real'),
    'Definir precio Como Real',
    'La sintaxis de declaración en PseInt es: Definir <identificador> Como <tipo>.', 'validada'
from public.guardianes_nivel n
where n.numero = 4
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Asignación', 'pensamiento_algoritmico', 'opcion_multiple', 'facil',
    '¿Qué operador se utiliza en PseInt para ASIGNAR un valor a una variable?',
    jsonb_build_array('<-', '=', '==', ':='),
    '<-',
    'La combinación ''<'' y ''-'' (<-) almacena un valor en la variable. En otras variantes de pseudocódigo se usa ''=''.', 'validada'
from public.guardianes_nivel n
where n.numero = 4
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Estructura secuencial', 'pensamiento_algoritmico', 'opcion_multiple', 'facil',
    '¿Qué caracteriza a la estructura SECUENCIAL?',
    jsonb_build_array('Una acción sigue a otra; la salida de una es la entrada de la siguiente', 'Ejecuta bloques según una condición', 'Repite un bloque un número fijo de veces', 'Elige entre varias alternativas'),
    'Una acción sigue a otra; la salida de una es la entrada de la siguiente',
    'En la estructura secuencial las tareas suceden una tras otra hasta el fin del proceso, sin decisiones ni repeticiones.', 'validada'
from public.guardianes_nivel n
where n.numero = 4
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Lectura y escritura', 'pensamiento_algoritmico', 'opcion_multiple', 'facil',
    '¿Qué palabra reservada muestra información en pantalla?',
    jsonb_build_array('Escribir', 'Leer', 'Imprimir pantalla', 'Definir'),
    'Escribir',
    'Escribir muestra en pantalla valores de variables o valores constantes asociados a mensajes.', 'validada'
from public.guardianes_nivel n
where n.numero = 4
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Numeración', 'pensamiento_algoritmico', 'opcion_multiple', 'dificil',
    'Si a = 5 y b = 3, ¿cuál es el valor de res <- ((a + b) ^ 2) / 3?',
    jsonb_build_array('21.33', '18', '26.67', '13.33'),
    '21.33',
    '((5 + 3) ^ 2) / 3 = 64 / 3 ≈ 21.33. Se evalúa primero (a+b), luego la potencia y por último la división.', 'validada'
from public.guardianes_nivel n
where n.numero = 4
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Variables', 'pensamiento_algoritmico', 'opcion_multiple', 'media',
    '¿Antes de emplear una variable, qué debe hacerse?',
    jsonb_build_array('Declararla (identificador y tipo de dato)', 'Asignarle valor directamente sin declararla', 'Imprimirla en pantalla', 'Convertirla a constante'),
    'Declararla (identificador y tipo de dato)',
    'Las variables deben declararse antes de ser empleadas, indicando identificador y tipo de dato.', 'validada'
from public.guardianes_nivel n
where n.numero = 4
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Repaso S04', 'pensamiento_algoritmico', 'opcion_multiple', 'media',
    'Si res <- ((a + b) ^ 2) / 3 y a=1, b=2, ¿cuál es el valor de res?',
    jsonb_build_array('3', '9', '1.5', '6'),
    '3',
    '((1 + 2) ^ 2) / 3 = 3 ^ 2 / 3 = 9 / 3 = 3.', 'validada'
from public.guardianes_nivel n
where n.numero = 4
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Diagramas de flujo', 'pensamiento_algoritmico', 'opcion_multiple', 'facil',
    '¿Qué representa un diagrama de flujo?',
    jsonb_build_array('La solución de un algoritmo mediante figuras geométricas', 'Un listado de instrucciones en lenguaje máquina', 'El plano eléctrico de un edificio', 'Un árbol de decisión de una empresa'),
    'La solución de un algoritmo mediante figuras geométricas',
    'Cada figura geométrica representa una tarea específica y las flechas muestran cómo fluye el algoritmo.', 'validada'
from public.guardianes_nivel n
where n.numero = 5
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Diagramas de flujo', 'pensamiento_algoritmico', 'opcion_multiple', 'media',
    '¿Para qué tipo de algoritmos se recomienda usar diagramas de flujo?',
    jsonb_build_array('Algoritmos simples o pequeños', 'Algoritmos muy complejos', 'Cualquier algoritmo sin límite', 'Solo algoritmos matemáticos'),
    'Algoritmos simples o pequeños',
    'Para algoritmos complejos la construcción resulta laboriosa; se entienden mejor mediante pseudocódigo.', 'validada'
from public.guardianes_nivel n
where n.numero = 5
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Símbolos del diagrama', 'pensamiento_algoritmico', 'opcion_multiple', 'facil',
    '¿Qué símbolo del diagrama de flujo indica una DECISIÓN?',
    jsonb_build_array('Rombo', 'Rectángulo', 'Paralelogramo', 'Óvalo'),
    'Rombo',
    'El rombo representa el análisis de una condición o decisión (ej. Si-entonces o MIENTRAS).', 'validada'
from public.guardianes_nivel n
where n.numero = 5
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Símbolos del diagrama', 'pensamiento_algoritmico', 'opcion_multiple', 'facil',
    '¿Qué símbolo representa la ENTRADA o SALIDA de datos?',
    jsonb_build_array('Paralelogramo', 'Óvalo', 'Rectángulo', 'Flecha'),
    'Paralelogramo',
    'El paralelogramo representa operaciones de lectura (Leer) y escritura (Escribir) en el diagrama.', 'validada'
from public.guardianes_nivel n
where n.numero = 5
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Símbolos del diagrama', 'pensamiento_algoritmico', 'opcion_multiple', 'facil',
    '¿Qué símbolo representa el INICIO o FIN de un algoritmo?',
    jsonb_build_array('Óvalo (terminador)', 'Rectángulo', 'Rombo', 'Paralelogramo'),
    'Óvalo (terminador)',
    'El óvalo o terminador marca los puntos de inicio y fin del diagrama de flujo.', 'validada'
from public.guardianes_nivel n
where n.numero = 5
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Símbolos del diagrama', 'pensamiento_algoritmico', 'opcion_multiple', 'media',
    '¿Qué símbolo representa un PROCESO (operaciones aritméticas o asignación)?',
    jsonb_build_array('Rectángulo', 'Rombo', 'Óvalo', 'Paralelogramo'),
    'Rectángulo',
    'El rectángulo indica operaciones como sumas, restas, multiplicaciones y asignaciones (+ - * / <-).', 'validada'
from public.guardianes_nivel n
where n.numero = 5
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Diagramas de flujo', 'pensamiento_algoritmico', 'opcion_multiple', 'media',
    'Las FLECHAS en un diagrama de flujo indican…',
    jsonb_build_array('La dirección o flujo del algoritmo', 'Una decisión', 'Un proceso de cálculo', 'El final del algoritmo'),
    'La dirección o flujo del algoritmo',
    'Las flechas conectan los pasos y muestran el orden en que se ejecutan.', 'validada'
from public.guardianes_nivel n
where n.numero = 5
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Diagramas de flujo', 'pensamiento_algoritmico', 'opcion_multiple', 'media',
    '¿Qué normas internacionales rigen los diagramas de flujo?',
    jsonb_build_array('Normas ISO', 'Normas IEEE-754', 'Normas ANSI Z80', 'Normas ITIL'),
    'Normas ISO',
    'El diagrama de flujo sigue normas internacionales como las de la ISO para garantizar claridad y coherencia.', 'validada'
from public.guardianes_nivel n
where n.numero = 5
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Práctica Calificada 1 · repaso integral', 'pensamiento_algoritmico', 'opcion_multiple', 'dificil',
    '¿Cuál es el orden correcto de las etapas de un algoritmo?',
    jsonb_build_array('Análisis del problema → Diseño del algoritmo → Implementación', 'Implementación → Análisis → Diseño', 'Diseño → Análisis → Implementación', 'Análisis → Implementación → Diseño'),
    'Análisis del problema → Diseño del algoritmo → Implementación',
    'Primero se analiza el problema, luego se diseña la secuencia de pasos y finalmente se implementa como programa.', 'validada'
from public.guardianes_nivel n
where n.numero = 6
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Práctica Calificada 1 · repaso integral', 'pensamiento_algoritmico', 'opcion_multiple', 'dificil',
    'Un artículo cuesta S/ 100 de compra y la tienda gana 30%. ¿Cuál debe ser el precio de venta?',
    jsonb_build_array('S/ 130', 'S/ 100', 'S/ 70', 'S/ 140'),
    'S/ 130',
    'pVenta = pCompra + ganancia = 100 + 100 × 0.3 = 130.', 'validada'
from public.guardianes_nivel n
where n.numero = 6
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Práctica Calificada 1 · repaso integral', 'pensamiento_algoritmico', 'opcion_multiple', 'dificil',
    '¿Qué tipo de dato usarías para guardar el precio de un producto?',
    jsonb_build_array('Real', 'Entero', 'Caracteres', 'Lógico'),
    'Real',
    'Los precios tienen decimales, por lo que corresponden al tipo Real (ej. 20.50, 11.99).', 'validada'
from public.guardianes_nivel n
where n.numero = 6
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Práctica Calificada 1 · repaso integral', 'pensamiento_algoritmico', 'opcion_multiple', 'dificil',
    'En un diagrama de flujo, ¿qué símbolo se usa para decisiones?',
    jsonb_build_array('Rombo', 'Rectángulo', 'Óvalo', 'Paralelogramo'),
    'Rombo',
    'El rombo representa el análisis de condiciones, tanto en condicionales como en bucles.', 'validada'
from public.guardianes_nivel n
where n.numero = 6
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Práctica Calificada 1 · repaso integral', 'pensamiento_algoritmico', 'opcion_multiple', 'dificil',
    '¿Qué conjunto describe correctamente a UN ALGORITMO?',
    jsonb_build_array('Preciso, finito y definido', 'Rápido, largo y complejo', 'Visual, flexible y abierto', 'Un solo tipo de dato, sin entradas'),
    'Preciso, finito y definido',
    'Un algoritmo es preciso (sin ambigüedad), finito (termina en N pasos) y definido (mismos datos → mismos resultados).', 'validada'
from public.guardianes_nivel n
where n.numero = 6
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Práctica Calificada 1 · repaso integral', 'pensamiento_algoritmico', 'opcion_multiple', 'dificil',
    '¿Cuál es el operador de asignación en PseInt?',
    jsonb_build_array('<-', '==', '=', '->'),
    '<-',
    'PseInt emplea ''<-'' para asignar valores a variables (edad <- 25).', 'validada'
from public.guardianes_nivel n
where n.numero = 6
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Práctica Calificada 1 · repaso integral', 'pensamiento_algoritmico', 'opcion_multiple', 'dificil',
    '¿Qué palabra reservada muestra en PANTALLA?',
    jsonb_build_array('Escribir', 'EscribirEnPantalla', 'Mostrar', 'Leer'),
    'Escribir',
    'Escribir muestra en pantalla mensajes o valores de variables. Leer toma datos del teclado.', 'validada'
from public.guardianes_nivel n
where n.numero = 6
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Práctica Calificada 1 · repaso integral', 'pensamiento_algoritmico', 'opcion_multiple', 'dificil',
    '¿Cuántas entradas tiene un algoritmo?',
    jsonb_build_array('Cero o más', 'Exactamente una', 'Exactamente dos', 'Nunca tiene entradas'),
    'Cero o más',
    'Un algoritmo puede tener cero o más entradas, pero debe tener una o más salidas.', 'validada'
from public.guardianes_nivel n
where n.numero = 6
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Condicionales simples', 'pensamiento_algoritmico', 'opcion_multiple', 'media',
    '¿Qué significa el operador relacional <> en pseudocódigo?',
    jsonb_build_array('Diferente', 'Igual', 'Menor o igual', 'Mayor o igual'),
    'Diferente',
    'El material indica: > mayor, >= mayor o igual, < menor, <= menor o igual, = igual, <> diferente.', 'validada'
from public.guardianes_nivel n
where n.numero = 7
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Operadores lógicos', 'pensamiento_algoritmico', 'opcion_multiple', 'media',
    'Si p es verdadera y q es falsa, ¿cuál es el valor de p ∧ q?',
    jsonb_build_array('Falso', 'Verdadero', 'Indefinido', 'Depende del orden'),
    'Falso',
    'Tabla Y: V ∧ F = F. La conjunción solo es verdadera cuando ambas son verdaderas.', 'validada'
from public.guardianes_nivel n
where n.numero = 7
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Operadores lógicos', 'pensamiento_algoritmico', 'opcion_multiple', 'media',
    'Si p es falsa y q es verdadera, ¿cuál es el valor de p ∨ q?',
    jsonb_build_array('Verdadero', 'Falso', 'Indefinido', 'Depende del orden'),
    'Verdadero',
    'Tabla O: F ∨ V = V. La disyunción solo es falsa cuando ambas son falsas.', 'validada'
from public.guardianes_nivel n
where n.numero = 7
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Estructura condicional', 'pensamiento_algoritmico', 'opcion_multiple', 'facil',
    '¿Qué ocurre en una estructura condicional SIMPLE si su condición es FALSA?',
    jsonb_build_array('No ejecuta ninguna acción', 'Ejecuta un bloque SiNo', 'Repite el bloque', 'Termina el programa con error'),
    'No ejecuta ninguna acción',
    'La condicional simple solo ejecuta su bloque cuando la condición es verdadera; si es falsa, no hace nada.', 'validada'
from public.guardianes_nivel n
where n.numero = 7
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Representación en diagrama de flujo', 'pensamiento_algoritmico', 'opcion_multiple', 'media',
    '¿Cómo se representa una condición en un diagrama de flujo?',
    jsonb_build_array('Con un rombo', 'Con un rectángulo', 'Con un óvalo', 'Con un paralelogramo'),
    'Con un rombo',
    'Toda evaluación de condición (simple, doble, anidada, múltiple, bucles) se representa con un rombo.', 'validada'
from public.guardianes_nivel n
where n.numero = 7
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Ejemplo validar_edad', 'pensamiento_algoritmico', 'opcion_multiple', 'media',
    'En la estructura ''Si edad < 18 Entonces Escribir «menor de edad» Fin Si'', ¿cuándo se muestra el mensaje?',
    jsonb_build_array('Solo si edad < 18 es verdadera', 'Solo si edad >= 18', 'Siempre', 'Nunca'),
    'Solo si edad < 18 es verdadera',
    'El bloque del Si solo se ejecuta cuando la condición evaluada es verdadera.', 'validada'
from public.guardianes_nivel n
where n.numero = 7
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Expresiones booleanas', 'pensamiento_algoritmico', 'opcion_multiple', 'dificil',
    '¿Cuál es el valor de verdad de 87 >= 87?',
    jsonb_build_array('Verdadero', 'Falso', 'Indefinido', 'Solo si 87 > 87'),
    'Verdadero',
    'Mayor o igual (>=) es verdadera cuando ambos lados son iguales: 87 >= 87 → V.', 'validada'
from public.guardianes_nivel n
where n.numero = 7
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Ejemplo sueldo', 'pensamiento_algoritmico', 'opcion_multiple', 'media',
    'Según la sesión, si el sueldo de un trabajador es inferior a S/ 950…',
    jsonb_build_array('Se le aplica un aumento del 15% y se muestra AUMENTOCONCEDIDO', 'Se le aplica un aumento del 10%', 'No recibe aumento', 'Pierde su puesto'),
    'Se le aplica un aumento del 15% y se muestra AUMENTOCONCEDIDO',
    'La actividad de clase pide aplicar 15% a sueldos inferiores a S/ 950 y mostrar AUMENTOCONCEDIDO.', 'validada'
from public.guardianes_nivel n
where n.numero = 7
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Condicional doble', 'pensamiento_algoritmico', 'opcion_multiple', 'facil',
    '¿Qué ejecuta la condicional DOBLE cuando la condición es FALSA?',
    jsonb_build_array('Las acciones del caso falso (bloque SiNo)', 'Ninguna acción', 'Las del caso verdadero también', 'Termina el programa'),
    'Las acciones del caso falso (bloque SiNo)',
    'La condicional doble: si la condición es verdadera se ejecutan las acciones verdaderas; si es falsa, las falsas. Solo una de ellas.', 'validada'
from public.guardianes_nivel n
where n.numero = 8
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Condicional doble', 'pensamiento_algoritmico', 'opcion_multiple', 'facil',
    '¿Cuántas ramas se ejecutan en una condicional doble?',
    jsonb_build_array('Solo una de las dos', 'Siempre las dos', 'Ninguna', 'Depende del intérprete'),
    'Solo una de las dos',
    'Según el material: ''Solo una de ellas'' se ejecuta; nunca ambas ni ninguna.', 'validada'
from public.guardianes_nivel n
where n.numero = 8
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Palabras reservadas', 'pensamiento_algoritmico', 'opcion_multiple', 'facil',
    '¿Cuáles son las palabras reservadas de la condicional DOBLE?',
    jsonb_build_array('Si, Entonces, SiNo, FinSi', 'Si, Entonces, FinSi', 'Mientras, Hacer, FinMientras', 'Segun, Hacer, FinSegun'),
    'Si, Entonces, SiNo, FinSi',
    'La doble usa Si-Entonces y SiNo; la simple solo Si-Entonces-FinSi; MIENTRAS y SEGÚN son otras estructuras.', 'validada'
from public.guardianes_nivel n
where n.numero = 8
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Ejemplo validar_edad', 'pensamiento_algoritmico', 'opcion_multiple', 'facil',
    'En validar_edad, si el usuario ingresa 22, ¿qué muestra?',
    jsonb_build_array('la persona es mayor de edad', 'la persona es menor de edad', 'ERROR', 'Nada'),
    'la persona es mayor de edad',
    'edad < 18 es falsa cuando ingresa 22, por lo tanto se ejecuta el bloque SiNo: ''mayor de edad''.', 'validada'
from public.guardianes_nivel n
where n.numero = 8
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Diagrama de flujo', 'pensamiento_algoritmico', 'opcion_multiple', 'media',
    '¿Cómo se representa la condicional doble en un diagrama de flujo?',
    jsonb_build_array('Rombo con sentencias a ambos lados', 'Rombo con una sola salida', 'Rectángulo con dos salidas', 'Óvalo con dos caminos'),
    'Rombo con sentencias a ambos lados',
    'La condicional doble es un rombo con dos caminos: un bloque si la condición es verdadera y otro si es falsa.', 'validada'
from public.guardianes_nivel n
where n.numero = 8
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Ejercicio para votar', 'pensamiento_algoritmico', 'opcion_multiple', 'media',
    'Según el ejemplo de la sesión 8, si la persona es MAYOR de edad, el mensaje es…',
    jsonb_build_array('PERMITIDO', 'NO PERMITIDO', 'AUMENTOCONCEDIDO', 'ALERTA por ola de calor'),
    'PERMITIDO',
    'El ejercicio pide: mayor de edad → ''PERMITIDO''; caso contrario → ''NO PERMITIDO''.', 'validada'
from public.guardianes_nivel n
where n.numero = 8
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Ejemplo ola de calor', 'pensamiento_algoritmico', 'opcion_multiple', 'media',
    'Si el promedio de temperaturas supera los 18°, el programa muestra…',
    jsonb_build_array('ALERTA por ola de calor', 'Temperatura normal', 'AUMENTOCONCEDIDO', 'NO PERMITIDO'),
    'ALERTA por ola de calor',
    'Según el segundo ejemplo de clase: si el promedio supera 18 → ''ALERTA por ola de calor''; caso contrario → ''Temperatura normal''.', 'validada'
from public.guardianes_nivel n
where n.numero = 8
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Simple vs doble', 'pensamiento_algoritmico', 'opcion_multiple', 'media',
    '¿Cuál es la principal DIFERENCIA entre la condicional SIMPLE y la DOBLE?',
    jsonb_build_array('La doble ejecuta un bloque también cuando la condición es falsa', 'La simple tiene dos caminos', 'La doble no usa FinSi', 'La simple no evalúa condiciones'),
    'La doble ejecuta un bloque también cuando la condición es falsa',
    'La simple no ejecuta nada si es falsa; la doble siempre ejecuta un bloque u otro.', 'validada'
from public.guardianes_nivel n
where n.numero = 8
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Condicionales anidadas', 'pensamiento_algoritmico', 'opcion_multiple', 'facil',
    '¿Qué son las condicionales ANIDADAS?',
    jsonb_build_array('Estructuras con varias condiciones en diferentes niveles, una dentro de otra', 'Dos condicionales simples en secuencia', 'Una condicional con más de dos salidas', 'Una condicional doble repetida'),
    'Estructuras con varias condiciones en diferentes niveles, una dentro de otra',
    'Anidadas: condiciones que se evalúan en secuencia dentro de un programa, como un camino que se bifurca varias veces.', 'validada'
from public.guardianes_nivel n
where n.numero = 9
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Anidadas vs doble', 'pensamiento_algoritmico', 'opcion_multiple', 'media',
    '¿Para qué se usan las condicionales anidadas?',
    jsonb_build_array('Cuando las decisiones dependen de varias condiciones', 'Cuando solo existe una decisión', 'Para repetir acciones', 'Para mostrar mensajes'),
    'Cuando las decisiones dependen de varias condiciones',
    'La anidada maneja decisiones más detalladas que no se pueden responder con una sola pregunta.', 'validada'
from public.guardianes_nivel n
where n.numero = 9
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Ejemplo de descuentos', 'pensamiento_algoritmico', 'opcion_multiple', 'media',
    'Una tienda aplica: monto < $500 sin descuento; $501–$1000, 5%; $1001–$7000, 10%; $7001–$15000, 15%; > $15000, 20%. Si compra por $750, ¿qué descuento recibe?',
    jsonb_build_array('5%', '10%', '15%', 'Ninguno'),
    '5%',
    '$750 cae en el rango $501–$1000, por lo que el descuento es del 5%.', 'validada'
from public.guardianes_nivel n
where n.numero = 9
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Ejemplo de descuentos', 'pensamiento_algoritmico', 'opcion_multiple', 'media',
    'Con la misma tabla de descuentos, ¿qué descuento recibe una compra de $8,000?',
    jsonb_build_array('15%', '10%', '20%', '5%'),
    '15%',
    '$8,000 cae en el rango $7,001–$15,000, por lo que corresponde un 15% de descuento.', 'validada'
from public.guardianes_nivel n
where n.numero = 9
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Validar_edad anidada', 'pensamiento_algoritmico', 'opcion_multiple', 'media',
    'En el ejemplo validar_edad con anidadas, si se ingresa un valor NEGATIVO, ¿qué ocurre?',
    jsonb_build_array('Se muestra ''ERROR, ingrese un valor válido''', 'Se muestra ''menor de edad''', 'Se muestra ''mayor de edad''', 'El programa se detiene'),
    'Se muestra ''ERROR, ingrese un valor válido''',
    'Primero se valida edad < 0; si es verdadera, se informa el error sin evaluar la edad.', 'validada'
from public.guardianes_nivel n
where n.numero = 9
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Comparación de estructuras', 'pensamiento_algoritmico', 'opcion_multiple', 'dificil',
    'Según la tabla comparativa, ¿qué estructura tiene mayor complejidad y flexibilidad?',
    jsonb_build_array('Condicional anidada', 'Condicional simple', 'Condicional doble', 'Todas igual'),
    'Condicional anidada',
    'La anidada evalúa múltiples caminos según varias condiciones; su complejidad es alta y su flexibilidad muy alta.', 'validada'
from public.guardianes_nivel n
where n.numero = 9
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'FinSi', 'pensamiento_algoritmico', 'opcion_multiple', 'media',
    'En una estructura con DOS Si anidados, ¿cuántas sentencias FinSi se necesitan?',
    jsonb_build_array('Dos', 'Una', 'Ninguna', 'Tres'),
    'Dos',
    'Cada Si abierto requiere su FinSi correspondiente; con dos anidados, se requieren dos FinSi.', 'validada'
from public.guardianes_nivel n
where n.numero = 9
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Ejemplo del clima', 'pensamiento_algoritmico', 'opcion_multiple', 'dificil',
    'En el ejemplo de decisión matutina, una estructura anidada analiza…',
    jsonb_build_array('El clima y si tienes que ir a trabajar', 'Solo el clima', 'Solo la hora', 'El menú del desayuno'),
    'El clima y si tienes que ir a trabajar',
    'El material plantea decidir según dos factores: el clima (soleado, lluvioso…) y si debes ir a trabajar.', 'validada'
from public.guardianes_nivel n
where n.numero = 9
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Condicional múltiple', 'pensamiento_algoritmico', 'opcion_multiple', 'facil',
    '¿Qué hace la condicional MÚLTIPLE?',
    jsonb_build_array('Evalúa una variable con distintos posibles resultados y ejecuta un bloque para cada caso', 'Repite un bloque mientras una condición sea verdadera', 'Ejecuta una acción si la condición es verdadera', 'Selecciona entre dos acciones'),
    'Evalúa una variable con distintos posibles resultados y ejecuta un bloque para cada caso',
    'Es una toma de decisión especializada para evaluar una variable contra varios valores discretos.', 'validada'
from public.guardianes_nivel n
where n.numero = 10
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Palabras reservadas', 'pensamiento_algoritmico', 'opcion_multiple', 'media',
    '¿Cuáles son las palabras reservadas de la condicional MÚLTIPLE?',
    jsonb_build_array('Segun … Hacer … FinSegun (y De Otro Modo)', 'Si … Entonces … FinSi', 'Mientras … FinMientras', 'Para … FinPara'),
    'Segun … Hacer … FinSegun (y De Otro Modo)',
    'La múltiple usa Segun <variable> Hacer, valores posibles, De Otro Modo opcional y FinSegun.', 'validada'
from public.guardianes_nivel n
where n.numero = 10
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Ejemplo del día', 'pensamiento_algoritmico', 'opcion_multiple', 'facil',
    'Según el ejemplo de la sesión 10 (Segun), si el usuario ingresa 3, se muestra…',
    jsonb_build_array('miércoles', 'martes', 'jueves', 'lunes'),
    'miércoles',
    'El mapeo del ejemplo: 1 lunes, 2 martes, 3 miércoles, 4 jueves, 5 viernes, 6 sábado, 7 domingo.', 'validada'
from public.guardianes_nivel n
where n.numero = 10
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'De Otro Modo', 'pensamiento_algoritmico', 'opcion_multiple', 'media',
    'Si en un Segun el valor ingresado no coincide con ningún caso, ¿qué se ejecuta?',
    jsonb_build_array('El bloque De Otro Modo', 'Nada', 'El primer caso', 'Un error de sintaxis'),
    'El bloque De Otro Modo',
    'De Otro Modo es el bloque por defecto cuando el valor no coincide con ningún caso (ej. mostrar ''ERROR'').', 'validada'
from public.guardianes_nivel n
where n.numero = 10
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Múltiple vs anidada', 'pensamiento_algoritmico', 'opcion_multiple', 'media',
    '¿Qué diferencia clave existe entre la condicional ANIDADA y la MÚLTIPLE?',
    jsonb_build_array('La anidada maneja rangos; la múltiple, valores discretos', 'La múltiple es siempre más lenta', 'La anidada no usa FinSi', 'Ninguna diferencia'),
    'La anidada maneja rangos; la múltiple, valores discretos',
    'Anidada: condiciones con más de dos valores (rangos). Múltiple: evalúa una variable contra valores discretos.', 'validada'
from public.guardianes_nivel n
where n.numero = 10
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Ejemplo vocales', 'pensamiento_algoritmico', 'opcion_multiple', 'dificil',
    'En la tabla de la sesión 10, si se ingresa la vocal ''e'', la palabra correspondiente es…',
    jsonb_build_array('Erlang', 'Ada', 'Intel HEX', 'Objective C'),
    'Erlang',
    'a → Ada, e → Erlang, i → Intel HEX, o → Objective C, u → UML; otra → ''No es una vocal''.', 'validada'
from public.guardianes_nivel n
where n.numero = 10
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Ejemplo motor', 'pensamiento_algoritmico', 'opcion_multiple', 'dificil',
    'Según la tabla del motor, si la temperatura es 7, el mensaje es…',
    jsonb_build_array('TEMPERATURA MEDIA-ALTA', 'TEMPERATURA BAJA', 'TEMPERATURA ALTA', 'ERROR FATAL'),
    'TEMPERATURA MEDIA-ALTA',
    '0-1 BAJA, 2-3 BAJA-MEDIA, 4-5 MEDIA, 6-7 MEDIA-ALTA, 8-9 ALTA, otro → ERROR FATAL.', 'validada'
from public.guardianes_nivel n
where n.numero = 10
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Uso cotidiano', 'pensamiento_algoritmico', 'opcion_multiple', 'media',
    '¿Cuál de estos casos es ideal para un Segun?',
    jsonb_build_array('Elegir transporte según nivel de tráfico: bajo, medio, alto, muy alto', 'Validar que un número sea positivo', 'Contar cuántas veces se ingresa un dato', 'Repetir la solicitud hasta obtener un valor válido'),
    'Elegir transporte según nivel de tráfico: bajo, medio, alto, muy alto',
    'Tráfico es una variable con valores discretos bien definidos; encajaría perfecto en Segun. Las otras son validación y repetición.', 'validada'
from public.guardianes_nivel n
where n.numero = 10
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Aplicación · Préstamo fácil', 'pensamiento_algoritmico', 'opcion_multiple', 'dificil',
    'Un cliente tipo 1 sin deuda recibe un aumento del…',
    jsonb_build_array('20%', '10%', '30%', '45%'),
    '20%',
    'Si tiene tarjeta tipo 1, el aumento es 20% (sin deuda). Si tiene deuda, se le da la mitad (10%).', 'validada'
from public.guardianes_nivel n
where n.numero = 11
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Aplicación · Préstamo fácil', 'pensamiento_algoritmico', 'opcion_multiple', 'dificil',
    'Un cliente tipo 2 CON deuda recibe un aumento del…',
    jsonb_build_array('15%', '30%', '10%', '0%'),
    '15%',
    'Tipo 2: aumento del 30%; con deuda recibe la mitad: 15%.', 'validada'
from public.guardianes_nivel n
where n.numero = 11
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Aplicación · Préstamo fácil', 'pensamiento_algoritmico', 'opcion_multiple', 'dificil',
    'Un cliente tipo 4 CON deuda recibe un aumento del…',
    jsonb_build_array('0%', '22.5%', '45%', '10%'),
    '0%',
    'Para cualquier otro tipo el aumento es 45%; sin embargo, con deuda solo tipo 1 y 2 conservan aumento (la mitad); el resto no recibe incremento.', 'validada'
from public.guardianes_nivel n
where n.numero = 11
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Aplicación · Mini-juego de manzanas', 'pensamiento_algoritmico', 'opcion_multiple', 'media',
    '¿Cuántos puntos obtiene un jugador con EXACTAMENTE 3 manzanas?',
    jsonb_build_array('30', '15', '50', '5'),
    '30',
    '1 manzana → 5 puntos, 2 manzanas → 15, 3 manzanas → 30. Más de 3 → 50 + 10 por cada adicional.', 'validada'
from public.guardianes_nivel n
where n.numero = 11
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Aplicación · Mini-juego de manzanas', 'pensamiento_algoritmico', 'opcion_multiple', 'media',
    '¿Qué ocurre si el jugador ingresa una cantidad NEGATIVA de manzanas?',
    jsonb_build_array('Se muestra un mensaje de advertencia', 'Obtiene 0 puntos y aliento', 'Suma puntos', 'Se repite la lectura infinitamente'),
    'Se muestra un mensaje de advertencia',
    'Si ingresa menos de cero o más de 20 se debe mostrar solo un mensaje de advertencia.', 'validada'
from public.guardianes_nivel n
where n.numero = 11
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Aplicación · Mini-juego de manzanas', 'pensamiento_algoritmico', 'opcion_multiple', 'media',
    'Si NO recoge ninguna manzana, el juego muestra…',
    jsonb_build_array('Un mensaje de aliento', 'Una advertencia', '50 puntos', '0 puntos y fin'),
    'Un mensaje de aliento',
    'Según las reglas del mini-juego del material: sin manzanas → mensaje de aliento.', 'validada'
from public.guardianes_nivel n
where n.numero = 11
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Evaluación', 'pensamiento_algoritmico', 'opcion_multiple', 'facil',
    '¿Qué condición evalúa si cantidad > 20 en el mini-juego?',
    jsonb_build_array('Mostrar advertencia', 'Dar bono', 'Dar 50 puntos', 'Mensaje de aliento'),
    'Mostrar advertencia',
    'La regla combina los límites: fuera de 0–20 → advertencia.', 'validada'
from public.guardianes_nivel n
where n.numero = 11
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Práctica Calificada 2', 'pensamiento_algoritmico', 'opcion_multiple', 'facil',
    'La Práctica Calificada 2 (Sesión 12) se resuelve de forma…',
    jsonb_build_array('Individual, 90 minutos, vigesimal', 'En parejas, 40 minutos', 'En grupos de 4, 60 minutos', 'Por internet, sin tiempo'),
    'Individual, 90 minutos, vigesimal',
    'El material indica: individual, 90 minutos, calificación vigesimal. La PA es en parejas y 40 minutos.', 'validada'
from public.guardianes_nivel n
where n.numero = 11
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Práctica Calificada 2 · repaso integral', 'pensamiento_algoritmico', 'opcion_multiple', 'dificil',
    '¿Cuál es el valor de p ∨ q si p = Falso y q = Verdadero?',
    jsonb_build_array('Verdadero', 'Falso', 'N/A', 'Indeterminado'),
    'Verdadero',
    'Tabla O: F ∨ V = V. Basta con que una sea verdadera.', 'validada'
from public.guardianes_nivel n
where n.numero = 12
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Práctica Calificada 2 · repaso integral', 'pensamiento_algoritmico', 'opcion_multiple', 'dificil',
    '¿Qué estructura ejecuta siempre un bloque u otro según una condición?',
    jsonb_build_array('Condicional doble', 'Condicional simple', 'PARA', 'MIENTRAS'),
    'Condicional doble',
    'Doble: si-entonces y sino — siempre ejecuta una de las dos ramas.', 'validada'
from public.guardianes_nivel n
where n.numero = 12
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Práctica Calificada 2 · repaso integral', 'pensamiento_algoritmico', 'opcion_multiple', 'dificil',
    '¿Para qué sirven las condicionales anidadas?',
    jsonb_build_array('Para decisiones que dependen de varias condiciones', 'Para repetir ciclos', 'Para operaciones aritméticas', 'Para salir del programa'),
    'Para decisiones que dependen de varias condiciones',
    'Anidadas: decisiones detalladas que no se pueden responder con una sola pregunta.', 'validada'
from public.guardianes_nivel n
where n.numero = 12
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Práctica Calificada 2 · repaso integral', 'pensamiento_algoritmico', 'opcion_multiple', 'dificil',
    'Cliente tipo 3 SIN deuda: aumento esperado del…',
    jsonb_build_array('40%', '20%', '30%', '45%'),
    '40%',
    'Tipo 3 → 40%. Con deuda no recibiría incremento.', 'validada'
from public.guardianes_nivel n
where n.numero = 12
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Práctica Calificada 2 · repaso integral', 'pensamiento_algoritmico', 'opcion_multiple', 'dificil',
    'Si el promedio de temperaturas de la semana supera los 18°, se muestra…',
    jsonb_build_array('ALERTA por ola de calor', 'Temperatura normal', 'AUMENTOCONCEDIDO', 'Fin del programa'),
    'ALERTA por ola de calor',
    'El ejemplo de la sesión 8 muestra ALERTA por ola de calor si supera 18°; caso contrario, Temperatura normal.', 'validada'
from public.guardianes_nivel n
where n.numero = 12
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Práctica Calificada 2 · repaso integral', 'pensamiento_algoritmico', 'opcion_multiple', 'dificil',
    '¿Qué símbolo representa la condición en un diagrama de flujo?',
    jsonb_build_array('Rombo', 'Rectángulo', 'Óvalo', 'Paralelogramo'),
    'Rombo',
    'Toda evaluación de condición usa el rombo.', 'validada'
from public.guardianes_nivel n
where n.numero = 12
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Práctica Calificada 2 · repaso integral', 'pensamiento_algoritmico', 'opcion_multiple', 'dificil',
    '¿Qué significan los operadores <> y !=?',
    jsonb_build_array('Diferente', 'Igual', 'Menor', 'Asignación'),
    'Diferente',
    '<> y != indican ''diferente''; == y = indican igualdad.', 'validada'
from public.guardianes_nivel n
where n.numero = 12
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Práctica Calificada 2 · repaso integral', 'pensamiento_algoritmico', 'opcion_multiple', 'dificil',
    'Jugador con 5 manzanas recibe…',
    jsonb_build_array('50 puntos + 10 × 2 adicionales = 70', '30 puntos', '50 puntos', '0 puntos'),
    '50 puntos + 10 × 2 adicionales = 70',
    'Más de 3 manzanas: 50 puntos base + 10 por cada adicional (5-3 = 2 × 10 = 20) → 70.', 'validada'
from public.guardianes_nivel n
where n.numero = 12
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Estructura repetitiva PARA', 'pensamiento_algoritmico', 'opcion_multiple', 'facil',
    '¿Cuándo conviene usar la estructura PARA?',
    jsonb_build_array('Cuando se conoce la cantidad de ciclos a repetir', 'Cuando no se conoce la cantidad de ciclos', 'Cuando se ejecuta por lo menos una vez', 'Nunca'),
    'Cuando se conoce la cantidad de ciclos a repetir',
    'El material: PARA es conveniente cuando se conoce la cantidad de ciclos (sea por el valor final o la cantidad).', 'validada'
from public.guardianes_nivel n
where n.numero = 13
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Estructura repetitiva PARA', 'pensamiento_algoritmico', 'opcion_multiple', 'facil',
    '¿Cuál es la sintaxis correcta del PARA en PseInt?',
    jsonb_build_array('Para contador <- inicio Hasta fin Con Paso valor Hacer … FinPara', 'Para contador = inicio; contador <= fin; contador++', 'For contador Hacer … FinFor', 'Repetir Hasta Que … FinRepetir'),
    'Para contador <- inicio Hasta fin Con Paso valor Hacer … FinPara',
    'Sintaxis del material: Para contador <- inicio Hasta fin Con Paso valor Hacer … FinPara.', 'validada'
from public.guardianes_nivel n
where n.numero = 13
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Paso del PARA', 'pensamiento_algoritmico', 'opcion_multiple', 'media',
    'Si se omite el Paso en el PARA, ¿qué valor toma por defecto?',
    jsonb_build_array('1 en 1', 'Se produce un error', '2 en 2', 'Ninguno'),
    '1 en 1',
    'Si se omite el paso, avanza de uno en uno.', 'validada'
from public.guardianes_nivel n
where n.numero = 13
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Paso del PARA', 'pensamiento_algoritmico', 'opcion_multiple', 'media',
    '¿Qué significa un Paso NEGATIVO?',
    jsonb_build_array('La estructura retrocede, con fin menor que el inicio', 'Se ignora y avanza de 1', 'Se convierte en MIENTRAS', 'El programa se detiene'),
    'La estructura retrocede, con fin menor que el inicio',
    'El paso negativo permite recorrer desde un inicio mayor a un fin menor.', 'validada'
from public.guardianes_nivel n
where n.numero = 13
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Contadores y acumuladores', 'pensamiento_algoritmico', 'opcion_multiple', 'media',
    '¿Cuál es la forma de un ACUMULADOR?',
    jsonb_build_array('Acumulador <- Acumulador + valor variable', 'Contador <- Contador + valor constante', 'Acumulador <- valor variable', 'Contador <- 0'),
    'Acumulador <- Acumulador + valor variable',
    'El acumulador incrementa en una cantidad variable (acum <- acum + i); el contador, en una constante (i <- i + 2).', 'validada'
from public.guardianes_nivel n
where n.numero = 13
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Contadores y acumuladores', 'pensamiento_algoritmico', 'opcion_multiple', 'media',
    '¿Qué diferencia un CONTADOR de un ACUMULADOR?',
    jsonb_build_array('El contador incrementa en valor constante; el acumulador, en valor variable', 'El contador declara; el acumulador lee', 'El acumulador suma 2; el contador 3', 'Ninguna diferencia'),
    'El contador incrementa en valor constante; el acumulador, en valor variable',
    'i <- i + 2 (contador); acum <- acum + i (acumulador).', 'validada'
from public.guardianes_nivel n
where n.numero = 13
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Caso SUMA_DIEZ', 'pensamiento_algoritmico', 'opcion_multiple', 'media',
    '¿Qué imprime el algoritmo SUMA_DIEZ?',
    jsonb_build_array('La suma de los primeros 10 números es 55', 'La suma de los primeros 10 números es 10', 'La suma de los primeros 10 números es 45', 'La suma de los primeros 1000 números'),
    'La suma de los primeros 10 números es 55',
    '1+2+3+4+5+6+7+8+9+10 = 55. El material lo resuelve tanto con sumas directas como con Para.', 'validada'
from public.guardianes_nivel n
where n.numero = 13
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Ejemplo Para 0 a 6 paso 2', 'pensamiento_algoritmico', 'opcion_multiple', 'dificil',
    'Para i <- 0 Hasta 6 Con Paso 2 Hacer Escribir i FinPara ¿qué imprime?',
    jsonb_build_array('0, 2, 4, 6', '0, 1, 2, 3, 4, 5, 6', '2, 4, 6', '0, 6'),
    '0, 2, 4, 6',
    'El contador comienza en 0 y avanza de 2 en 2 hasta 6: 0, 2, 4, 6.', 'validada'
from public.guardianes_nivel n
where n.numero = 13
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'MIENTRAS', 'pensamiento_algoritmico', 'opcion_multiple', 'facil',
    '¿Cuándo se emplea la estructura MIENTRAS?',
    jsonb_build_array('Cuando se DESCONOCE la cantidad de ciclos', 'Cuando se conoce la cantidad exacta de ciclos', 'Cuando se ejecuta exactamente una vez', 'Para asignaciones'),
    'Cuando se DESCONOCE la cantidad de ciclos',
    'A diferencia del Para, el Mientras se emplea cuando se desconoce la cantidad de ciclos.', 'validada'
from public.guardianes_nivel n
where n.numero = 14
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'MIENTRAS', 'pensamiento_algoritmico', 'opcion_multiple', 'facil',
    '¿Cuál es la sintaxis del MIENTRAS?',
    jsonb_build_array('Mientras condición Hacer … FinMientras', 'Mientras … FinSi', 'Mientras condición … FinPara', 'Hasta Que … FinMientras'),
    'Mientras condición Hacer … FinMientras',
    'Su forma: Mientras <condición> Hacer // sentencias FinMientras.', 'validada'
from public.guardianes_nivel n
where n.numero = 14
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'MIENTRAS', 'pensamiento_algoritmico', 'opcion_multiple', 'media',
    '¿Qué se debe declarar y controlar en MIENTRAS?',
    jsonb_build_array('El contador debe declararse e inicializarse, y aumentar o disminuir', 'Nada, funciona solo', 'El paso del bucle', 'El FinSi'),
    'El contador debe declararse e inicializarse, y aumentar o disminuir',
    'Según el material: se debe declarar e inicializar el contador y lograr que aumente o disminuya.', 'validada'
from public.guardianes_nivel n
where n.numero = 14
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'MIENTRAS', 'pensamiento_algoritmico', 'opcion_multiple', 'media',
    '¿Cuándo TERMINA un bucle MIENTRAS?',
    jsonb_build_array('Cuando la condición es falsa', 'Cuando la condición es verdadera', 'Tras el número fijo de iteraciones', 'Nunca'),
    'Cuando la condición es falsa',
    'Mientras la condición sea verdadera repite; cuando es falsa, termina.', 'validada'
from public.guardianes_nivel n
where n.numero = 14
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Caso DEMO_MIENTRAS', 'pensamiento_algoritmico', 'opcion_multiple', 'media',
    'El algoritmo DEMO_MIENTRAS (a<-0; Mientras a<10: Escribir a; a<-a+2) imprime…',
    jsonb_build_array('0, 2, 4, 6, 8', '0, 2, 4, 6, 8, 10', '1, 3, 5, 7, 9', '2, 4, 6, 8, 10'),
    '0, 2, 4, 6, 8',
    'Repite mientras a < 10: a = 0, 2, 4, 6, 8; a = 10 ya no cumple y termina.', 'validada'
from public.guardianes_nivel n
where n.numero = 14
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Diagrama MIENTRAS', 'pensamiento_algoritmico', 'opcion_multiple', 'media',
    '¿Cómo se representa la condición del MIENTRAS en un diagrama de flujo?',
    jsonb_build_array('Con un rombo', 'Con un rectángulo', 'Con un óvalo', 'Con un paralelogramo'),
    'Con un rombo',
    'En el diagrama de flujo, la evaluación de la condición usa un rombo, igual que en condicionales.', 'validada'
from public.guardianes_nivel n
where n.numero = 14
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'PARA vs MIENTRAS', 'pensamiento_algoritmico', 'opcion_multiple', 'facil',
    '¿Cuál es la DIFERENCIA clave entre PARA y MIENTRAS?',
    jsonb_build_array('PARA se usa con ciclos conocidos; MIENTRAS, cuando se desconocen', 'MIENTRAS garantiza al menos una ejecución', 'PARA no usa condición', 'Ninguna diferencia'),
    'PARA se usa con ciclos conocidos; MIENTRAS, cuando se desconocen',
    'PARA: cantidad de ciclos conocida (o rango). MIENTRAS: se repite mientras una condición sea verdadera, sin saber cuántas veces.', 'validada'
from public.guardianes_nivel n
where n.numero = 14
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Caso cifras', 'pensamiento_algoritmico', 'opcion_multiple', 'dificil',
    'Para contar las CIFRAS de un número natural se recomienda…',
    jsonb_build_array('MIENTRAS, porque se desconoce la cantidad de cifras', 'PARA, porque se conoce la cantidad', 'Repetir-Hasta', 'Si-Entonces'),
    'MIENTRAS, porque se desconoce la cantidad de cifras',
    'El material recomienda MIENTRAS porque no se sabe cuántas cifras tiene el número ingresado.', 'validada'
from public.guardianes_nivel n
where n.numero = 14
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'REPETIR HASTA QUE', 'pensamiento_algoritmico', 'opcion_multiple', 'facil',
    '¿Qué GARANTIZA la estructura REPETIR HASTA QUE?',
    jsonb_build_array('Que el bloque se ejecute por lo menos una vez', 'Cero ejecuciones si la condición es falsa', 'Un número fijo de vueltas', 'Nada garantiza'),
    'Que el bloque se ejecute por lo menos una vez',
    'La condición se evalúa DESPUÉS de ejecutar el bloque; por eso se ejecuta al menos una vez.', 'validada'
from public.guardianes_nivel n
where n.numero = 15
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'REPETIR HASTA QUE', 'pensamiento_algoritmico', 'opcion_multiple', 'facil',
    '¿Cuándo termina un bucle REPETIR HASTA QUE?',
    jsonb_build_array('Cuando la condición es VERDADERA', 'Cuando la condición es FALSA', 'Tras un número fijo', 'Nunca'),
    'Cuando la condición es VERDADERA',
    'Se repite mientras la condición sea falsa; termina cuando es verdadera.', 'validada'
from public.guardianes_nivel n
where n.numero = 15
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Sintaxis REPETIR', 'pensamiento_algoritmico', 'opcion_multiple', 'media',
    '¿Cuál es la sintaxis REPETIR HASTA QUE en PseInt?',
    jsonb_build_array('Repetir // sentencias Hasta Que condición', 'Repetir Hasta condición Hacer', 'Hasta Que condición Repetir', 'Mientras condición'),
    'Repetir // sentencias Hasta Que condición',
    'Estructura: Repetir // sentencias Hasta Que <condición>.', 'validada'
from public.guardianes_nivel n
where n.numero = 15
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Uso principal', 'pensamiento_algoritmico', 'opcion_multiple', 'media',
    '¿Para qué se utiliza principalmente REPETIR HASTA QUE?',
    jsonb_build_array('Para validar datos ingresados por teclado', 'Para contar vocales', 'Para operaciones matemáticas', 'Para mostrar menús fijos'),
    'Para validar datos ingresados por teclado',
    'Ej.: pedir contraseña o un número negativo hasta recibir un dato válido.', 'validada'
from public.guardianes_nivel n
where n.numero = 15
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Caso DEMO_REPETIR', 'pensamiento_algoritmico', 'opcion_multiple', 'media',
    'El algoritmo DEMO_REPETIR pide un número negativo y muestra su inverso. Si el usuario ingresa -5…',
    jsonb_build_array('Muestra ''Inverso 5''', 'Vuelve a pedir el número', 'Muestra -5', 'Termina con error'),
    'Muestra ''Inverso 5''',
    'num < 0 se cumple con -5, por lo que imprime el inverso (-num = 5).', 'validada'
from public.guardianes_nivel n
where n.numero = 15
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'REPETIR vs MIENTRAS', 'pensamiento_algoritmico', 'opcion_multiple', 'media',
    '¿Cuál es la diferencia clave entre REPETIR HASTA QUE y MIENTRAS?',
    jsonb_build_array('REPETIR garantiza ejecución mínima de una vez; MIENTRAS puede no ejecutarse', 'MIENTRAS ejecuta al menos una vez', 'REPETIR usa rombo y MIENTRAS no', 'No hay diferencia'),
    'REPETIR garantiza ejecución mínima de una vez; MIENTRAS puede no ejecutarse',
    'MIENTRAS evalúa ANTES: si la condición es falsa de entrada, el bloque no se ejecuta. REPETIR evalúa DESPUÉS.', 'validada'
from public.guardianes_nivel n
where n.numero = 15
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Caso contraseña', 'pensamiento_algoritmico', 'opcion_multiple', 'dificil',
    'Para pedir contraseña/usuario hasta que sean válidos, ¿qué estructura conviene más?',
    jsonb_build_array('REPETIR HASTA QUE', 'PARA', 'Si-Entonces', 'SegúN'),
    'REPETIR HASTA QUE',
    'Se ejecuta al menos una vez y repite la solicitud hasta que la validación sea válida; ideal para contraseñas y validación de entrada.', 'validada'
from public.guardianes_nivel n
where n.numero = 15
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Validar edad', 'pensamiento_algoritmico', 'opcion_multiple', 'dificil',
    'Un programa SOLO acepta edades mayores a 17. ¿Hasta cuándo repite?',
    jsonb_build_array('Hasta que la edad sea > 17', 'Hasta que la edad sea < 17', 'Hasta que la edad sea = 17', 'Hasta 10 intentos'),
    'Hasta que la edad sea > 17',
    'Se repite mientras la condición sea falsa (edad <= 17) y termina cuando edad > 17 es verdadera.', 'validada'
from public.guardianes_nivel n
where n.numero = 15
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Aplicación repetitivos', 'pensamiento_algoritmico', 'opcion_multiple', 'media',
    'Para mostrar los números naturales PARES entre dos límites (menor y mayor), lo correcto es…',
    jsonb_build_array('Validar que el primer valor es natural y el segundo mayor que el primero', 'Pedir los límites sin validar', 'Usar SegúN', 'Usar un Si simple'),
    'Validar que el primer valor es natural y el segundo mayor que el primero',
    'El material exige validación sin interrumpir ejecución: natural + segundo > primero.', 'validada'
from public.guardianes_nivel n
where n.numero = 16
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Lanzamiento de dado', 'pensamiento_algoritmico', 'opcion_multiple', 'media',
    '¿Qué estructura se usa para simular un dado hasta obtener un 6?',
    jsonb_build_array('REPETIR HASTA QUE', 'PARA', 'MIENTRAS con paso conocido', 'Si doble'),
    'REPETIR HASTA QUE',
    'El juego debe lanzar al menos una vez y continuar hasta el 6; el material usa Repetir-Hasta (versión adecuada).', 'validada'
from public.guardianes_nivel n
where n.numero = 16
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Lanzamiento de dado', 'pensamiento_algoritmico', 'opcion_multiple', 'media',
    'En el caso del dado, ¿qué mensaje se muestra cuando se obtiene 6?',
    jsonb_build_array('FELICIDADES', 'GANASTE', 'FIN', 'PERMITIDO'),
    'FELICIDADES',
    'El algoritmo de la Sesión 16 muestra ''FELICIDADES'' y finaliza al obtener 6.', 'validada'
from public.guardianes_nivel n
where n.numero = 16
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Prueba de escritorio', 'pensamiento_algoritmico', 'opcion_multiple', 'dificil',
    '¿Qué es la PRUEBA DE ESCRITORIO?',
    jsonb_build_array('Una técnica de depuración que ejecuta el algoritmo paso a paso con valores específicos', 'Una técnica para medir la memoria usada', 'Una prueba automática de extremo a extremo', 'Un test de rendimiento'),
    'Una técnica de depuración que ejecuta el algoritmo paso a paso con valores específicos',
    'Verificación manual del algoritmo con valores de prueba, observando los resultados en cada paso.', 'validada'
from public.guardianes_nivel n
where n.numero = 16
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Prueba de escritorio', 'pensamiento_algoritmico', 'opcion_multiple', 'media',
    '¿Para qué tipo de algoritmos es especialmente útil la prueba de escritorio?',
    jsonb_build_array('Algoritmos pequeños o simples', 'Sistemas distribuidos', 'Compiladores', 'Bases de datos'),
    'Algoritmos pequeños o simples',
    'Se pueden realizar rápida y fácilmente en algoritmos pequeños o simples.', 'validada'
from public.guardianes_nivel n
where n.numero = 16
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Prueba de escritorio', 'pensamiento_algoritmico', 'opcion_multiple', 'media',
    '¿En qué ayuda la prueba de escritorio?',
    jsonb_build_array('A entender cómo se ejecutan los algoritmos e identificar errores', 'A reducir el tiempo de desarrollo', 'A hacer copias de seguridad', 'A compilar más rápido'),
    'A entender cómo se ejecutan los algoritmos e identificar errores',
    'Ayuda a comprender el flujo de control y de datos e identificar errores antes de ejecutar en la computadora.', 'validada'
from public.guardianes_nivel n
where n.numero = 16
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Validación de entradas', 'pensamiento_algoritmico', 'opcion_multiple', 'media',
    'Validar entradas SIN interrumpir la ejecución significa…',
    jsonb_build_array('Volver a pedir el dato hasta que sea válido', 'Terminar con error', 'Ignorar el dato', 'Reemplazar por cero'),
    'Volver a pedir el dato hasta que sea válido',
    'Las S16/S17/S15 lo exigen: si el dato es inválido, se vuelve a pedir sin interrumpir la ejecución.', 'validada'
from public.guardianes_nivel n
where n.numero = 16
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Aplicación tablas', 'pensamiento_algoritmico', 'opcion_multiple', 'dificil',
    'Para mostrar números pares entre 4 y 40, si el usuario ingresa 4 y 40, la secuencia finaliza en…',
    jsonb_build_array('40', '38', '42', '4'),
    '40',
    'El material muestra pares entre los límites inclusive: 4, 6, 8, …, 38, 40.', 'validada'
from public.guardianes_nivel n
where n.numero = 16
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Taller de repaso', 'pensamiento_algoritmico', 'opcion_multiple', 'dificil',
    'Un empleado con sueldo base 1000 y dos bonificaciones de 100, con AFP del 11%. ¿Cuál es el sueldo final?',
    jsonb_build_array('1068', '1200', '1100', '980'),
    '1068',
    'Sueldo total = 1000 + 200 = 1200. Descuento AFP = 11% × 1200 = 132. Sueldo final = 1200 − 132 = 1068.', 'validada'
from public.guardianes_nivel n
where n.numero = 17
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Taller de repaso', 'pensamiento_algoritmico', 'opcion_multiple', 'dificil',
    'Con sueldo base 1000, categoría B (aumento 10%). ¿Sueldo final?',
    jsonb_build_array('1100', '1200', '1050', '1000'),
    '1100',
    'Categoría B → aumento 10% = 100; 1000 + 100 = 1100.', 'validada'
from public.guardianes_nivel n
where n.numero = 17
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Caso deporte por temperatura', 'pensamiento_algoritmico', 'opcion_multiple', 'media',
    'Según la tabla del taller, temperatura > 30 sugiere…',
    jsonb_build_array('Natación', 'Tenis', 'Golf', 'Esquí'),
    'Natación',
    '>30 → Natación; >20 y <=30 → Tenis; >0 y <=20 → Golf; <=0 → Esquí.', 'validada'
from public.guardianes_nivel n
where n.numero = 17
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Caso números cúbicos', 'pensamiento_algoritmico', 'opcion_multiple', 'dificil',
    'Si el usuario ingresa 5, ¿cuáles son los cubos que debe mostrar?',
    jsonb_build_array('1, 8, 27, 64, 125', '1, 4, 9, 16, 25', '1, 27, 125', '5, 25, 125'),
    '1, 8, 27, 64, 125',
    'Cubos de 1..5: 1, 8, 27, 64, 125. Se resuelve con Para y Mientras (2 soluciones).', 'validada'
from public.guardianes_nivel n
where n.numero = 17
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Caso promedio de notas', 'pensamiento_algoritmico', 'opcion_multiple', 'media',
    'Para aprobar en el instituto se requiere un promedio de…',
    jsonb_build_array('11.5 o más', '14 o más', '10.5 o más', '12 o más'),
    '11.5 o más',
    'Nota aprobatoria según el material: promedio de 11.5 o más.', 'validada'
from public.guardianes_nivel n
where n.numero = 17
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Validación de notas', 'pensamiento_algoritmico', 'opcion_multiple', 'media',
    'En el caso de promedios, las notas deben validarse entre…',
    jsonb_build_array('0 y 20', '0 y 10', '1 y 100', '5 y 20'),
    '0 y 20',
    'Notas entre 0 y 20; n positivo; no interrumpir ejecución si un valor es errado.', 'validada'
from public.guardianes_nivel n
where n.numero = 17
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Estructuras mixtas', 'pensamiento_algoritmico', 'opcion_multiple', 'dificil',
    'Para calcular promedios de múltiples estudiantes se requieren…',
    jsonb_build_array('Estructuras repetitivas anidadas', 'Solo condicionales', 'Solo secuenciales', 'Solo PARA'),
    'Estructuras repetitivas anidadas',
    'Un bucle externo por estudiante y uno interno por cada nota.', 'validada'
from public.guardianes_nivel n
where n.numero = 17
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Caso 2 categorización', 'pensamiento_algoritmico', 'opcion_multiple', 'media',
    'Categoría C → aumento según la tabla del taller:',
    jsonb_build_array('5%', '10%', '20%', '15%'),
    '5%',
    'A → 20%, B → 10%, C → 5%.', 'validada'
from public.guardianes_nivel n
where n.numero = 17
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Evaluación Final · repaso integral', 'pensamiento_algoritmico', 'opcion_multiple', 'dificil',
    'p = Falso y q = Verdadero. ¿Cuál es el valor de p ∧ q?',
    jsonb_build_array('Falso', 'Verdadero', 'N/A', 'Ambos'),
    'Falso',
    'Tabla Y: solo es V cuando ambas son V; en F ∧ V → F.', 'validada'
from public.guardianes_nivel n
where n.numero = 18
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Evaluación Final · repaso integral', 'pensamiento_algoritmico', 'opcion_multiple', 'dificil',
    '¿Qué estructura se usa cuando se conoce la cantidad exacta de iteraciones?',
    jsonb_build_array('PARA', 'MIENTRAS', 'REPETIR HASTA QUE', 'SEGÚN'),
    'PARA',
    'La estructura PARA es para números específicos de repeticiones; MIENTRAS cuando se desconoce la cantidad; REPETIR cuando se requiere al menos una ejecución.', 'validada'
from public.guardianes_nivel n
where n.numero = 18
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Evaluación Final · repaso integral', 'pensamiento_algoritmico', 'opcion_multiple', 'dificil',
    'Notas: 12, 8, 14, 16, 10. Promedio:',
    jsonb_build_array('12 y aprobado', '12 y desaprobado', '10 y desaprobado', '14 y aprobado'),
    '12 y aprobado',
    '(12+8+14+16+10)/5 = 60/5 = 12; 12 >= 11.5 → aprobado.', 'validada'
from public.guardianes_nivel n
where n.numero = 18
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Evaluación Final · repaso integral', 'pensamiento_algoritmico', 'opcion_multiple', 'dificil',
    '¿<> significa…?',
    jsonb_build_array('Diferente', 'Igual', 'Asignación', 'Mayor que'),
    'Diferente',
    'Operador relacional <> y su alternativa !=.', 'validada'
from public.guardianes_nivel n
where n.numero = 18
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Evaluación Final · repaso integral', 'pensamiento_algoritmico', 'opcion_multiple', 'dificil',
    '¿Qué ejecuta la condicional DOBLE si su condición es verdadera?',
    jsonb_build_array('El bloque Si-Entonces', 'El bloque SiNo', 'Nada', 'El FinSi'),
    'El bloque Si-Entonces',
    'Doble: V → bloque Si-Entonces; F → bloque SiNo.', 'validada'
from public.guardianes_nivel n
where n.numero = 18
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Evaluación Final · repaso integral', 'pensamiento_algoritmico', 'opcion_multiple', 'dificil',
    'En PseInt, ¿cuál es el operador de ASIGNACIÓN?',
    jsonb_build_array('<-', '==', '=', ':='),
    '<-',
    'La asignación en PseInt usa ''<-'' (edad <- 25).', 'validada'
from public.guardianes_nivel n
where n.numero = 18
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Evaluación Final · repaso integral', 'pensamiento_algoritmico', 'opcion_multiple', 'dificil',
    '¿Para qué sirve REPETIR HASTA QUE?',
    jsonb_build_array('Ejecutar un bloque al menos una vez, hasta que una condición se cumpla', 'Contar ciclos conocidos', 'Solo una ejecución', 'Reemplazar Si por MIENTRAS'),
    'Ejecutar un bloque al menos una vez, hasta que una condición se cumpla',
    'Ejecuta mínimo una vez y se detiene cuando la condición es verdadera.', 'validada'
from public.guardianes_nivel n
where n.numero = 18
  and n.campana_id = (select id from public.guardianes_campana limit 1);

insert into public.guardianes_pregunta (nivel_id, tema, competencia, tipo, dificultad, enunciado, opciones, correcta, explicacion, estado)
select n.id,
    'Evaluación Final · repaso integral', 'pensamiento_algoritmico', 'opcion_multiple', 'dificil',
    '¿Qué símbolos representan INICIO/FIN en un diagrama de flujo?',
    jsonb_build_array('Óvalo (terminador)', 'Rombo', 'Rectángulo', 'Flecha'),
    'Óvalo (terminador)',
    'El terminador (óvalo) marca los puntos de inicio y fin del algoritmo.', 'validada'
from public.guardianes_nivel n
where n.numero = 18
  and n.campana_id = (select id from public.guardianes_campana limit 1);

