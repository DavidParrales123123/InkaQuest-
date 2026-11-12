-- =============================================================================
-- SUPABASE - Semilla del catalogo academico de InkaQuest
-- -----------------------------------------------------------------------------
-- Carga las categorias y los cursos publicados del catalogo.
--
-- Los `slug` de `public.curso` deben coincidir con las claves de
-- `CURSO_A_IMAGEN` (frontend/inkaquest-web/src/app/shared/utilities/
-- curso-imagen.util.ts) para que cada curso muestre SU portada oficial.
--
-- Es idempotente: se puede ejecutar varias veces sin duplicar filas
-- (ON CONFLICT sobre el slug).
--
-- Ejecutar:
--   psql -h <host> -U postgres -d postgres -f supabase/seed/catalogo_cursos.sql
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- Categorias
-- -----------------------------------------------------------------------------
INSERT INTO public.categoria (nombre, slug, descripcion, icono, orden, activo)
VALUES
  ('Algoritmos', 'algoritmos',
   'Fundamentos de algoritmos, estructuras de datos y analisis de complejidad.',
   'cpu', 10, true),

  ('Bases de datos', 'bases-de-datos',
   'Modelado relacional, SQL, esquemas, consultas y tendencias de almacenamiento.',
   'database', 20, true),

  ('Programacion', 'programacion',
   'Paradigmas, orientacion a objetos y practicas de ingenieria de software.',
   'code', 30, true),

  ('Desarrollo web', 'desarrollo-web',
   'Tecnologias web, interfaces y construccion de aplicaciones completas.',
   'globe', 40, true),

  ('Sistemas', 'sistemas',
   'Sistemas operativos, arquitectura y gestion de recursos computacionales.',
   'server', 50, true),

  ('Redes', 'redes',
   'Protocolos, comunicacion de datos e infraestructura de conectividad.',
   'network', 60, true),

  ('Fundamentos TIC', 'fundamentos-tic',
   'Herramientas digitales, ofimatica avanzada y cultura tecnologica.',
   'monitor', 70, true)
ON CONFLICT (slug) DO UPDATE
  SET descripcion = EXCLUDED.descripcion,
      icono       = EXCLUDED.icono,
      orden       = EXCLUDED.orden,
      activo      = EXCLUDED.activo,
      actualizado_en = now();

-- -----------------------------------------------------------------------------
-- Cursos
-- El slug determina la portada oficial que muestra el frontend.
-- -----------------------------------------------------------------------------
INSERT INTO public.curso (
  categoria_id, titulo, slug, descripcion, contenido,
  estado, precio, moneda, xp_total, duracion_minutos, publicado_en
)
SELECT c.id, v.titulo, v.slug, v.descripcion, v.contenido,
       'publicado'::public.estado_curso, v.precio, 'PEN', v.xp_total,
       v.duracion_minutos, now()
  FROM (VALUES
    -- ---------------------------------------------------------------------
    ('algoritmos', 'Principios de Algoritmos',
     'principios-algoritmos',
     'Metodos de diseno, analisis de complejidad y criterios para elegir la estrategia adecuada.',
     'Recorridos, busqueda, ordenamiento, divide y venceras, programacion dinamica y analisis de complejidad con casos de estudio.',
      0, 181440, 1200),

    ('algoritmos', 'Algoritmos y Estructuras de Datos',
     'algoritmos-estructuras-datos',
     'Estructuras lineales, no lineales y su uso eficiente para resolver problemas reales.',
     'Listas, pilas, colas, arboles, grafos, tablas hash y heaps, con implementacion y analisis de rendimiento.',
      250, 181440, 1600),

    ('algoritmos', 'Analisis y Diseno de Algoritmos',
     'analisis-diseno-algoritmos',
     'Tecnicas de analisis, cota de complejidad y seleccion del algoritmo mas adecuado.',
     'Notacion asintotica, analisis de recurrencias, metodos de diseño, algoritmos greedy y backtracking.',
      250, 181440, 1800),

    ('bases-de-datos', 'Base de Datos 1: SQL y Esquemas',
     'base-de-datos-1',
     'Modelo relacional, diseño de esquemas y consultas SQL con criterio.',
     'Algebra relacional, normalizacion, DDL, DML, joins, indices y_optimizacion de consultas.',
      130, 181440, 1400),

    ('bases-de-datos', 'Base de Datos 2: Futuro SQL',
     'base-de-datos-2',
     'Evolucion del almacenamiento relacional: JSON, series de tiempo y arquitectura analitica.',
     'Tipos avanzados, JSONB, funciones de ventana, particionado, replicacion y tendencias NoSQL.',
      250, 181440, 1700),

    ('programacion', 'Diseno de Patrones: Guia Visual de Software',
     'diseno-patrones',
     'Catalogo visual de patrones de diseno y cuando aplicar cada uno.',
     'Patrones creacionales, estructurales y de comportamiento, con problemas, solucion y criterios de decision.',
      250, 181440, 1500),

    ('fundamentos-tic', 'Introduccion a las TIC en Neon',
     'introduccion-tic',
     'Fundamentos de las herramientas digitales aplicadas al trabajo academico y profesional.',
     'Hardware, software, ofimatica avanzada, colaboracion en linea, seguridad digital y ciudadania digital.',
      90, 181440, 900),

    ('programacion', 'Programacion Orientada a Objetos',
     'poo',
     'Principios del paradigma de objetos: abstraccion, herencia, composicion y buen diseno.',
     'Clases y objetos, encapsulamiento, herencia, polimorfismo, interfaces, SOLID y refactorizacion.',
      250, 181440, 1500),

    ('redes', 'Redes y Comunicacion de Datos 1',
     'redes-comunicacion-datos',
     'Arquitectura de redes, protocolos de comunicacion y resolucion de problemas.',
     'Modelo OSI y TCP/IP, direccionamiento, enrutamiento, DNS, transporte y diagnostico de redes.',
      130, 181440, 1400),

    ('sistemas', 'Sistemas Operativos: Guia Visual Futurista',
     'sistemas-operativos',
     'Como funciona un sistema operativo: procesos, memoria, archivos y concurrencia.',
     'Gestión de procesos, planificacion de CPU, memoria virtual, sistema de archivos y concurrencia.',
      250, 181440, 1600),

    ('programacion', 'Taller de Programacion Java',
     'taller-programacion-java',
     'Taller practico de Java desde los fundamentos hasta colecciones, excepciones y streams.',
     'Sintaxis, POO, estructuras de control, colecciones, streams, entrada/salida y manejo de errores.',
      160, 181440, 1800),

    ('desarrollo-web', 'Taller de Programacion Web Neon',
     'taller-programacion-web',
     'Taller practico de desarrollo web: HTML semantico, CSS moderno y JavaScript en el navegador.',
     'HTML5, CSS con diseño responsive, JavaScript moderno, DOM, accesibilidad y consumo de APIs.',
      250, 181440, 1900)
  ) AS v(categoria_slug, titulo, slug, descripcion, contenido, precio, duracion_minutos, xp_total)
  JOIN public.categoria c ON c.slug = v.categoria_slug
ON CONFLICT (slug) DO UPDATE
  SET categoria_id    = EXCLUDED.categoria_id,
      titulo          = EXCLUDED.titulo,
      descripcion     = EXCLUDED.descripcion,
      contenido       = EXCLUDED.contenido,
      precio          = EXCLUDED.precio,
      xp_total        = EXCLUDED.xp_total,
      duracion_minutos= EXCLUDED.duracion_minutos,
      actualizado_en  = now();

COMMIT;

-- -----------------------------------------------------------------------------
-- Verificacion
-- -----------------------------------------------------------------------------
DO $$
DECLARE
    v_cursos   integer;
    v_categorias integer;
    v_slugs    text;
BEGIN
    SELECT count(*) INTO v_cursos     FROM public.curso WHERE estado = 'publicado';
    SELECT count(*) INTO v_categorias FROM public.categoria WHERE activo;

    SELECT string_agg(slug, ', ' ORDER BY slug) INTO v_slugs
      FROM public.curso
     WHERE slug IN (
        'principios-algoritmos', 'algoritmos-estructuras-datos',
        'analisis-diseno-algoritmos', 'base-de-datos-1', 'base-de-datos-2',
        'diseno-patrones', 'introduccion-tic', 'poo',
        'redes-comunicacion-datos', 'sistemas-operativos',
        'taller-programacion-java', 'taller-programacion-web');

    RAISE NOTICE 'Categorias activas: %', v_categorias;
    RAISE NOTICE 'Cursos publicados: %', v_cursos;
    RAISE NOTICE 'Slugs con portada oficial: %', v_slugs;
END $$;
