-- =============================================================================
-- MIGRACION 0005 - Modulo G: Retos de programacion
--                 Modulo H: Motores de minijuegos
-- -----------------------------------------------------------------------------
-- Depende de: 0001 (tipos), 0002 (perfil, curso, leccion)
--
-- ARQUITECTURA DE MINIJUEGOS
-- Se separan CONCEPTOS que suelen confundirse:
--
--   motor      -> el motor/framework que ejecuta el juego (versionado).
--   version    -> una version concreta de ese motor.
--   motor_curso-> asociacion del motor con un curso (puede ser comun o propio).
--   juego      -> un juego concreto disponible en un motor.
--   configuracion -> parametros que definen como se juega (datos, no codigo).
--   actividad_juego -> el juego instalado dentro de una leccion.
--   intento_juego    -> una partida empezada por un usuario.
--   respuesta_juego  -> lo que el usuario contesta dentro del intento.
--   resultado_juego  -> el veredicto de esa partida (puntaje, Precision, tiempo).
--   recompensa_juego -> lo que el intento otorga al usuario.
--
-- La tabla 'motor' no tiene campos especificos de juego: agregar un motor
-- nuevo NO requiere alterar el modelo, solo registrar su codigo y sus
-- versiones. Esa es la base de la extensibilidad.
--
-- SEGURIDAD
--   La ejecucion del codigo de los retos NO ocurre en PostgreSQL: se delega a
--   un entorno aislado externo. Aqui solo se registran envios y resultados.
-- =============================================================================


-- =============================================================================
-- MODULO G - RETOS DE PROGRAMACION
-- =============================================================================

create table if not exists public.reto (
    id                uuid primary key default gen_random_uuid(),
    leccion_id        uuid        not null references public.leccion (id) on delete cascade,
    curso_id          uuid        not null references public.curso (id) on delete cascade,
    titulo            text        not null,
    enunciado         text        not null,
    descripcion       text,
    dificultad        public.nivel_dificultad not null default 'facil',
    tiempo_limite_seg integer     check (tiempo_limite_seg is null or tiempo_limite_seg > 0),
    memoria_limite_mb integer     check (memoria_limite_mb is null or memoria_limite_mb > 0),
    xp_otorgado       integer     not null default 0 check (xp_otorgado >= 0),
    intentos_maximos  integer     not null default 0 check (intentos_maximos >= 0),
    published         boolean     not null default false,
    creado_por        uuid references public.perfil (id) on delete set null,
    creado_en         timestamptz not null default now(),
    actualizado_en    timestamptz not null default now()
);

create index if not exists idx_reto_leccion
    on public.reto (leccion_id);
create index if not exists idx_reto_curso
    on public.reto (curso_id, published);

-- Lenguajes disponibles para enviar soluciones.
create table if not exists public.lenguaje (
    id            uuid primary key default gen_random_uuid(),
    codigo        text        not null unique,
    nombre        text        not null,
    version       text,
    plantilla     text,
    activo        boolean     not null default true,
    creado_en     timestamptz not null default now()
);

-- Casos de prueba (ocultos: no visibles antes de enviar).
create table if not exists public.caso_prueba (
    id                uuid primary key default gen_random_uuid(),
    reto_id           uuid        not null references public.reto (id) on delete cascade,
    orden             integer     not null check (orden > 0),
    entrada           text        not null,
    salida_esperada   text        not null,
    es_oculto          boolean     not null default true,
    es_ejemplo         boolean     not null default false,
    tiempo_limite_seg integer     check (tiempo_limite_seg is null or tiempo_limite_seg > 0),
    memoria_limite_mb integer,
    peso              numeric(5, 2) not null default 1 check (peso between 0 and 100),
    creado_en         timestamptz not null default now(),
    unique (reto_id, orden)
);

-- Restricciones adicionales del reto (texto libre interpretable por el
-- ejecutor externo: limites,.regex, etc.).
create table if not exists public.restriccion_reto (
    id            uuid primary key default gen_random_uuid(),
    reto_id       uuid        not null references public.reto (id) on delete cascade,
    tipo          text        not null,
    valor         text        not null,
    descripcion   text,
    creado_en     timestamptz not null default now(),
    unique (reto_id, tipo)
);

-- Envio de una solucion.
create table if not exists public.envio_reto (
    id                uuid primary key default gen_random_uuid(),
    reto_id           uuid        not null references public.reto (id) on delete cascade,
    estudiante_id     uuid        not null references public.perfil (id) on delete cascade,
    lenguaje_id       uuid        not null references public.lenguaje (id) on delete restrict,
    codigo            text        not null,
    estado            public.estado_envio not null default 'pendiente',
    puntaje           numeric(8, 2) not null default 0 check (puntaje >= 0),
    puntaje_maximo    numeric(8, 2) not null default 0 check (puntaje_maximo >= 0),
    aprobado          boolean,
    tiempo_total_ms   integer     check (tiempo_total_ms is null or tiempo_total_ms >= 0),
    --
    -- Clave de idempotencia del ejecutor: reintentar no duplica el envio.
    clave_idempotencia text       unique,
    error_mensaje     text,
    --
    -- Referencia al job de ejecucion en el servicio aislado externo.
    ejecucion_externa_id text,
    creado_en         timestamptz not null default now(),
    actualizado_en    timestamptz not null default now()
);

create index if not exists idx_envio_reto_reto
    on public.envio_reto (reto_id, creado_en desc);
create index if not exists idx_envio_reto_estudiante
    on public.envio_reto (estudiante_id, creado_en desc);

-- Resultado por caso de prueba.
create table if not exists public.resultado_caso (
    id                uuid primary key default gen_random_uuid(),
    envio_id          uuid        not null references public.envio_reto (id) on delete cascade,
    caso_prueba_id    uuid        not null references public.caso_prueba (id) on delete cascade,
    estado            public.estado_ejecucion not null default 'ok',
    salida_obtenida   text,
    tiempo_ms         integer     check (tiempo_ms is null or tiempo_ms >= 0),
    memoria_usada_mb  integer     check (memoria_usada_mb is null or memoria_usada_mb >= 0),
    puntaje           numeric(8, 2) not null default 0 check (puntaje >= 0),
    mensaje_error     text,
    creado_en         timestamptz not null default now(),
    unique (envio_id, caso_prueba_id)
);

create index if not exists idx_resultado_caso_envio
    on public.resultado_caso (envio_id);

-- Historial de ejecucion (eventos del proceso aislado).
create table if not exists public.historial_ejecucion (
    id            uuid primary key default gen_random_uuid(),
    envio_id      uuid        not null references public.envio_reto (id) on delete cascade,
    evento        text        not null,
    detalle       jsonb       not null default '{}'::jsonb,
    creado_en     timestamptz not null default now()
);

create index if not exists idx_historial_ejecucion_envio
    on public.historial_ejecucion (envio_id, creado_en);


-- =============================================================================
-- MODULO H - MOTORES DE MINIJUEGOS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- H.1 Motor: el motor de juego (agnostico de la tematica).
--     Sin columnas de tipo de juego: la extension se logra con 'configuracion'.
-- -----------------------------------------------------------------------------
create table if not exists public.motor (
    id            uuid primary key default gen_random_uuid(),
    codigo        text        not null unique,
    nombre        text        not null,
    descripcion   text,
    version_actual text,
    estado        public.estado_motor not null default 'activo',
    es_comun      boolean     not null default false,
    --
    -- Tipo de motor: permite agrupar (puzle, action, quiz, etc.) sin
    -- necesitar una tabla por familia.
    familia       text,
    icono         text,
    documentacion text,
    activo        boolean     not null default true,
    creado_en     timestamptz not null default now(),
    actualizado_en timestamptz not null default now()
);

create index if not exists idx_motor_comun
    on public.motor (es_comun, estado);

-- -----------------------------------------------------------------------------
-- H.2 Versiones del motor
-- -----------------------------------------------------------------------------
create table if not exists public.version_motor (
    id            uuid primary key default gen_random_uuid(),
    motor_id      uuid        not null references public.motor (id) on delete cascade,
    version       text        not null,
    notas         text,
    compatibilidad jsonb      not null default '{}'::jsonb,
    publicada_en  timestamptz,
    activa        boolean     not null default false,
    creado_en     timestamptz not null default now(),
    unique (motor_id, version)
);

create index if not exists idx_version_motor_activa
    on public.version_motor (motor_id, activa);

-- -----------------------------------------------------------------------------
-- H.3 Motores comunes: disponibles para cualquier curso.
--     Tabla separada (no solo un flag) porque un motor comun puede tener
--     reglas de asignacion propias y listeners de actualizacion.
-- -----------------------------------------------------------------------------
create table if not exists public.motor_comun (
    id            uuid primary key default gen_random_uuid(),
    motor_id      uuid        not null references public.motor (id) on delete cascade,
    descripcion   text,
    --
    -- Si es true, el motor se ofrece automaticamente a todos los cursos.
    automatico    boolean     not null default true,
    --
    -- Al activar el motor se crea la actividad en las lecciones indicadas.
    instalar_en_todas boolean not null default false,
    activo        boolean     not null default true,
    creado_en     timestamptz not null default now(),
    actualizado_en timestamptz not null default now(),
    unique (motor_id)
);

-- -----------------------------------------------------------------------------
-- H.4 Motores asociados a cursos (comunes o especificos)
-- -----------------------------------------------------------------------------
create table if not exists public.motor_curso (
    id            uuid primary key default gen_random_uuid(),
    motor_id      uuid        not null references public.motor (id) on delete cascade,
    curso_id      uuid        not null references public.curso (id) on delete cascade,
    --
    -- false = motor especifico del curso; true = disponible para todos.
    es_comun      boolean     not null default false,
    --
    -- Version concreta que usa el curso.
    version_motor_id uuid references public.version_motor (id) on delete set null,
    activo        boolean     not null default true,
    asignado_por  uuid references public.perfil (id) on delete set null,
    asignado_en   timestamptz not null default now(),
    actualizado_en timestamptz not null default now(),
    unique (motor_id, curso_id)
);

create index if not exists idx_motor_curso_curso
    on public.motor_curso (curso_id, activo);

-- -----------------------------------------------------------------------------
-- H.5 Juegos concretos dentro de un motor
-- -----------------------------------------------------------------------------
create table if not exists public.juego (
    id                uuid primary key default gen_random_uuid(),
    motor_id          uuid        not null references public.motor (id) on delete cascade,
    version_motor_id  uuid references public.version_motor (id) on delete set null,
    codigo            text        not null unique,
    nombre            text        not null,
    descripcion       text,
    estado            public.estado_juego not null default 'borrador',
    version_juego     text        not null default '1.0.0',
    dificultad        public.nivel_dificultad not null default 'facil',
    xp_otorgado       integer     not null default 0 check (xp_otorgado >= 0),
    monedas_otorgadas integer     not null default 0 check (monedas_otorgadas >= 0),
    tiempo_limite_seg integer     check (tiempo_limite_seg is null or tiempo_limite_seg > 0),
    creado_por        uuid references public.perfil (id) on delete set null,
    publicado_en      timestamptz,
    creado_en         timestamptz not null default now(),
    actualizado_en    timestamptz not null default now()
);

create index if not exists idx_juego_motor
    on public.juego (motor_id, estado);

-- -----------------------------------------------------------------------------
-- H.6 Configuracion del juego (datos, no codigo)
--     Permite que un mismo motor sirva a cientos de juegos distintos.
-- -----------------------------------------------------------------------------
create table if not exists public.configuracion_juego (
    id            uuid primary key default gen_random_uuid(),
    juego_id      uuid        not null references public.juego (id) on delete cascade,
    clave         text        not null,
    valor         jsonb       not null default '{}'::jsonb,
    descripcion   text,
    creado_en     timestamptz not null default now(),
    actualizado_en timestamptz not null default now(),
    unique (juego_id, clave)
);

-- -----------------------------------------------------------------------------
-- H.7 Actividad de juego dentro de una leccion
-- -----------------------------------------------------------------------------
create table if not exists public.actividad_juego (
    id                uuid primary key default gen_random_uuid(),
    juego_id          uuid        not null references public.juego (id) on delete cascade,
    leccion_id        uuid        not null references public.leccion (id) on delete cascade,
    curso_id          uuid        not null references public.curso (id) on delete cascade,
    --
    -- Vincula con la actividad del modulo F si se creo desde alli.
    actividad_id      uuid references public.actividad (id) on delete set null,
    titulo            text        not null,
    descripcion       text,
    orden             integer     not null default 0,
    puntos            numeric(8, 2) not null default 0 check (puntos >= 0),
    xp_otorgado       integer     not null default 0 check (xp_otorgado >= 0),
    intentos_permitidos integer   not null default 0 check (intentos_permitidos >= 0),
    publicado         boolean     not null default false,
    creado_en         timestamptz not null default now(),
    actualizado_en    timestamptz not null default now(),
    unique (juego_id, leccion_id)
);

create index if not exists idx_actividad_juego_leccion
    on public.actividad_juego (leccion_id, orden);

-- -----------------------------------------------------------------------------
-- H.8 Intentos (partidas)
-- -----------------------------------------------------------------------------
create table if not exists public.intento_juego (
    id                uuid primary key default gen_random_uuid(),
    actividad_juego_id uuid       not null references public.actividad_juego (id) on delete cascade,
    estudiante_id     uuid        not null references public.perfil (id) on delete cascade,
    numero            integer     not null check (numero > 0),
    estado            public.estado_intento_juego not null default 'iniciado',
    --
    -- Clave de idempotencia: evita partidas duplicadas por reintento.
    clave_idempotencia text       not null unique,
    duracion_ms       integer     check (duracion_ms is null or duracion_ms >= 0),
    iniciado_en       timestamptz not null default now(),
    finalizado_en     timestamptz,
    creado_en         timestamptz not null default now(),
    actualizado_en    timestamptz not null default now(),
    unique (actividad_juego_id, estudiante_id, numero)
);

create index if not exists idx_intento_juego_estudiante
    on public.intento_juego (estudiante_id, estado);
create index if not exists idx_intento_juego_actividad
    on public.intento_juego (actividad_juego_id, estado);

-- -----------------------------------------------------------------------------
-- H.9 Respuestas del usuario dentro de la partida
-- -----------------------------------------------------------------------------
create table if not exists public.respuesta_juego (
    id                uuid primary key default gen_random_uuid(),
    intento_juego_id  uuid        not null references public.intento_juego (id) on delete cascade,
    pregunta_clave    text        not null,
    valor             jsonb       not null default '{}'::jsonb,
    es_correcta       boolean,
    puntaje           numeric(8, 2) not null default 0 check (puntaje >= 0),
    tiempo_ms         integer     check (tiempo_ms is null or tiempo_ms >= 0),
    creado_en         timestamptz not null default now(),
    unique (intento_juego_id, pregunta_clave)
);

-- -----------------------------------------------------------------------------
-- H.10 Resultado de la partida
-- -----------------------------------------------------------------------------
create table if not exists public.resultado_juego (
    id                uuid primary key default gen_random_uuid(),
    intento_juego_id  uuid        not null unique references public.intento_juego (id) on delete cascade,
    puntaje           numeric(10, 2) not null default 0 check (puntaje >= 0),
    puntaje_maximo    numeric(10, 2) not null default 0 check (puntaje_maximo >= 0),
    --
    -- Precision en porcentaje (0-100)
    precision         numeric(5, 2) check (precision is null or precision between 0 and 100),
    --
    -- Completitud (0-100): cuanto del juego se recorrio.
    completitud       numeric(5, 2) check (completitud is null or completitud between 0 and 100),
    --
    -- Aciertos y errores
    aciertos          integer     not null default 0 check (aciertos >= 0),
    errores           integer     not null default 0 check (errores >= 0),
    --
    -- Estrellas / nivel alcanzado (1-3 segun el diseno del juego)
    estrellas         integer     check (estrellas is null or estrellas between 0 and 3),
    completado       boolean     not null default false,
    --
    -- Desglose por dimension (rondas, combinaciones, etc.)
    desglose          jsonb       not null default '{}'::jsonb,
    creado_en         timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- H.11 Puntuacion (tabla de mando / tabla de liderazgo)
-- -----------------------------------------------------------------------------
create table if not exists public.puntuacion_juego (
    id                uuid primary key default gen_random_uuid(),
    juego_id          uuid        not null references public.juego (id) on delete cascade,
    usuario_id        uuid        not null references public.perfil (id) on delete cascade,
    mejor_puntaje     numeric(10, 2) not null default 0 check (mejor_puntaje >= 0),
    partidas          integer     not null default 0 check (partidas >= 0),
    victorias         integer     not null default 0 check (victorias >= 0),
    mejor_tiempo_ms   integer     check (mejor_tiempo_ms is null or mejor_tiempo_ms >= 0),
    actualizado_en    timestamptz not null default now(),
    unique (juego_id, usuario_id)
);

create index if not exists idx_puntuacion_juego_ranking
    on public.puntuacion_juego (juego_id, mejor_puntaje desc);

-- -----------------------------------------------------------------------------
-- H.12 Tiempos (registro detallado por hito)
-- -----------------------------------------------------------------------------
create table if not exists public.tiempo_juego (
    id                uuid primary key default gen_random_uuid(),
    intento_juego_id  uuid        not null references public.intento_juego (id) on delete cascade,
    hito              text        not null,
    tiempo_ms         integer     not null check (tiempo_ms >= 0),
    datos             jsonb       not null default '{}'::jsonb,
    creado_en         timestamptz not null default now()
);

create index if not exists idx_tiempo_juego_intento
    on public.tiempo_juego (intento_juego_id, tiempo_ms);

-- -----------------------------------------------------------------------------
-- H.13 Finalizacion (resumen del cierre de partida)
-- -----------------------------------------------------------------------------
create table if not exists public.finalizacion_juego (
    id                uuid primary key default gen_random_uuid(),
    intento_juego_id  uuid        not null unique references public.intento_juego (id) on delete cascade,
    usuario_id        uuid        not null references public.perfil (id) on delete cascade,
    duracion_total_ms integer     not null default 0 check (duracion_total_ms >= 0),
    tiempo_activo_ms  integer     not null default 0 check (tiempo_activo_ms >= 0),
    --
    -- Numero de pausas: detecta tiempos muertos.
    pausas             integer     not null default 0 check (pausas >= 0),
    motivo_fin         text        not null default 'completado',
    finalized_en       timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- H.14 Recompensas otorgadas por un intento
--     Idempotente mediante clave unica por intento y tipo de recompensa.
-- -----------------------------------------------------------------------------
create table if not exists public.recompensa_juego (
    id                uuid primary key default gen_random_uuid(),
    intento_juego_id  uuid        not null references public.intento_juego (id) on delete cascade,
    usuario_id        uuid        not null references public.perfil (id) on delete cascade,
    tipo              public.tipo_recompensa not null default 'xp',
    cantidad          integer     not null default 0 check (cantidad >= 0),
    --
    -- Clave de idempotencia: un mismo intento no otorga dos veces lo mismo.
    clave_idempotencia text       not null unique,
    -- Recurso opcional (insignia, item de tienda, etc.)
    recurso_id        uuid,
    creado_en         timestamptz not null default now()
);

create index if not exists idx_recompensa_juego_usuario
    on public.recompensa_juego (usuario_id, creado_en desc);


-- =============================================================================
-- TRIGGERS DE MANTENIMIENTO
-- =============================================================================
do $$
declare
    t text;
begin
    foreach t in array array[
        'reto', 'envio_reto', 'motor', 'version_motor', 'motor_comun',
        'motor_curso', 'juego', 'configuracion_juego', 'actividad_juego',
        'intento_juego', 'respuesta_juego'
    ] loop
        execute format('drop trigger if exists trg_actualizar_timestamp on public.%I', t);
        execute format(
            'create trigger trg_actualizar_timestamp '
            'before update on public.%I '
            'for each row execute function public.fn_actualizar_timestamp()', t);
    end loop;
end $$;


-- =============================================================================
-- FUNCIONES DE MINIJUEGOS
-- =============================================================================

-- Registra el resultado de una partida y actualiza la puntuacion del juego.
-- Idempotente por intento.
create or replace function public.fn_registrar_resultado_juego(
    p_intento_juego_id uuid,
    p_puntaje          numeric,
    p_puntaje_maximo   numeric,
    p_precision        numeric default null,
    p_completitud      numeric default null,
    p_aciertos         integer default 0,
    p_errores          integer default 0,
    p_estrellas        integer default null,
    p_completado       boolean default false,
    p_desglose         jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_intento   public.intento_juego%rowtype;
    v_actividad public.actividad_juego%rowtype;
    v_juego     uuid;
    v_puntuacion numeric;
begin
    select * into v_intento
      from public.intento_juego
     where id = p_intento_juego_id;

    if not found then
        raise exception 'Intento de juego % no encontrado', p_intento_juego_id;
    end if;

    select * into v_actividad
      from public.actividad_juego
     where id = v_intento.actividad_juego_id;

    v_juego := v_actividad.juego_id;

    -- Resultado (idempotente: si ya existe, se actualiza)
    insert into public.resultado_juego (
        intento_juego_id, puntaje, puntaje_maximo, precision, completitud,
        aciertos, errores, estrellas, completado, desglose
    ) values (
        p_intento_juego_id, coalesce(p_puntaje, 0), coalesce(p_puntaje_maximo, 0),
        p_precision, p_completitud, coalesce(p_aciertos, 0), coalesce(p_errores, 0),
        p_estrellas, coalesce(p_completado, false), coalesce(p_desglose, '{}'::jsonb)
    )
    on conflict (intento_juego_id) do update
        set puntaje = excluded.puntaje,
            puntaje_maximo = excluded.puntaje_maximo,
            precision = excluded.precision,
            completitud = excluded.completitud,
            aciertos = excluded.aciertos,
            errores = excluded.errores,
            estrellas = excluded.estrellas,
            completado = excluded.completado,
            desglose = excluded.desglose;

    -- Estado del intento
    update public.intento_juego
       set estado = case when coalesce(p_completado, false)
                         then 'completado'::public.estado_intento_juego
                         else 'fallido'::public.estado_intento_juego end,
           finalizado_en = now()
     where id = p_intento_juego_id;

    -- Puntuacion acumulada del usuario en el juego
    insert into public.puntuacion_juego (
        juego_id, usuario_id, mejor_puntaje, partidas, victorias,
        mejor_tiempo_ms, actualizado_en
    ) values (
        v_juego, v_intento.estudiante_id, coalesce(p_puntaje, 0), 1,
        case when coalesce(p_completado, false) then 1 else 0 end,
        v_intento.duracion_ms, now()
    )
    on conflict (juego_id, usuario_id) do update
        set mejor_puntaje = greatest(public.puntuacion_juego.mejor_puntaje, excluded.mejor_puntaje),
            partidas = public.puntuacion_juego.partidas + 1,
            victorias = public.puntuacion_juego.victorias + excluded.victorias,
            mejor_tiempo_ms = case
                when public.puntuacion_juego.mejor_tiempo_ms is null then excluded.mejor_tiempo_ms
                when excluded.mejor_tiempo_ms is null then public.puntuacion_juego.mejor_tiempo_ms
                else least(public.puntuacion_juego.mejor_tiempo_ms, excluded.mejor_tiempo_ms)
            end,
            actualizado_en = now();

    -- Recompensa por completar (idempotente)
    if coalesce(p_completado, false) and coalesce(v_actividad.xp_otorgado, 0) > 0 then
        insert into public.recompensa_juego (
            intento_juego_id, usuario_id, tipo, cantidad, clave_idempotencia
        ) values (
            p_intento_juego_id, v_intento.estudiante_id, 'xp',
            v_actividad.xp_otorgado,
            'juego:' || p_intento_juego_id::text || ':xp'
        )
        on conflict (clave_idempotencia) do nothing;

        perform public.fn_registrar_xp(
            v_intento.estudiante_id, v_actividad.xp_otorgado,
            'minijuego_terminado', 'actividad_juego', v_intento.actividad_juego_id
        );
    end if;

    select mejor_puntaje into v_puntuacion
      from public.puntuacion_juego
     where juego_id = v_juego and usuario_id = v_intento.estudiante_id;

    return jsonb_build_object(
        'puntaje', coalesce(p_puntaje, 0),
        'mejor_puntaje', coalesce(v_puntuacion, 0),
        'completado', coalesce(p_completado, false)
    );
end;
$$;


-- =============================================================================
-- FIN DE LA MIGRACION 0005
-- =============================================================================
