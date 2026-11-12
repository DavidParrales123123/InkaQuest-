-- =============================================================================
-- MIGRACION 0003 - Modulo I: Gamificacion
-- -----------------------------------------------------------------------------
-- Depende de: 0001 (tipos), 0002 (perfil, curso)
--
-- Se ubica ANTES de la migracion de progreso porque las funciones de avance
-- de progreso (fn_registrar_xp, fn_registrar_completado_leccion) dependen de
-- las tablas de gamificacion creadas aqui (transaccion_xp, regla_progresion).
--
-- INTEGRIDAD DE LAS RECOMPENSAS
--   - Cada otorgamiento tiene clave de idempotencia: un reintento no duplica
--     la insignia ni la recompensa.
--   - El saldo de XP y de monedas se actualiza dentro de la misma transaccion
--     que registra el movimiento en el historial.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- I.1 Reglas de progresion (umbrales de nivel)
-- -----------------------------------------------------------------------------
create table if not exists public.regla_progresion (
    id            uuid primary key default gen_random_uuid(),
    tipo          text        not null default 'nivel'
                  check (tipo in ('nivel', 'racha', 'puntos')),
    nombre        text        not null,
    xp_requerido  integer     not null default 0 check (xp_requerido >= 0),
    valor         integer     not null default 0,
    descripcion   text,
    activa        boolean     not null default true,
    creado_en     timestamptz not null default now(),
    actualizado_en timestamptz not null default now(),
    unique (tipo, xp_requerido)
);

create index if not exists idx_regla_progresion_activa
    on public.regla_progresion (activa, tipo, xp_requerido);

-- -----------------------------------------------------------------------------
-- I.2 Historial de XP (append-only, libro mayor)
-- -----------------------------------------------------------------------------
create table if not exists public.transaccion_xp (
    id                uuid primary key default gen_random_uuid(),
    usuario_id        uuid        not null references public.perfil (id) on delete cascade,
    xp                integer     not null,
    concepto          public.concepto_xp not null,
    referencia_tipo   text,
    referencia_id     uuid,
    descripcion       text,
    creado_en         timestamptz not null default now()
);

create index if not exists idx_transaccion_xp_usuario
    on public.transaccion_xp (usuario_id, creado_en desc);
create index if not exists idx_transaccion_xp_referencia
    on public.transaccion_xp (referencia_tipo, referencia_id);

-- -----------------------------------------------------------------------------
-- I.3 Insignias
-- -----------------------------------------------------------------------------
create table if not exists public.insignia (
    id            uuid primary key default gen_random_uuid(),
    codigo        text        not null unique,
    nombre        text        not null,
    descripcion   text,
    icono         text,
    xp_otorgado   integer     not null default 0 check (xp_otorgado >= 0),
    rareza        text        not null default 'comun'
                  check (rareza in ('comun', 'raro', 'epico', 'legendario')),
    activa        boolean     not null default true,
    creado_en     timestamptz not null default now(),
    actualizado_en timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- I.4 Requisitos de insignias
-- -----------------------------------------------------------------------------
create table if not exists public.requisito_insignia (
    id            uuid primary key default gen_random_uuid(),
    insignia_id   uuid        not null references public.insignia (id) on delete cascade,
    tipo          text        not null
                  check (tipo in ('xp_total', 'nivel', 'curso_completado',
                                  'lecciones_completadas', 'racha_dias',
                                  'reto_resuelto', 'minijuego_terminado',
                                  'examen_aprobado', 'mision_completada')),
    valor         integer     not null default 0 check (valor >= 0),
    curso_id      uuid references public.curso (id) on delete cascade,
    creado_en     timestamptz not null default now()
);

create index if not exists idx_requisito_insignia_insignia
    on public.requisito_insignia (insignia_id);

-- -----------------------------------------------------------------------------
-- I.5 Insignias obtenidas
-- -----------------------------------------------------------------------------
create table if not exists public.insignia_usuario (
    id            uuid primary key default gen_random_uuid(),
    usuario_id    uuid        not null references public.perfil (id) on delete cascade,
    insignia_id   uuid        not null references public.insignia (id) on delete cascade,
    progreso      numeric(5, 2) not null default 0 check (progreso between 0 and 100),
    obtenida_en   timestamptz,
    creado_en     timestamptz not null default now(),
    unique (usuario_id, insignia_id)
);

create index if not exists idx_insignia_usuario_usuario
    on public.insignia_usuario (usuario_id, obtenida_en desc);

-- -----------------------------------------------------------------------------
-- I.6 Rachas (dias consecutivos de actividad)
-- -----------------------------------------------------------------------------
create table if not exists public.racha (
    id            uuid primary key default gen_random_uuid(),
    usuario_id    uuid        not null references public.perfil (id) on delete cascade,
    racha_actual  integer     not null default 0 check (racha_actual >= 0),
    mejor_racha   integer     not null default 0 check (mejor_racha >= 0),
    ultima_actividad date,
    creado_en     timestamptz not null default now(),
    actualizado_en timestamptz not null default now(),
    unique (usuario_id)
);

-- -----------------------------------------------------------------------------
-- I.7 Historial de rachas
-- -----------------------------------------------------------------------------
create table if not exists public.historial_racha (
    id            uuid primary key default gen_random_uuid(),
    usuario_id    uuid        not null references public.perfil (id) on delete cascade,
    fecha         date        not null,
    racha         integer     not null default 0 check (racha >= 0),
    xp_otorgado   integer     not null default 0,
    creado_en     timestamptz not null default now(),
    unique (usuario_id, fecha)
);

create index if not exists idx_historial_racha_usuario
    on public.historial_racha (usuario_id, fecha desc);

-- -----------------------------------------------------------------------------
-- I.8 Temporadas (periodos de clasificacion)
-- -----------------------------------------------------------------------------
create table if not exists public.temporada (
    id            uuid primary key default gen_random_uuid(),
    nombre        text        not null unique,
    descripcion   text,
    estado        public.estado_temporada not null default 'programada',
    fecha_inicio  date        not null,
    fecha_fin     date        not null,
    creado_en     timestamptz not null default now(),
    actualizado_en timestamptz not null default now(),
    check (fecha_fin > fecha_inicio)
);

-- -----------------------------------------------------------------------------
-- I.9 Ranking
-- -----------------------------------------------------------------------------
create table if not exists public.ranking (
    id            uuid primary key default gen_random_uuid(),
    temporada_id  uuid        not null references public.temporada (id) on delete cascade,
    usuario_id    uuid        not null references public.perfil (id) on delete cascade,
    puntos        integer     not null default 0,
    posicion      integer     check (posicion is null or posicion > 0),
    actualizado_en timestamptz not null default now(),
    unique (temporada_id, usuario_id)
);

create index if not exists idx_ranking_temporada_puntos
    on public.ranking (temporada_id, puntos desc);

-- -----------------------------------------------------------------------------
-- I.10 Eventos de gamificacion
-- -----------------------------------------------------------------------------
create table if not exists public.evento_gamificacion (
    id            uuid primary key default gen_random_uuid(),
    nombre        text        not null unique,
    descripcion   text,
    fecha_inicio  timestamptz not null,
    fecha_fin     timestamptz not null,
    activo        boolean     not null default true,
    creado_en     timestamptz not null default now(),
    actualizado_en timestamptz not null default now(),
    check (fecha_fin > fecha_inicio)
);

-- -----------------------------------------------------------------------------
-- I.11 Misiones
-- -----------------------------------------------------------------------------
create table if not exists public.mision (
    id            uuid primary key default gen_random_uuid(),
    evento_id     uuid references public.evento_gamificacion (id) on delete cascade,
    nombre        text        not null,
    descripcion   text,
    tipo          public.tipo_mision not null default 'diaria',
    objetivo_tipo text        not null default 'lecciones_completadas',
    objetivo_cantidad integer  not null default 1 check (objetivo_cantidad > 0),
    xp_recompensa integer     not null default 0 check (xp_recompensa >= 0),
    monedas_recompensa integer not null default 0 check (monedas_recompensa >= 0),
    insignia_id   uuid references public.insignia (id) on delete set null,
    curso_id      uuid references public.curso (id) on delete cascade,
    fecha_inicio  timestamptz,
    fecha_fin     timestamptz,
    activa        boolean     not null default true,
    creado_en     timestamptz not null default now(),
    actualizado_en timestamptz not null default now()
);

create index if not exists idx_mision_evento
    on public.mision (evento_id, activa);

-- -----------------------------------------------------------------------------
-- I.12 Progreso de misiones por usuario
-- -----------------------------------------------------------------------------
create table if not exists public.mision_usuario (
    id            uuid primary key default gen_random_uuid(),
    mision_id     uuid        not null references public.mision (id) on delete cascade,
    usuario_id    uuid        not null references public.perfil (id) on delete cascade,
    progreso      integer     not null default 0 check (progreso >= 0),
    estado        public.estado_mision not null default 'pendiente',
    recompensa_otorgada boolean not null default false,
    completado_en timestamptz,
    creado_en     timestamptz not null default now(),
    actualizado_en timestamptz not null default now(),
    unique (mision_id, usuario_id)
);

create index if not exists idx_mision_usuario_usuario
    on public.mision_usuario (usuario_id, estado);

-- -----------------------------------------------------------------------------
-- I.13 Monedas virtuales (monedero)
-- -----------------------------------------------------------------------------
create table if not exists public.monedero (
    id            uuid primary key default gen_random_uuid(),
    usuario_id    uuid        not null references public.perfil (id) on delete cascade,
    saldo         integer     not null default 0 check (saldo >= 0),
    creado_en     timestamptz not null default now(),
    actualizado_en timestamptz not null default now(),
    unique (usuario_id)
);

-- -----------------------------------------------------------------------------
-- I.14 Tienda de articulos
-- -----------------------------------------------------------------------------
create table if not exists public.tienda_item (
    id            uuid primary key default gen_random_uuid(),
    codigo        text        not null unique,
    nombre        text        not null,
    descripcion   text,
    tipo          public.tipo_recompensa not null default 'item',
    precio_monedas integer    not null default 0 check (precio_monedas >= 0),
    precio_xp     integer     not null default 0 check (precio_xp >= 0),
    imagen_url    text,
    datos         jsonb       not null default '{}'::jsonb,
    stock         integer     check (stock is null or stock >= 0),
    limite_por_usuario integer,
    activo        boolean     not null default true,
    creado_en     timestamptz not null default now(),
    actualizado_en timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- I.15 Inventario del usuario
-- -----------------------------------------------------------------------------
create table if not exists public.inventario (
    id            uuid primary key default gen_random_uuid(),
    usuario_id    uuid        not null references public.perfil (id) on delete cascade,
    tienda_item_id uuid       not null references public.tienda_item (id) on delete cascade,
    cantidad      integer     not null default 1 check (cantidad >= 0),
    --
    -- Clave de idempotencia: evita duplicar recompensas al reintentar.
    clave_idempotencia text   unique,
    --
    -- Referencia al origen del otorgamiento (por ejemplo un intento de juego).
    referencia_tipo text,
    referencia_id   uuid,
    adquirido_en    timestamptz not null default now()
);

create index if not exists idx_inventario_usuario
    on public.inventario (usuario_id, tienda_item_id);

-- -----------------------------------------------------------------------------
-- I.16 Compras virtuales
-- -----------------------------------------------------------------------------
create table if not exists public.compra_virtual (
    id                uuid primary key default gen_random_uuid(),
    usuario_id        uuid        not null references public.perfil (id) on delete cascade,
    tienda_item_id    uuid        not null references public.tienda_item (id) on delete restrict,
    cantidad          integer     not null default 1 check (cantidad > 0),
    monedas_gastadas  integer     not null default 0 check (monedas_gastadas >= 0),
    xp_gastado        integer     not null default 0 check (xp_gastado >= 0),
    clave_idempotencia text       not null unique,
    creado_en         timestamptz not null default now()
);

create index if not exists idx_compra_virtual_usuario
    on public.compra_virtual (usuario_id, creado_en desc);

-- -----------------------------------------------------------------------------
-- I.17 Historial de movimiento de monedas
-- -----------------------------------------------------------------------------
create table if not exists public.transaccion_moneda (
    id            uuid primary key default gen_random_uuid(),
    usuario_id    uuid        not null references public.perfil (id) on delete cascade,
    monedas       integer     not null,
    saldo_resultante integer  not null default 0,
    concepto      text        not null,
    referencia_tipo text,
    referencia_id uuid,
    creado_en     timestamptz not null default now()
);

create index if not exists idx_transaccion_moneda_usuario
    on public.transaccion_moneda (usuario_id, creado_en desc);


-- =============================================================================
-- TRIGGERS DE MANTENIMIENTO
-- =============================================================================
do $$
declare
    t text;
begin
    foreach t in array array[
        'regla_progresion', 'insignia', 'racha', 'temporada',
        'evento_gamificacion', 'mision', 'monedero', 'tienda_item'
    ] loop
        execute format('drop trigger if exists trg_actualizar_timestamp on public.%I', t);
        execute format(
            'create trigger trg_actualizar_timestamp '
            'before update on public.%I '
            'for each row execute function public.fn_actualizar_timestamp()', t);
    end loop;
end $$;


-- =============================================================================
-- FUNCIONES DE GAMIFICACION
-- =============================================================================

-- Otorga XP, lo registra en el historial y recalcula el nivel del usuario.
-- El nivel se determina contando las reglas de progresion activas cuyo
-- umbral de XP ya fue alcanzado.
create or replace function public.fn_registrar_xp(
    p_usuario_id      uuid,
    p_xp              integer,
    p_concepto        public.concepto_xp,
    p_referencia_tipo text default null,
    p_referencia_id   uuid default null
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_nuevo_xp    integer;
    v_nuevo_nivel integer;
begin
    if p_xp = 0 then
        return 0;
    end if;

    -- Se marca la escritura como procedente del motor del sistema: el trigger
    -- de anti-escalacion permite el cambio de XP en este caso.
    perform public.fn_activar_escritura_sistema();

    -- Actualizar XP acumulado (nunca por debajo de cero)
    update public.perfil
       set xp = greatest(0, xp + p_xp)
     where id = p_usuario_id
    returning xp into v_nuevo_xp;

    if v_nuevo_xp is null then
        perform public.fn_desactivar_escritura_sistema();
        return 0;
    end if;

    -- Libro mayor de XP
    insert into public.transaccion_xp (
        usuario_id, xp, concepto, referencia_tipo, referencia_id
    ) values (
        p_usuario_id, p_xp, p_concepto, p_referencia_tipo, p_referencia_id
    );

    -- Nivel: cantidad de umbrales de XP ya alcanzados (minimo 1)
    select greatest(1, count(*))::integer
      into v_nuevo_nivel
      from public.regla_progresion r
     where r.activa
       and r.tipo = 'nivel'
       and r.xp_requerido <= v_nuevo_xp;

    update public.perfil
       set nivel = greatest(nivel, v_nuevo_nivel)
     where id = p_usuario_id;

    perform public.fn_desactivar_escritura_sistema();

    return v_nuevo_xp;
end;
$$;

comment on function public.fn_registrar_xp(uuid, integer, public.concepto_xp, text, uuid) is
    'Otorga XP, lo registra en el historial y recalcula el nivel del usuario.';


-- Otorgar insignia de forma idempotente.
create or replace function public.fn_otorgar_insignia(
    p_usuario_id  uuid,
    p_insignia_id uuid,
    p_clave       text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_ya_tenia boolean;
    v_xp       integer;
begin
    select true into v_ya_tenia
      from public.insignia_usuario
     where usuario_id = p_usuario_id
       and insignia_id = p_insignia_id
       and obtenida_en is not null;

    if v_ya_tenia then
        return false;   -- ya la tenia: no se duplica
    end if;

    insert into public.insignia_usuario (
        usuario_id, insignia_id, progreso, obtenida_en
    ) values (
        p_usuario_id, p_insignia_id, 100, now()
    )
    on conflict (usuario_id, insignia_id) do update
        set progreso = 100, obtenida_en = now();

    select xp_otorgado into v_xp
      from public.insignia where id = p_insignia_id;

    if coalesce(v_xp, 0) > 0 then
        perform public.fn_registrar_xp(
            p_usuario_id, v_xp, 'insignia', 'insignia', p_insignia_id
        );
    end if;

    insert into public.evento_plataforma (tipo, entidad, entidad_id, actor_id, datos)
    values ('insignia_otorgada', 'insignia', p_insignia_id, p_usuario_id,
            jsonb_build_object('clave', p_clave));

    return true;
end;
$$;

-- Actualizar la racha diaria (una vez por dia y usuario).
create or replace function public.fn_actualizar_racha(p_usuario_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_racha     integer;
    v_ultima    date;
    v_hoy       date := current_date;
    v_nueva     integer;
    v_xp_racha  integer;
begin
    select racha_actual, ultima_actividad into v_racha, v_ultima
      from public.racha where usuario_id = p_usuario_id;

    if v_racha is null then
        v_racha := 0;
        v_ultima := null;
    end if;

    -- Mismo dia: no se modifica
    if v_ultima = v_hoy then
        return v_racha;
    end if;

    -- Dia consecutivo: incrementa
    if v_ultima = v_hoy - 1 then
        v_nueva := v_racha + 1;
    else
        v_nueva := 1;
    end if;

    insert into public.racha (usuario_id, racha_actual, mejor_racha, ultima_actividad)
    values (p_usuario_id, v_nueva, v_nueva, v_hoy)
    on conflict (usuario_id) do update
        set racha_actual = excluded.racha_actual,
            mejor_racha = greatest(public.racha.mejor_racha, excluded.mejor_racha),
            ultima_actividad = excluded.ultima_actividad;

    insert into public.historial_racha (usuario_id, fecha, racha)
    values (p_usuario_id, v_hoy, v_nueva)
    on conflict (usuario_id, fecha) do nothing;

    -- XP por racha: consultamos la regla configurable
    select coalesce(r.valor, 0) into v_xp_racha
      from public.regla_progresion r
     where r.activa and r.tipo = 'racha'
     order by r.valor desc
     limit 1;

    if v_xp_racha > 0 then
        perform public.fn_registrar_xp(p_usuario_id, v_xp_racha, 'racha_diaria', 'racha', null);
    end if;

    -- Actualizacion del perfil (racha): escritura del sistema
    perform public.fn_activar_escritura_sistema();

    update public.perfil
       set racha_dias = v_nueva
     where id = p_usuario_id;

    perform public.fn_desactivar_escritura_sistema();

    return v_nueva;
end;
$$;

-- Coins: idempotency by clave
create or replace function public.fn_otorgar_monedas(
    p_usuario_id uuid,
    p_cantidad   integer,
    p_concepto   text,
    p_clave      text
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_saldo integer;
begin
    -- Idempotencia: si la clave ya se uso, no se vuelve a acreditar.
    if exists (
        select 1 from public.transaccion_moneda
         where usuario_id = p_usuario_id
           and concepto = p_concepto
           and referencia_id = nullif(p_clave, '')::uuid
    ) then
        select saldo into v_saldo from public.monedero where usuario_id = p_usuario_id;
        return coalesce(v_saldo, 0);
    end if;

    insert into public.monedero (usuario_id, saldo)
    values (p_usuario_id, greatest(p_cantidad, 0))
    on conflict (usuario_id) do update
        set saldo = public.monedero.saldo + greatest(p_cantidad, 0)
    returning saldo into v_saldo;

    insert into public.transaccion_moneda (
        usuario_id, monedas, saldo_resultante, concepto,
        referencia_tipo, referencia_id
    ) values (
        p_usuario_id, greatest(p_cantidad, 0), v_saldo, p_concepto,
        'clave', nullif(p_clave, '')::uuid
    );

    return v_saldo;
end;
$$;


-- =============================================================================
-- FIN DE LA MIGRACION 0003 (gamificacion)
-- =============================================================================
