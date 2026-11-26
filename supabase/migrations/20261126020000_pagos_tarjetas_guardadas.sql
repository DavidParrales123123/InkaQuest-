-- =============================================================================
-- InkaQuest - Migración 20261126020000
-- Métodos de pago guardados de forma SEGURA.
--
-- NO se guarda número de tarjeta (PAN), CVV ni fecha completa en claro.
-- Solo se almacena la referencia del vault de Culqi (customer/card) y metadata
-- no sensible: marca y últimos 4 dígitos. Los datos de tarjeta viven en Culqi.
-- =============================================================================

begin;

-- Cliente de Culqi asociado al perfil (id del vault, no dato de tarjeta).
alter table public.perfil add column if not exists culqi_customer_id text;
create index if not exists idx_perfil_culqi_customer on public.perfil (culqi_customer_id)
    where culqi_customer_id is not null;

create table if not exists public.tarjeta_guardada (
    id                  uuid primary key default gen_random_uuid(),
    usuario_id          uuid not null references public.perfil (id) on delete cascade,
    culqi_customer_id   text not null,
    culqi_card_id       text not null unique,
    marca               text,
    ultimos4            text not null check (ultimos4 ~ '^[0-9]{4}$'),
    mes_expiracion      integer check (mes_expiracion between 1 and 12),
    anio_expiracion     integer check (anio_expiracion between 2000 and 2100),
    activo              boolean not null default true,
    creado_en           timestamptz not null default now(),
    actualizado_en      timestamptz not null default now(),
    unique (usuario_id, culqi_card_id)
);

create index if not exists idx_tarjeta_guardada_usuario on public.tarjeta_guardada (usuario_id, activo);

alter table public.tarjeta_guardada enable row level security;
alter table public.tarjeta_guardada force row level security;

grant select, insert, update, delete on public.tarjeta_guardada to authenticated;

drop policy if exists pol_tarjeta_guardada_select on public.tarjeta_guardada;
create policy pol_tarjeta_guardada_select on public.tarjeta_guardada
    for select to authenticated using (usuario_id = public.efectivo_user_id());

drop policy if exists pol_tarjeta_guardada_insert on public.tarjeta_guardada;
create policy pol_tarjeta_guardada_insert on public.tarjeta_guardada
    for insert to authenticated with check (usuario_id = public.efectivo_user_id());

drop policy if exists pol_tarjeta_guardada_update on public.tarjeta_guardada;
create policy pol_tarjeta_guardada_update on public.tarjeta_guardada
    for update to authenticated
    using (usuario_id = public.efectivo_user_id())
    with check (usuario_id = public.efectivo_user_id());

drop policy if exists pol_tarjeta_guardada_delete on public.tarjeta_guardada;
create policy pol_tarjeta_guardada_delete on public.tarjeta_guardada
    for delete to authenticated using (usuario_id = public.efectivo_user_id());

comment on table public.tarjeta_guardada is
    'Referencias al vault de Culqi (customer/card). NUNCA contiene PAN, CVV ni datos sensibles de tarjeta.';

commit;

notify pgrst, 'reload schema';
