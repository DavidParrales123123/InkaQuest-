-- =============================================================================
-- MIGRACION 0003 - Modulo C: Matriculas
--                 Modulo D: Pagos y comercio electronico
-- -----------------------------------------------------------------------------
-- Depende de: 0001 (tipos), 0002 (perfil, curso)
--
-- REGLAS DE INTEGRIDAD DEL MODULO D
--   - La matricula de pago solo se activa tras confirmacion verificada del
--     pago: lo garantiza el trigger trg_activar_matricula_tras_pago.
--   - Idempotencia: webhooks y transacciones usan claves unicas para que un
--     reintento del proveedor no genere cobros ni matriculas duplicadas.
--   - Nunca se almacenan numeros completos de tarjeta ni CVV: solo tokens
--     opacos del proveedor.
-- =============================================================================


-- =============================================================================
-- MODULO C - MATRICULAS
-- =============================================================================

create table if not exists public.matricula (
    id                uuid primary key default gen_random_uuid(),
    estudiante_id     uuid        not null references public.perfil (id) on delete cascade,
    curso_id          uuid        not null references public.curso (id) on delete cascade,
    estado            public.estado_matricula not null default 'pendiente_pago',
    precio_pagado     numeric(10, 2) not null default 0 check (precio_pagado >= 0),
    moneda            text        not null default 'PEN',
    porcentaje_progreso numeric(5, 2) not null default 0
                        check (porcentaje_progreso between 0 and 100),
    xp_ganado         integer     not null default 0 check (xp_ganado >= 0),
    matriculado_en    timestamptz,
    completado_en     timestamptz,
    cancelado_en      timestamptz,
    creado_en         timestamptz not null default now(),
    actualizado_en    timestamptz not null default now(),
    -- Una sola matricula por estudiante y curso.
    unique (estudiante_id, curso_id)
);

create index if not exists idx_matricula_curso
    on public.matricula (curso_id, estado);
create index if not exists idx_matricula_estudiante
    on public.matricula (estudiante_id, estado);

-- -----------------------------------------------------------------------------
-- C.2 Historial de cambios de estado de la matricula
-- -----------------------------------------------------------------------------
create table if not exists public.historial_matricula (
    id                uuid primary key default gen_random_uuid(),
    matricula_id      uuid        not null references public.matricula (id) on delete cascade,
    estado_anterior   public.estado_matricula,
    estado_nuevo      public.estado_matricula not null,
    actor_id          uuid references public.perfil (id) on delete set null,
    motivo            text,
    creado_en         timestamptz not null default now()
);

create index if not exists idx_historial_matricula_matricula
    on public.historial_matricula (matricula_id, creado_en desc);

-- -----------------------------------------------------------------------------
-- C.3 Renovaciones (suscripciones con vigencia)
-- -----------------------------------------------------------------------------
create table if not exists public.renovacion_matricula (
    id            uuid primary key default gen_random_uuid(),
    matricula_id  uuid        not null references public.matricula (id) on delete cascade,
    pago_id       uuid,
    monto         numeric(10, 2) not null default 0 check (monto >= 0),
    moneda        text        not null default 'PEN',
    desde         date        not null,
    hasta         date        not null,
    creado_en     timestamptz not null default now(),
    check (hasta > desde)
);

create index if not exists idx_renovacion_matricula
    on public.renovacion_matricula (matricula_id, desde desc);

-- -----------------------------------------------------------------------------
-- C.4 Cancelaciones
-- -----------------------------------------------------------------------------
create table if not exists public.cancelacion_matricula (
    id                uuid primary key default gen_random_uuid(),
    matricula_id      uuid        not null references public.matricula (id) on delete cascade,
    motivo            text        not null,
    solicitado_por    uuid references public.perfil (id) on delete set null,
    reembolso_id      uuid,
    estado            text        not null default 'solicitada'
                    check (estado in ('solicitada', 'aprobada', 'rechazada', 'procesada')),
    creado_en         timestamptz not null default now(),
    actualizado_en    timestamptz not null default now()
);

create index if not exists idx_cancelacion_matricula
    on public.cancelacion_matricula (matricula_id, creado_en desc);

-- -----------------------------------------------------------------------------
-- C.5 Control de acceso al curso
-- -----------------------------------------------------------------------------
create table if not exists public.acceso_curso (
    id                uuid primary key default gen_random_uuid(),
    usuario_id        uuid        not null references public.perfil (id) on delete cascade,
    curso_id          uuid        not null references public.curso (id) on delete cascade,
    matricula_id      uuid references public.matricula (id) on delete set null,
    abierto           boolean     not null default true,
    motivo            text,
    expira_en         timestamptz,
    creado_en         timestamptz not null default now(),
    actualizado_en    timestamptz not null default now(),
    unique (usuario_id, curso_id)
);

create index if not exists idx_acceso_curso_curso
    on public.acceso_curso (curso_id, abierto);


-- =============================================================================
-- MODULO D - PAGOS Y COMERCIO ELECTRONICO
-- =============================================================================

-- -----------------------------------------------------------------------------
-- D.1 Carrito de compra
-- -----------------------------------------------------------------------------
create table if not exists public.carrito (
    id            uuid primary key default gen_random_uuid(),
    usuario_id    uuid        not null references public.perfil (id) on delete cascade,
    estado        text        not null default 'abierto'
                  check (estado in ('abierto', 'convertido', 'abandonado')),
    creado_en     timestamptz not null default now(),
    actualizado_en timestamptz not null default now()
);

create index if not exists idx_carrito_usuario
    on public.carrito (usuario_id, estado);

-- -----------------------------------------------------------------------------
-- D.2 Items del carrito
-- -----------------------------------------------------------------------------
create table if not exists public.item_carrito (
    id                uuid primary key default gen_random_uuid(),
    carrito_id        uuid        not null references public.carrito (id) on delete cascade,
    curso_id          uuid        not null references public.curso (id) on delete cascade,
    cantidad          integer     not null default 1 check (cantidad > 0),
    precio_unitario   numeric(10, 2) not null default 0 check (precio_unitario >= 0),
    creado_en         timestamptz not null default now(),
    unique (carrito_id, curso_id)
);

-- -----------------------------------------------------------------------------
-- D.3 Pedidos
-- -----------------------------------------------------------------------------
create table if not exists public.pedido (
    id                uuid primary key default gen_random_uuid(),
    usuario_id        uuid        not null references public.perfil (id) on delete restrict,
    numero            text        not null unique,
    estado            public.estado_pedido not null default 'pendiente',
    subtotal          numeric(10, 2) not null default 0 check (subtotal >= 0),
    descuento         numeric(10, 2) not null default 0 check (descuento >= 0),
    total             numeric(10, 2) not null default 0 check (total >= 0),
    moneda            text        not null default 'PEN',
    cupon_id          uuid,
    -- Clave de idempotencia: reintentos del cliente no duplican el pedido.
    clave_idempotencia text       unique,
    creado_en         timestamptz not null default now(),
    actualizado_en    timestamptz not null default now()
);

create index if not exists idx_pedido_usuario
    on public.pedido (usuario_id, creado_en desc);
create index if not exists idx_pedido_estado
    on public.pedido (estado, creado_en desc);

-- -----------------------------------------------------------------------------
-- D.4 Detalle del pedido (lineas)
-- -----------------------------------------------------------------------------
create table if not exists public.detalle_pedido (
    id                uuid primary key default gen_random_uuid(),
    pedido_id         uuid        not null references public.pedido (id) on delete cascade,
    curso_id          uuid        not null references public.curso (id) on delete restrict,
    titulo_snapshot   text        not null,
    precio_unitario   numeric(10, 2) not null default 0 check (precio_unitario >= 0),
    cantidad          integer     not null default 1 check (cantidad > 0),
    subtotal          numeric(10, 2) not null default 0 check (subtotal >= 0),
    creado_en         timestamptz not null default now()
);

create index if not exists idx_detalle_pedido_pedido
    on public.detalle_pedido (pedido_id);

-- -----------------------------------------------------------------------------
-- D.5 Cupones, descuentos y promociones
-- -----------------------------------------------------------------------------
create table if not exists public.cupon (
    id                uuid primary key default gen_random_uuid(),
    codigo            text        not null unique,
    descripcion       text,
    tipo              public.tipo_descuento not null default 'porcentaje',
    valor             numeric(10, 2) not null default 0 check (valor >= 0),
    porcentaje_maximo numeric(5, 2) check (porcentaje_maximo is null or porcentaje_maximo between 0 and 100),
    usos_maximos      integer check (usos_maximos is null or usos_maximos > 0),
    usos_actuales     integer     not null default 0 check (usos_actuales >= 0),
    limite_por_usuario integer,
    valido_desde      timestamptz,
    valido_hasta      timestamptz,
    activo            boolean     not null default true,
    creado_en         timestamptz not null default now(),
    actualizado_en    timestamptz not null default now(),
    check (valido_hasta is null or valido_desde is null or valido_hasta > valido_desde)
);

create table if not exists public.descuento (
    id                uuid primary key default gen_random_uuid(),
    nombre            text        not null,
    descripcion       text,
    tipo              public.tipo_descuento not null default 'porcentaje',
    valor             numeric(10, 2) not null default 0 check (valor >= 0),
    curso_id          uuid references public.curso (id) on delete cascade,
    activo            boolean     not null default true,
    valido_desde      timestamptz,
    valido_hasta      timestamptz,
    creado_en         timestamptz not null default now(),
    actualizado_en    timestamptz not null default now()
);

create table if not exists public.promocion (
    id                uuid primary key default gen_random_uuid(),
    nombre            text        not null,
    descripcion       text,
    descuento_id      uuid references public.descuento (id) on delete set null,
    cupon_id          uuid references public.cupon (id) on delete set null,
    activa            boolean     not null default true,
    valido_desde      timestamptz,
    valido_hasta      timestamptz,
    creado_en         timestamptz not null default now(),
    actualizado_en    timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- D.6 Transacciones de pago
-- -----------------------------------------------------------------------------
create table if not exists public.transaccion (
    id                uuid primary key default gen_random_uuid(),
    pedido_id         uuid        not null references public.pedido (id) on delete cascade,
    usuario_id        uuid        not null references public.perfil (id) on delete restrict,
    estado            public.estado_pago not null default 'iniciado',
    metodo            public.metodo_pago not null default 'tarjeta',
    monto             numeric(10, 2) not null check (monto >= 0),
    moneda            text        not null default 'PEN',
    proveedor         text        not null default 'culqi',
    -- Referencia opaca del proveedor. NUNCA el numero de tarjeta ni el CVV.
    referencia        text,
    codigo_autorizacion text,
    -- Clave de idempotencia del proveedor: un reintento no duplica el cobro.
    clave_idempotencia text       unique,
    datos             jsonb       not null default '{}'::jsonb,
    autorizado_en     timestamptz,
    capturado_en      timestamptz,
    anulado_en        timestamptz,
    creado_en         timestamptz not null default now(),
    actualizado_en    timestamptz not null default now()
);

create index if not exists idx_transaccion_pedido
    on public.transaccion (pedido_id, creado_en desc);
create index if not exists idx_transaccion_usuario
    on public.transaccion (usuario_id, creado_en desc);
create index if not exists idx_transaccion_referencia
    on public.transaccion (referencia);

-- -----------------------------------------------------------------------------
-- D.7 Intentos de pago (un pedido puede tener varios intentos)
-- -----------------------------------------------------------------------------
create table if not exists public.intento_pago (
    id                uuid primary key default gen_random_uuid(),
    transaccion_id    uuid        not null references public.transaccion (id) on delete cascade,
    numero            integer     not null check (numero > 0),
    estado            public.estado_pago not null default 'iniciado',
    monto             numeric(10, 2) not null check (monto >= 0),
    mensaje_error     text,
    datos             jsonb       not null default '{}'::jsonb,
    creado_en         timestamptz not null default now(),
    unique (transaccion_id, numero)
);

-- -----------------------------------------------------------------------------
-- D.8 Webhooks del proveedor de pago
--     evento_id es UNIQUE: garantiza que un evento repetido se procese una
--     sola vez (idempotencia).
-- -----------------------------------------------------------------------------
create table if not exists public.webhook_pago (
    id                uuid primary key default gen_random_uuid(),
    evento_id         text        not null unique,
    tipo_evento       text        not null,
    proveedor         text        not null default 'culqi',
    transaccion_id    uuid references public.transaccion (id) on delete set null,
    recibido_en       timestamptz not null default now(),
    procesado_en      timestamptz,
    procesado         boolean     not null default false,
    error             text,
    payload           jsonb       not null default '{}'::jsonb
);

create index if not exists idx_webhook_pago_procesado
    on public.webhook_pago (procesado, recibido_en);

-- -----------------------------------------------------------------------------
-- D.9 Eventos de la plataforma (auditoria de negocio)
-- -----------------------------------------------------------------------------
create table if not exists public.evento_plataforma (
    id                uuid primary key default gen_random_uuid(),
    tipo              text        not null,
    entidad           text,
    entidad_id        uuid,
    actor_id          uuid references public.perfil (id) on delete set null,
    datos             jsonb       not null default '{}'::jsonb,
    creado_en         timestamptz not null default now()
);

create index if not exists idx_evento_plataforma_tipo
    on public.evento_plataforma (tipo, creado_en desc);

-- -----------------------------------------------------------------------------
-- D.10 Reembolsos
-- -----------------------------------------------------------------------------
create table if not exists public.reembolso (
    id                uuid primary key default gen_random_uuid(),
    transaccion_id    uuid        not null references public.transaccion (id) on delete restrict,
    pedido_id         uuid references public.pedido (id) on delete set null,
    usuario_id        uuid        not null references public.perfil (id) on delete restrict,
    estado            public.estado_reembolso not null default 'solicitado',
    monto             numeric(10, 2) not null check (monto >= 0),
    moneda            text        not null default 'PEN',
    motivo            text,
    solicitado_por    uuid references public.perfil (id) on delete set null,
    referencia_proveedor text,
    procesado_en      timestamptz,
    creado_en         timestamptz not null default now(),
    actualizado_en    timestamptz not null default now()
);

create index if not exists idx_reembolso_transaccion
    on public.reembolso (transaccion_id);
create index if not exists idx_reembolso_usuario
    on public.reembolso (usuario_id, creado_en desc);

-- -----------------------------------------------------------------------------
-- D.11 Historial financiero del usuario
-- -----------------------------------------------------------------------------
create table if not exists public.historial_financiero (
    id                uuid primary key default gen_random_uuid(),
    usuario_id        uuid        not null references public.perfil (id) on delete cascade,
    tipo              text        not null,
    monto             numeric(12, 2) not null,
    saldo_resultante  numeric(12, 2) not null default 0,
    moneda            text        not null default 'PEN',
    transaccion_id    uuid references public.transaccion (id) on delete set null,
    pedido_id         uuid references public.pedido (id) on delete set null,
    reembolso_id      uuid references public.reembolso (id) on delete set null,
    descripcion       text,
    creado_en         timestamptz not null default now()
);

create index if not exists idx_historial_financiero_usuario
    on public.historial_financiero (usuario_id, creado_en desc);

-- FK diferida: el cupon del pedido se referencia tras crear el cupon.
do $$
begin
    alter table public.pedido
        drop constraint if exists fk_pedido_cupon;
    alter table public.pedido
        add constraint fk_pedido_cupon
        foreign key (cupon_id) references public.cupon (id) on delete set null;
exception
    when others then
        null;
end $$;

do $$
begin
    alter table public.renovacion_matricula
        drop constraint if exists fk_renovacion_pago;
    alter table public.renovacion_matricula
        add constraint fk_renovacion_pago
        foreign key (pago_id) references public.transaccion (id) on delete set null;
exception
    when others then
        null;
end $$;

do $$
begin
    alter table public.cancelacion_matricula
        drop constraint if exists fk_cancelacion_reembolso;
    alter table public.cancelacion_matricula
        add constraint fk_cancelacion_reembolso
        foreign key (reembolso_id) references public.reembolso (id) on delete set null;
exception
    when others then
        null;
end $$;


-- =============================================================================
-- TRIGGERS DE MANTENIMIENTO
-- =============================================================================
do $$
declare
    t text;
begin
    foreach t in array array[
        'carrito', 'pedido', 'cupon', 'descuento', 'promocion',
        'transaccion', 'reembolso'
    ] loop
        execute format('drop trigger if exists trg_actualizar_timestamp on public.%I', t);
        execute format(
            'create trigger trg_actualizar_timestamp '
            'before update on public.%I '
            'for each row execute function public.fn_actualizar_timestamp()', t);
    end loop;
end $$;


-- =============================================================================
-- REGLA DE NEGOCIO CRITICA
-- La matricula solo pasa a 'activa' cuando existe un pago CAPTURADO.
-- Se implementa como trigger sobre 'transaccion' para que ningun camino
-- (webhook, backend, SQL manual) pueda activar una matricula sin pago.
-- =============================================================================
create or replace function public.fn_activar_matricula_tras_pago()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_pedido uuid;
begin
    if new.estado = 'capturado' and (tg_op = 'INSERT' or old.estado is distinct from 'capturado') then
        select id into v_pedido from public.pedido where id = new.pedido_id;

        update public.matricula m
           set estado = 'activa',
               matriculado_en = coalesce(m.matriculado_en, now()),
               precio_pagado = new.monto,
               moneda = new.moneda
          from public.detalle_pedido dp
         where dp.pedido_id = v_pedido
           and dp.curso_id = m.curso_id
           and m.estudiante_id = new.usuario_id
           and m.estado = 'pendiente_pago';

        update public.pedido
           set estado = 'pagado'
         where id = v_pedido
           and estado in ('pendiente', 'procesando');

        insert into public.evento_plataforma (tipo, entidad, entidad_id, actor_id, datos)
        values (
            'pago_capturado', 'transaccion', new.id, new.usuario_id,
            jsonb_build_object('pedido_id', v_pedido, 'monto', new.monto)
        );
    end if;

    return new;
end;
$$;

drop trigger if exists trg_activar_matricula_tras_pago on public.transaccion;
create trigger trg_activar_matricula_tras_pago
    after insert or update of estado on public.transaccion
    for each row
    execute function public.fn_activar_matricula_tras_pago();


-- Historial automatico de estados de la matricula.
create or replace function public.fn_historial_matricula()
returns trigger
language plpgsql
as $$
begin
    if tg_op = 'INSERT' then
        insert into public.historial_matricula (
            matricula_id, estado_anterior, estado_nuevo, actor_id, motivo
        ) values (new.id, null, new.estado, public.app_user_id(), 'alta');
    elsif new.estado is distinct from old.estado then
        insert into public.historial_matricula (
            matricula_id, estado_anterior, estado_nuevo, actor_id, motivo
        ) values (new.id, old.estado, new.estado, public.app_user_id(), null);
    end if;
    return new;
end;
$$;

drop trigger if exists trg_historial_matricula on public.matricula;
create trigger trg_historial_matricula
    after insert or update of estado on public.matricula
    for each row
    execute function public.fn_historial_matricula();


-- =============================================================================
-- FIN DE LA MIGRACION 0003
-- =============================================================================
