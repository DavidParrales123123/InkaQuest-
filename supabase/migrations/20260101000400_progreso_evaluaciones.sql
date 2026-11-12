-- =============================================================================
-- MIGRACION 0004 - Modulo E: Progreso academico
--                 Modulo F: Actividades y evaluaciones
-- -----------------------------------------------------------------------------
-- Depende de: 0001 (tipos), 0002 (leccion, modulo), 0003 (matricula)
--
-- SEGURIDAD DE LAS EVALUACIONES
--   Las respuestas correctas (opcion.es_correcta) y las preguntas private
--   NUNCA deben ser legibles por el estudiante antes de entregar. Las
--   politicas RLS de la migracion 0007 lo garantizan: solo el docente del
--   curso o un administrador acceden a la columna de soluciones.
-- =============================================================================


-- =============================================================================
-- MODULO E - PROGRESO ACADEMICO
-- =============================================================================

-- -----------------------------------------------------------------------------
-- E.1 Progreso por curso
-- -----------------------------------------------------------------------------
create table if not exists public.progreso_curso (
    id                uuid primary key default gen_random_uuid(),
    matricula_id      uuid        not null references public.matricula (id) on delete cascade,
    estudiante_id     uuid        not null references public.perfil (id) on delete cascade,
    curso_id          uuid        not null references public.curso (id) on delete cascade,
    estado            public.estado_progreso not null default 'no_iniciado',
    porcentaje        numeric(5, 2) not null default 0 check (porcentaje between 0 and 100),
    lecciones_completadas integer  not null default 0 check (lecciones_completadas >= 0),
    minutos_estudio   integer     not null default 0 check (minutos_estudio >= 0),
    iniciado_en       timestamptz,
    completado_en     timestamptz,
    ultima_actividad_en timestamptz,
    creado_en         timestamptz not null default now(),
    actualizado_en    timestamptz not null default now(),
    unique (matricula_id)
);

create index if not exists idx_progreso_curso_estudiante
    on public.progreso_curso (estudiante_id, estado);
create index if not exists idx_progreso_curso_curso
    on public.progreso_curso (curso_id, estado);

-- -----------------------------------------------------------------------------
-- E.2 Progreso por unidad
-- -----------------------------------------------------------------------------
create table if not exists public.progreso_unidad (
    id                uuid primary key default gen_random_uuid(),
    progreso_curso_id uuid        not null references public.progreso_curso (id) on delete cascade,
    unidad_id         uuid        not null references public.unidad (id) on delete cascade,
    estudiante_id     uuid        not null references public.perfil (id) on delete cascade,
    estado            public.estado_progreso not null default 'no_iniciado',
    porcentaje        numeric(5, 2) not null default 0 check (porcentaje between 0 and 100),
    iniciado_en       timestamptz,
    completado_en     timestamptz,
    creado_en         timestamptz not null default now(),
    actualizado_en    timestamptz not null default now(),
    unique (progreso_curso_id, unidad_id)
);

-- -----------------------------------------------------------------------------
-- E.3 Progreso por leccion
-- -----------------------------------------------------------------------------
create table if not exists public.progreso_leccion (
    id                uuid primary key default gen_random_uuid(),
    progreso_curso_id uuid        not null references public.progreso_curso (id) on delete cascade,
    leccion_id        uuid        not null references public.leccion (id) on delete cascade,
    estudiante_id     uuid        not null references public.perfil (id) on delete cascade,
    estado            public.estado_progreso not null default 'no_iniciado',
    porcentaje        numeric(5, 2) not null default 0 check (porcentaje between 0 and 100),
    xp_obtenido       integer     not null default 0 check (xp_obtenido >= 0),
    minutos_estudio   integer     not null default 0 check (minutos_estudio >= 0),
    iniciado_en       timestamptz,
    completado_en     timestamptz,
    creado_en         timestamptz not null default now(),
    actualizado_en    timestamptz not null default now(),
    unique (progreso_curso_id, leccion_id)
);

create index if not exists idx_progreso_leccion_estudiante
    on public.progreso_leccion (estudiante_id, estado);
create index if not exists idx_progreso_leccion_leccion
    on public.progreso_leccion (leccion_id);

-- -----------------------------------------------------------------------------
-- E.4 Historial de progreso (append-only)
-- -----------------------------------------------------------------------------
create table if not exists public.historial_progreso (
    id                uuid primary key default gen_random_uuid(),
    progreso_curso_id uuid        not null references public.progreso_curso (id) on delete cascade,
    estudiante_id     uuid        not null references public.perfil (id) on delete cascade,
    tipo              text        not null,
    valor_anterior    numeric(8, 2),
    valor_nuevo       numeric(8, 2),
    duracion_minutos  integer     not null default 0,
    datos             jsonb       not null default '{}'::jsonb,
    creado_en         timestamptz not null default now()
);

create index if not exists idx_historial_progreso_curso
    on public.historial_progreso (progreso_curso_id, creado_en desc);

-- -----------------------------------------------------------------------------
-- E.5 Actividades completadas (registro transversal)
-- -----------------------------------------------------------------------------
create table if not exists public.actividad_completada (
    id                uuid primary key default gen_random_uuid(),
    estudiante_id     uuid        not null references public.perfil (id) on delete cascade,
    actividad_id      uuid        not null,
    curso_id          uuid        references public.curso (id) on delete cascade,
    leccion_id        uuid references public.leccion (id) on delete cascade,
    xp_obtenido       integer     not null default 0 check (xp_obtenido >= 0),
    porcentaje        numeric(5, 2) not null default 100 check (porcentaje between 0 and 100),
    completado_en     timestamptz not null default now(),
    unique (estudiante_id, actividad_id)
);

create index if not exists idx_actividad_completada_estudiante
    on public.actividad_completada (estudiante_id, completado_en desc);


-- =============================================================================
-- MODULO F - ACTIVIDADES Y EVALUACIONES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- F.1 Actividades (contenedor de cualquier tipo de evaluacion)
-- -----------------------------------------------------------------------------
create table if not exists public.actividad (
    id                uuid primary key default gen_random_uuid(),
    leccion_id        uuid        not null references public.leccion (id) on delete cascade,
    curso_id          uuid        not null references public.curso (id) on delete cascade,
    tipo              public.tipo_actividad not null default 'lectura',
    titulo            text        not null,
    descripcion       text,
    instrucciones     text,
    puntos            numeric(8, 2) not null default 0 check (puntos >= 0),
    xp_otorgado       integer     not null default 0 check (xp_otorgado >= 0),
    tiempo_limite_minutos integer,
    intentos_permitidos integer   not null default 1 check (intentos_permitidos >= 1),
    requiere_publicacion boolean not null default false,
    publicado         boolean     not null default false,
    creado_por        uuid references public.perfil (id) on delete set null,
    creado_en         timestamptz not null default now(),
    actualizado_en    timestamptz not null default now()
);

create index if not exists idx_actividad_leccion
    on public.actividad (leccion_id);
create index if not exists idx_actividad_curso_tipo
    on public.actividad (curso_id, tipo);

-- -----------------------------------------------------------------------------
-- F.2 Tareas (entregas de archivos o texto)
-- -----------------------------------------------------------------------------
create table if not exists public.tarea (
    id                uuid primary key default gen_random_uuid(),
    actividad_id      uuid        not null unique references public.actividad (id) on delete cascade,
    fecha_entrega     timestamptz,
    fecha_apertura    timestamptz,
    permite_entrega_tardia boolean not null default true,
    penalizacion_tardia numeric(5, 2) not null default 0
                        check (penalizacion_tardia between 0 and 100),
    nota_maxima       numeric(8, 2) not null default 100 check (nota_maxima >= 0),
    creado_en         timestamptz not null default now(),
    actualizado_en    timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- F.3 Evaluaciones (contenedor de preguntas)
-- -----------------------------------------------------------------------------
create table if not exists public.evaluacion (
    id                uuid primary key default gen_random_uuid(),
    actividad_id      uuid        not null unique references public.actividad (id) on delete cascade,
    titulo            text        not null,
    descripcion       text,
    nota_maxima       numeric(8, 2) not null default 100 check (nota_maxima >= 0),
    porcentaje_aprobacion numeric(5, 2) not null default 60
                        check (porcentaje_aprobacion between 0 and 100),
    intentos_permitidos integer   not null default 1 check (intentos_permitidos >= 1),
    aleatorizar_preguntas boolean not null default false,
    mostrar_resultado_inmediato boolean not null default true,
    duracion_minutos  integer     check (duracion_minutos is null or duracion_minutos > 0),
    creado_en         timestamptz not null default now(),
    actualizado_en    timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- F.4 Examenes (instancia programable de una evaluacion)
-- -----------------------------------------------------------------------------
create table if not exists public.examen (
    id                uuid primary key default gen_random_uuid(),
    evaluacion_id     uuid        not null references public.evaluacion (id) on delete cascade,
    nombre            text        not null,
    fecha_apertura    timestamptz,
    fecha_cierre      timestamptz,
    intentos_maximos  integer     not null default 1 check (intentos_maximos >= 1),
    disponible        boolean     not null default true,
    creado_en         timestamptz not null default now(),
    actualizado_en    timestamptz not null default now(),
    check (fecha_cierre is null or fecha_apertura is null or fecha_cierre > fecha_apertura)
);

-- -----------------------------------------------------------------------------
-- F.5 Preguntas
--     es_privada = true  -> no visible para el estudiante
-- -----------------------------------------------------------------------------
create table if not exists public.pregunta (
    id                uuid primary key default gen_random_uuid(),
    evaluacion_id     uuid        not null references public.evaluacion (id) on delete cascade,
    orden             integer     not null check (orden > 0),
    tipo              public.tipo_pregunta not null default 'opcion_unica',
    enunciado         text        not null,
    descripcion       text,
    puntos            numeric(8, 2) not null default 1 check (puntos >= 0),
    es_privada        boolean     not null default false,
    requiere_revision boolean     not null default false,
    retroalimentacion text,
    creado_en         timestamptz not null default now(),
    actualizado_en    timestamptz not null default now(),
    unique (evaluacion_id, orden)
);

-- -----------------------------------------------------------------------------
-- F.6 Opciones de respuesta (contienen la solucion: dato protegido)
-- -----------------------------------------------------------------------------
create table if not exists public.opcion (
    id                uuid primary key default gen_random_uuid(),
    pregunta_id       uuid        not null references public.pregunta (id) on delete cascade,
    orden             integer     not null check (orden > 0),
    texto             text        not null,
    es_correcta       boolean     not null default false,
    valor             text,
    created_en        timestamptz not null default now(),
    unique (pregunta_id, orden)
);

create index if not exists idx_opcion_pregunta
    on public.opcion (pregunta_id);

-- -----------------------------------------------------------------------------
-- F.7 Criterios de evaluacion (rubrica)
-- -----------------------------------------------------------------------------
create table if not exists public.criterio_evaluacion (
    id                uuid primary key default gen_random_uuid(),
    evaluacion_id     uuid        not null references public.evaluacion (id) on delete cascade,
    nombre            text        not null,
    descripcion       text,
    peso              numeric(5, 2) not null default 0 check (peso between 0 and 100),
    orden             integer     not null default 0,
    creado_en         timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- F.8 Intentos de evaluacion
-- -----------------------------------------------------------------------------
create table if not exists public.intento_evaluacion (
    id                uuid primary key default gen_random_uuid(),
    evaluacion_id     uuid        not null references public.evaluacion (id) on delete cascade,
    examen_id         uuid references public.examen (id) on delete set null,
    estudiante_id     uuid        not null references public.perfil (id) on delete cascade,
    numero            integer     not null check (numero > 0),
    estado            public.estado_intento not null default 'iniciado',
    puntaje           numeric(8, 2) not null default 0 check (puntaje >= 0),
    puntaje_maximo    numeric(8, 2) not null default 0 check (puntaje_maximo >= 0),
    aprobado          boolean,
    tiempo_inicio     timestamptz not null default now(),
    tiempo_fin        timestamptz,
    creado_en         timestamptz not null default now(),
    actualizado_en    timestamptz not null default now(),
    unique (evaluacion_id, estudiante_id, numero)
);

create index if not exists idx_intento_evaluacion_estudiante
    on public.intento_evaluacion (estudiante_id, estado);

-- -----------------------------------------------------------------------------
-- F.9 Respuestas del estudiante
-- -----------------------------------------------------------------------------
create table if not exists public.respuesta_evaluacion (
    id                uuid primary key default gen_random_uuid(),
    intento_id        uuid        not null references public.intento_evaluacion (id) on delete cascade,
    pregunta_id       uuid        not null references public.pregunta (id) on delete cascade,
    opcion_id         uuid references public.opcion (id) on delete set null,
    texto_respuesta   text,
    es_correcta       boolean,
    puntaje_otorgado  numeric(8, 2) not null default 0 check (puntaje_otorgado >= 0),
    retroalimentacion text,
    creado_en         timestamptz not null default now(),
    actualizado_en    timestamptz not null default now(),
    unique (intento_id, pregunta_id)
);

create index if not exists idx_respuesta_evaluacion_intento
    on public.respuesta_evaluacion (intento_id);

-- -----------------------------------------------------------------------------
-- F.10 Entregas (tareas entregadas)
-- -----------------------------------------------------------------------------
create table if not exists public.entrega (
    id                uuid primary key default gen_random_uuid(),
    tarea_id          uuid        not null references public.tarea (id) on delete cascade,
    estudiante_id     uuid        not null references public.perfil (id) on delete cascade,
    estado            public.estado_entrega not null default 'borrador',
    contenido         text,
    nota              numeric(8, 2) check (nota is null or nota >= 0),
    enviada_en        timestamptz,
    revisada_en       timestamptz,
    creado_en         timestamptz not null default now(),
    actualizado_en    timestamptz not null default now()
);

create index if not exists idx_entrega_tarea
    on public.entrega (tarea_id);
create index if not exists idx_entrega_estudiante
    on public.entrega (estudiante_id, estado);

-- -----------------------------------------------------------------------------
-- F.11 Archivos adjuntos de la entrega
-- -----------------------------------------------------------------------------
create table if not exists public.entrega_archivo (
    id                uuid primary key default gen_random_uuid(),
    entrega_id        uuid        not null references public.entrega (id) on delete cascade,
    nombre            text        not null,
    ruta_storage      text        not null,
    mime_type         text,
    tamano_bytes      bigint check (tamano_bytes is null or tamano_bytes >= 0),
    creado_en         timestamptz not null default now()
);

create index if not exists idx_entrega_archivo_entrega
    on public.entrega_archivo (entrega_id);

-- -----------------------------------------------------------------------------
-- F.12 Calificaciones (tabla separada: el estudiante NO puede escribirla)
-- -----------------------------------------------------------------------------
create table if not exists public.calificacion (
    id                uuid primary key default gen_random_uuid(),
    entrega_id        uuid references public.entrega (id) on delete cascade,
    intento_id        uuid references public.intento_evaluacion (id) on delete cascade,
    estudiante_id     uuid        not null references public.perfil (id) on delete cascade,
    docente_id        uuid references public.perfil (id) on delete set null,
    nota              numeric(8, 2) not null default 0 check (nota >= 0),
    nota_maxima       numeric(8, 2) not null default 100 check (nota_maxima >= 0),
    aprobado          boolean,
    comentario        text,
    calificado_en     timestamptz not null default now(),
    actualizado_en    timestamptz not null default now(),
    -- La calificacion corresponde a una entrega o a un intento, no a ambos.
    check (num_nonnulls(entrega_id, intento_id) = 1)
);

create index if not exists idx_calificacion_estudiante
    on public.calificacion (estudiante_id, calificado_en desc);
create index if not exists idx_calificacion_entrega
    on public.calificacion (entrega_id);

-- -----------------------------------------------------------------------------
-- F.13 Retroalimentacion del docente
-- -----------------------------------------------------------------------------
create table if not exists public.retroalimentacion (
    id                uuid primary key default gen_random_uuid(),
    calificacion_id   uuid references public.calificacion (id) on delete cascade,
    intento_id        uuid references public.intento_evaluacion (id) on delete cascade,
    entrega_id        uuid references public.entrega (id) on delete cascade,
    autor_id          uuid references public.perfil (id) on delete set null,
    mensaje           text        not null,
    visible_estudiante boolean    not null default true,
    creado_en         timestamptz not null default now()
);

create index if not exists idx_retroalimentacion_calificacion
    on public.retroalimentacion (calificacion_id);


-- =============================================================================
-- TRIGGERS DE MANTENIMIENTO
-- =============================================================================
do $$
declare
    t text;
begin
    foreach t in array array[
        'progreso_curso', 'progreso_unidad', 'progreso_leccion',
        'actividad', 'tarea', 'evaluacion', 'examen', 'pregunta',
        'intento_evaluacion', 'respuesta_evaluacion', 'entrega',
        'calificacion'
    ] loop
        execute format('drop trigger if exists trg_actualizar_timestamp on public.%I', t);
        execute format(
            'create trigger trg_actualizar_timestamp '
            'before update on public.%I '
            'for each row execute function public.fn_actualizar_timestamp()', t);
    end loop;
end $$;


-- =============================================================================
-- RECALCULO CONSISTENTE DE PROGRESO
-- Al completar una leccion se recalculan los contadores del curso y de la
-- unidad, y se registra el XP correspondiente, de forma transaccional.
-- =============================================================================
create or replace function public.fn_registrar_completado_leccion(
    p_estudiante_id uuid,
    p_curso_id      uuid,
    p_leccion_id    uuid,
    p_minutos       integer default 0
)
returns numeric
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_matricula        public.matricula%rowtype;
    v_progreso_curso   uuid;
    v_total            integer;
    v_completadas      integer;
    v_porcentaje       numeric(5, 2);
    v_xp               integer;
    v_nivel            integer;
    v_umbral           integer;
begin
    -- Localizar matricula activa
    select * into v_matricula
      from public.matricula
     where estudiante_id = p_estudiante_id
       and curso_id = p_curso_id
       and estado in ('activa', 'completada');

    if not found then
        raise exception 'El usuario no tiene matricula activa en el curso %', p_curso_id;
    end if;

    -- Localizar o crear el progreso del curso
    select id into v_progreso_curso
      from public.progreso_curso
     where matricula_id = v_matricula.id;

    if v_progreso_curso is null then
        insert into public.progreso_curso (
            matricula_id, estudiante_id, curso_id, estado, iniciado_en
        ) values (
            v_matricula.id, p_estudiante_id, p_curso_id, 'en_progreso', now()
        )
        returning id into v_progreso_curso;
    end if;

    -- Marcar la leccion como completada (idempotente).
    -- Si la fila ya existe pero esta completada, no se vuelve a sumar tiempo
    -- ni a otorgar XP: por eso el UPDATE filtra por el estado previo.
    update public.progreso_leccion
       set estado = 'completado',
           porcentaje = 100,
           completado_en = now(),
           minutos_estudio = minutos_estudio + greatest(coalesce(p_minutos, 0), 0)
     where progreso_curso_id = v_progreso_curso
       and leccion_id = p_leccion_id
       and estado is distinct from 'completado';

    if not found then
        -- Puede no existir la fila, o existir ya completada (idempotencia).
        insert into public.progreso_leccion (
            progreso_curso_id, leccion_id, estudiante_id, estado,
            porcentaje, minutos_estudio, iniciado_en, completado_en
        ) values (
            v_progreso_curso, p_leccion_id, p_estudiante_id, 'completado',
            100, greatest(coalesce(p_minutos, 0), 0), now(), now()
        )
        on conflict (progreso_curso_id, leccion_id) do update
            set estado = 'completado',
                porcentaje = 100,
                completado_en = coalesce(public.progreso_leccion.completado_en, now()),
                minutos_estudio = public.progreso_leccion.minutos_estudio;
    end if;

    -- XP de la leccion (una sola vez: se verifica que no exista ya una
    -- transaccion de XP por esa leccion).
    select coalesce(l.xp_otorgado, 0) into v_xp
      from public.leccion l
     where l.id = p_leccion_id;

    if v_xp > 0
       and not exists (
           select 1 from public.transaccion_xp tx
            where tx.usuario_id = p_estudiante_id
              and tx.concepto = 'leccion_completada'
              and tx.referencia_tipo = 'leccion'
              and tx.referencia_id = p_leccion_id
       ) then
        perform public.fn_registrar_xp(
            p_estudiante_id, v_xp, 'leccion_completada',
            'leccion', p_leccion_id
        );
    end if;

    -- Recalcular porcentaje del curso
    select count(*) into v_total
      from public.leccion l
      join public.modulo m on m.id = l.modulo_id
      join public.unidad u on u.id = m.unidad_id
     where u.curso_id = p_curso_id;

    select count(*) into v_completadas
      from public.progreso_leccion pl
     where pl.progreso_curso_id = v_progreso_curso
       and pl.estado = 'completado';

    v_porcentaje := case
        when coalesce(v_total, 0) = 0 then 0
        else round((v_completadas::numeric / v_total) * 100, 2)
    end;

    update public.progreso_curso
       set porcentaje = v_porcentaje,
           lecciones_completadas = v_completadas,
           minutos_estudio = minutos_estudio + greatest(coalesce(p_minutos, 0), 0),
           estado = case when v_porcentaje >= 100 then 'completado'::public.estado_progreso
                         when v_porcentaje > 0 then 'en_progreso'::public.estado_progreso
                         else estado end,
           iniciado_en = coalesce(iniciado_en, now()),
           completado_en = case when v_porcentaje >= 100 then now() else completado_en end,
           ultima_actividad_en = now()
     where id = v_progreso_curso;

    -- Reflejar el progreso tambien en la matricula
    update public.matricula
       set porcentaje_progreso = v_porcentaje,
           estado = case when v_porcentaje >= 100 then 'completada'::public.estado_matricula
                         else estado end,
           completado_en = case when v_porcentaje >= 100 then now() else completado_en end
     where id = v_matricula.id;

    -- Historial
    insert into public.historial_progreso (
        progreso_curso_id, estudiante_id, tipo, valor_anterior,
        valor_nuevo, duracion_minutos, datos
    ) values (
        v_progreso_curso, p_estudiante_id, 'leccion_completada',
        null, v_porcentaje, greatest(coalesce(p_minutos, 0), 0),
        jsonb_build_object('leccion_id', p_leccion_id, 'xp', v_xp)
    );

    return v_porcentaje;
end;
$$;

comment on function public.fn_registrar_completado_leccion(uuid, uuid, uuid, integer) is
    'Registra la leccion como completada, recalcula el progreso del curso y otorga XP de forma transaccional e idempotente.';


-- =============================================================================
-- FIN DE LA MIGRACION 0004
-- =============================================================================
