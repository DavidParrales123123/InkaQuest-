-- =============================================================================
-- MIGRACION 0002 - Modulo A: Identidad, roles y seguridad
--                 Modulo B: Gestion academica
-- -----------------------------------------------------------------------------
-- Depende de: 0001 (tipos y funciones base)
-- -----------------------------------------------------------------------------

-- =============================================================================
-- MODULO A - USUARIOS Y SEGURIDAD
-- =============================================================================

-- -----------------------------------------------------------------------------
-- A.1 Perfil del usuario (extiende auth.users de Supabase Auth)
--     NO se duplican contrasenas: la autenticacion vive exclusivamente en
--     auth.users. Aqui solo se guarda el perfil de aplicacion.
-- -----------------------------------------------------------------------------
create table if not exists public.perfil (
    id              uuid primary key references auth.users (id) on delete cascade,
    email           text        not null unique,
    nombre          text        not null,
    apellido        text,
    documento       text unique,
    genero          text,
    fecha_nacimiento date,
    telefono        text,
    avatar_url      text,
    bio             text,
    rol             public.rol_usuario not null default 'estudiante',
    estado_cuenta   public.estado_cuenta not null default 'pendiente_verificacion',
    xp              integer     not null default 0 check (xp >= 0),
    nivel           integer     not null default 1 check (nivel >= 1),
    racha_dias      integer     not null default 0 check (racha_dias >= 0),
    ultima_conexion timestamptz,
    creado_en       timestamptz not null default now(),
    actualizado_en  timestamptz not null default now()
);

comment on table public.perfil is
    'Perfil de aplicacion. El id referencia auth.users; no se almacenan contrasenas.';

-- -----------------------------------------------------------------------------
-- A.2 Solicitud de rol docente
--     El registro publico SIEMPRE crea estudiantes. Para ser docente el
--     usuario debe solicitarlo y un administrador debe aprobarlo.
-- -----------------------------------------------------------------------------
create table if not exists public.solicitud_docente (
    id              uuid primary key default gen_random_uuid(),
    usuario_id      uuid        not null references public.perfil (id) on delete cascade,
    estado          public.estado_solicitud_docente not null default 'pendiente',
    institucion     text,
    especialidad    text,
    codigo_docente  text,
    motivo          text        not null,
    documentos_adjuntos jsonb   not null default '[]'::jsonb,
    revisado_por    uuid references public.perfil (id) on delete set null,
    revisado_en     timestamptz,
    motivo_revision text,
    creado_en       timestamptz not null default now(),
    actualizado_en  timestamptz not null default now()
);

create index if not exists idx_solicitud_docente_usuario
    on public.solicitud_docente (usuario_id, estado);
create index if not exists idx_solicitud_docente_estado
    on public.solicitud_docente (estado, creado_en desc);

-- -----------------------------------------------------------------------------
-- A.3 Historial de cambios de rol (auditoria de aprobaciones)
-- -----------------------------------------------------------------------------
create table if not exists public.aprobacion_docente (
    id                uuid primary key default gen_random_uuid(),
    solicitud_id      uuid not null references public.solicitud_docente (id) on delete cascade,
    usuario_id        uuid not null references public.perfil (id) on delete cascade,
    decision          public.estado_solicitud_docente not null,
    decidido_por      uuid references public.perfil (id) on delete set null,
    motivo            text,
    creado_en         timestamptz not null default now()
);

create index if not exists idx_aprobacion_docente_solicitud
    on public.aprobacion_docente (solicitud_id, creado_en desc);

-- -----------------------------------------------------------------------------
-- A.4 Permisos granulares (para autorizacion por rol mas adelante)
--     El rol se almacena como texto con CHECK: un ENUM no admite clave
--     foranea, por lo que no puede referenciarse desde rol_permiso.
-- -----------------------------------------------------------------------------
create table if not exists public.permiso (
    id          uuid primary key default gen_random_uuid(),
    codigo      text        not null unique,
    nombre      text        not null,
    descripcion text,
    modulo      text        not null,
    creado_en   timestamptz not null default now()
);

create table if not exists public.rol_permiso (
    rol        text        not null check (rol in ('estudiante', 'docente', 'administrador')),
    permiso_id uuid        not null references public.permiso (id) on delete cascade,
    primary key (rol, permiso_id)
);

create index if not exists idx_rol_permiso_permiso
    on public.rol_permiso (permiso_id);

-- -----------------------------------------------------------------------------
-- A.5 Preferencias del usuario
-- -----------------------------------------------------------------------------
create table if not exists public.preferencia_usuario (
    id          uuid primary key default gen_random_uuid(),
    usuario_id  uuid        not null references public.perfil (id) on delete cascade,
    clave       text        not null,
    valor       jsonb       not null default '{}'::jsonb,
    creado_en   timestamptz not null default now(),
    actualizado_en timestamptz not null default now(),
    unique (usuario_id, clave)
);

-- -----------------------------------------------------------------------------
-- A.6 Registro de accesos (auditoria de autenticacion)
-- -----------------------------------------------------------------------------
create table if not exists public.auditoria_acceso (
    id          uuid primary key default gen_random_uuid(),
    usuario_id  uuid references public.perfil (id) on delete set null,
    email       text,
    evento      text        not null,
    exito       boolean     not null default true,
    ip          inet,
    agente_usuario text,
    metadatos   jsonb       not null default '{}'::jsonb,
    creado_en   timestamptz not null default now()
);

create index if not exists idx_auditoria_acceso_usuario
    on public.auditoria_acceso (usuario_id, creado_en desc);
create index if not exists idx_auditoria_acceso_evento
    on public.auditoria_acceso (evento, creado_en desc);


-- =============================================================================
-- MODULO B - GESTION ACADEMICA
-- =============================================================================

-- -----------------------------------------------------------------------------
-- B.1 Categorias
-- -----------------------------------------------------------------------------
create table if not exists public.categoria (
    id          uuid primary key default gen_random_uuid(),
    nombre      text        not null unique,
    slug        text        not null unique,
    descripcion text,
    icono       text,
    orden       integer     not null default 0,
    activo      boolean     not null default true,
    creado_en   timestamptz not null default now(),
    actualizado_en timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- B.2 Cursos
-- -----------------------------------------------------------------------------
create table if not exists public.curso (
    id            uuid primary key default gen_random_uuid(),
    categoria_id  uuid references public.categoria (id) on delete set null,
    titulo        text        not null,
    slug          text        not null unique,
    descripcion   text,
    contenido     text,
    portada_url   text,
    estado        public.estado_curso not null default 'borrador',
    precio        numeric(10, 2) not null default 0 check (precio >= 0),
    moneda        text        not null default 'PEN',
    xp_total      integer     not null default 0 check (xp_total >= 0),
    duracion_minutos integer  not null default 0 check (duracion_minutos >= 0),
    creado_por    uuid references public.perfil (id) on delete set null,
    publicado_en  timestamptz,
    creado_en     timestamptz not null default now(),
    actualizado_en timestamptz not null default now()
);

create index if not exists idx_curso_categoria
    on public.curso (categoria_id);
create index if not exists idx_curso_estado
    on public.curso (estado);
create index if not exists idx_curso_titulo_trgm
    on public.curso using gin (titulo gin_trgm_ops);

-- -----------------------------------------------------------------------------
-- B.3 Docentes responsables (asignacion)
--     Un curso puede tener varios docentes; uno es responsable principal.
-- -----------------------------------------------------------------------------
create table if not exists public.docente_curso (
    id            uuid primary key default gen_random_uuid(),
    curso_id      uuid        not null references public.curso (id) on delete cascade,
    docente_id    uuid        not null references public.perfil (id) on delete cascade,
    es_responsable boolean    not null default false,
    activo        boolean     not null default true,
    asignado_por  uuid references public.perfil (id) on delete set null,
    asignado_en   timestamptz not null default now(),
    unique (curso_id, docente_id)
);

create index if not exists idx_docente_curso_docente
    on public.docente_curso (docente_id, activo);

-- Solo un docente responsable activo por curso.
create unique index if not exists uq_docente_curso_responsable
    on public.docente_curso (curso_id)
    where es_responsable and activo;

-- -----------------------------------------------------------------------------
-- B.4 Unidades (temas / semanas)
-- -----------------------------------------------------------------------------
create table if not exists public.unidad (
    id            uuid primary key default gen_random_uuid(),
    curso_id      uuid        not null references public.curso (id) on delete cascade,
    numero        integer     not null check (numero > 0),
    titulo        text        not null,
    descripcion   text,
    xp_otorgado   integer     not null default 0 check (xp_otorgado >= 0),
    publicado     boolean     not null default false,
    creado_en     timestamptz not null default now(),
    actualizado_en timestamptz not null default now(),
    unique (curso_id, numero)
);

-- -----------------------------------------------------------------------------
-- B.5 Modulos (lecciones agrupadas dentro de una unidad)
-- -----------------------------------------------------------------------------
create table if not exists public.modulo (
    id            uuid primary key default gen_random_uuid(),
    unidad_id     uuid        not null references public.unidad (id) on delete cascade,
    numero        integer     not null check (numero > 0),
    titulo        text        not null,
    descripcion   text,
    xp_otorgado   integer     not null default 0 check (xp_otorgado >= 0),
    publicado     boolean     not null default false,
    creado_en     timestamptz not null default now(),
    actualizado_en timestamptz not null default now(),
    unique (unidad_id, numero)
);

-- -----------------------------------------------------------------------------
-- B.6 Lecciones
-- -----------------------------------------------------------------------------
create table if not exists public.leccion (
    id                uuid primary key default gen_random_uuid(),
    modulo_id         uuid        not null references public.modulo (id) on delete cascade,
    numero            integer     not null check (numero > 0),
    titulo            text        not null,
    descripcion       text,
    tipo_contenido    public.tipo_contenido not null default 'texto',
    duracion_minutos  integer     not null default 0 check (duracion_minutos >= 0),
    xp_otorgado       integer     not null default 0 check (xp_otorgado >= 0),
    publicado         boolean     not null default false,
    requerido_aprobacion boolean not null default false,
    creado_en         timestamptz not null default now(),
    actualizado_en    timestamptz not null default now(),
    unique (modulo_id, numero)
);

-- -----------------------------------------------------------------------------
-- B.7 Contenido de la leccion (bloques ordenados)
-- -----------------------------------------------------------------------------
create table if not exists public.contenido (
    id            uuid primary key default gen_random_uuid(),
    leccion_id    uuid        not null references public.leccion (id) on delete cascade,
    orden         integer     not null check (orden > 0),
    tipo          public.tipo_contenido not null default 'texto',
    titulo        text,
    cuerpo        text,
    datos         jsonb       not null default '{}'::jsonb,
    creado_en     timestamptz not null default now(),
    actualizado_en timestamptz not null default now(),
    unique (leccion_id, orden)
);

-- -----------------------------------------------------------------------------
-- B.8 Recursos y materiales descargables
-- -----------------------------------------------------------------------------
create table if not exists public.recurso (
    id            uuid primary key default gen_random_uuid(),
    leccion_id    uuid        not null references public.leccion (id) on delete cascade,
    contenido_id  uuid references public.contenido (id) on delete set null,
    nombre        text        not null,
    tipo          public.tipo_recurso not null default 'archivo',
    url           text,
    ruta_storage  text,
    tamano_bytes  bigint check (tamano_bytes is null or tamano_bytes >= 0),
    mime_type     text,
    descargable   boolean     not null default false,
    creado_en     timestamptz not null default now(),
    actualizado_en timestamptz not null default now()
);

create index if not exists idx_recurso_leccion
    on public.recurso (leccion_id);

-- -----------------------------------------------------------------------------
-- B.9 Material descargable (con control de acceso y caducidad)
-- -----------------------------------------------------------------------------
create table if not exists public.material_descargable (
    id            uuid primary key default gen_random_uuid(),
    recurso_id    uuid        not null references public.recurso (id) on delete cascade,
    nombre        text        not null,
    ruta_storage  text        not null,
    mime_type     text,
    tamano_bytes  bigint check (tamano_bytes is null or tamano_bytes >= 0),
    hash_sha256   text,
    max_descargas integer,
    descargas     integer     not null default 0 check (descargas >= 0),
    requiere_matricula boolean not null default true,
    expira_en     timestamptz,
    creado_en     timestamptz not null default now(),
    actualizado_en timestamptz not null default now(),
    unique (recurso_id, nombre)
);

-- -----------------------------------------------------------------------------
-- B.10 Requisitos previos entre cursos
-- -----------------------------------------------------------------------------
create table if not exists public.requisito_previo (
    id                  uuid primary key default gen_random_uuid(),
    curso_id            uuid not null references public.curso (id) on delete cascade,
    curso_requisito_id  uuid not null references public.curso (id) on delete cascade,
    creado_en           timestamptz not null default now(),
    unique (curso_id, curso_requisito_id),
    check (curso_id <> curso_requisito_id)
);

-- -----------------------------------------------------------------------------
-- B.11 Historial de publicacion (auditoria de cambios de estado)
-- -----------------------------------------------------------------------------
create table if not exists public.historial_publicacion (
    id            uuid primary key default gen_random_uuid(),
    curso_id      uuid        not null references public.curso (id) on delete cascade,
    estado_anterior public.estado_curso,
    estado_nuevo  public.estado_curso not null,
    actor_id      uuid references public.perfil (id) on delete set null,
    comentario    text,
    creado_en     timestamptz not null default now()
);

create index if not exists idx_historial_publicacion_curso
    on public.historial_publicacion (curso_id, creado_en desc);


-- =============================================================================
-- TRIGGERS DE MANTENIMIENTO
-- =============================================================================
do $$
declare
    t text;
begin
    foreach t in array array[
        'perfil', 'solicitud_docente', 'categoria', 'curso',
        'unidad', 'modulo', 'leccion', 'contenido', 'recurso',
        'material_descargable', 'preferencia_usuario'
    ] loop
        execute format('drop trigger if exists trg_actualizar_timestamp on public.%I', t);
        execute format(
            'create trigger trg_actualizar_timestamp '
            'before update on public.%I '
            'for each row execute function public.fn_actualizar_timestamp()', t);
    end loop;
end $$;

-- =============================================================================
-- FIN DE LA MIGRACION 0002
-- =============================================================================
