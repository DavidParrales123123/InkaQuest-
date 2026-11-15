-- ==============================================================
-- InkaQuest — Guardias del Conocimiento: estructura base
-- ==============================================================
-- Curso propietario: Principios de Algoritmos (ab8e59ef-ab9f-40eb-8f31-790ac7edba4a)
-- No destructiva: solo añade tablas e índices; no modifica datos existentes.
-- --------------------------------------------------------------

begin;

-- ---------- 1. Config + campaña
create table if not exists public.guardianes_config (
    id               uuid primary key default gen_random_uuid(),
    slug             text not null unique,
    nombre           text not null,
    cursos_permitidos uuid[] not null,
    activo           boolean not null default true,
    creado_por       uuid references public.perfil(id) on delete set null,
    creado_en        timestamptz not null default now(),
    actualizado_en   timestamptz not null default now()
);

create table if not exists public.guardianes_campana (
    id              uuid primary key default gen_random_uuid(),
    config_id       uuid not null references public.guardianes_config(id) on delete cascade,
    titulo          text not null,
    descripcion     text,
    creado_en       timestamptz not null default now(),
    actualizado_en  timestamptz not null default now(),
    unique (config_id)
);

-- ---------- 2. Niveles académicos
create table if not exists public.guardianes_nivel (
    id               uuid primary key default gen_random_uuid(),
    campana_id       uuid not null references public.guardianes_campana(id) on delete cascade,
    numero           smallint not null check (numero between 1 and 18),
    titulo           text not null,
    descripcion      text,
    leccion_id       uuid not null references public.leccion(id) on delete restrict,
    hordas_totales   smallint not null default 3 check (hordas_totales between 1 and 12),
    enemigos_inicial smallint not null default 6,
    xp_recompensa    smallint not null default 100,
    monedas_recompensa smallint not null default 10,
    objetivo_derrotado_cantidad smallint not null default 50,
    created_en       timestamptz not null default now(),
    actualizado_en   timestamptz not null default now(),
    unique (campana_id, numero)
);
create index if not exists idx_guardianes_nivel_leccion on public.guardianes_nivel(leccion_id);

-- ---------- 3. Enemigos
create table if not exists public.guardianes_enemy (
    id               uuid primary key default gen_random_uuid(),
    nombre           text not null,
    hp               smallint not null check (hp > 0),
    dano             smallint not null,
    velocidad        smallint not null default 60,
    icono            text not null default '💀',
    xp_recompensa    smallint not null default 0,
    monedas_recompensa smallint not null default 0,
    dificultad_min   numeric(4,2) not null default 0.5,
    dificultad_max   numeric(4,2) not null default 5.0,
    creado_en        timestamptz not null default now()
);
create index if not exists idx_guardianes_enemy_dif on public.guardianes_enemy(dificultad_min, dificultad_max);

-- ---------- 4. Hordas por nivel
create table if not exists public.guardianes_nivel_horda (
    id               uuid primary key default gen_random_uuid(),
    nivel_id         uuid not null references public.guardianes_nivel(id) on delete cascade,
    numero           smallint not null check (numero >= 1),
    total_enemigos   smallint not null default 8 check (total_enemigos > 0),
    spawn_cada_ms    smallint not null default 800,
    tipo_enemy_id    uuid not null references public.guardianes_enemy(id) on delete restrict,
    multiplicador    numeric(4,2) not null default 1.0,
    unique (nivel_id, numero)
);
create index if not exists idx_guardianes_nivel_horda_idx on public.guardianes_nivel_horda(nivel_id);

-- ---------- 5. Preguntas por competencia
create table if not exists public.guardianes_pregunta (
    id               uuid primary key default gen_random_uuid(),
    nivel_id         uuid not null references public.guardianes_nivel(id) on delete cascade,
    tema             text not null,
    competencia      text not null,
    tipo             text not null check (tipo in ('opcion_multiple','seleccion_multiple','verdadero_falso','completar_codigo','ordenar','corregir_codigo','prediccion')),
    dificultad       text not null check (dificultad in ('facil','media','dificil')),
    enunciado        text not null,
    opciones         jsonb not null default '{}',
    correcta         text not null,
    explicacion      text not null,
    pista            text not null default '',
    eje_minimo       numeric(4,2) not null default 0.50,
    estado           text not null default 'validada' check (estado in ('borrador','validada','archivada')),
    creado_en        timestamptz not null default now()
);
create index if not exists idx_guardianes_pregunta_nivel on public.guardianes_pregunta(nivel_id, dificultad);

-- ---------- 6. Intentos
create table if not exists public.guardianes_intento (
    id               uuid primary key default gen_random_uuid(),
    estudiante_id    uuid not null references public.perfil(id) on delete cascade,
    nivel_id         uuid not null references public.guardianes_nivel(id) on delete cascade,
    estado           text not null check (estado in ('en_curso','fallado','completado','abandonado')),
    hordas_completadas smallint not null default 0,
    jefe_derrotado   boolean not null default false,
    puntaje          smallint not null default 0,
    precision        numeric(5,2) not null default 0,
    tiempo_segundos  bigint not null default 0,
    xp_recibido      smallint not null default 0,
    monedas_recibidas smallint not null default 0,
    iniciado_en      timestamptz not null default now(),
    terminado_en     timestamptz,
    creado_en        timestamptz not null default now()
);
create index if not exists idx_guardianes_intento_est on public.guardianes_intento (estudiante_id, creado_en desc);
create index if not exists idx_guardianes_intento_nivel on public.guardianes_intento (nivel_id);

-- ---------- 7. Respuestas enviadas
create table if not exists public.guardianes_respuesta (
    id               uuid primary key default gen_random_uuid(),
    intento_id       uuid not null references public.guardianes_intento(id) on delete cascade,
    pregunta_id      uuid not null references public.guardianes_pregunta(id) on delete restrict,
    respuesta        text,
    es_correcta      boolean not null default false,
    duracion_ms      integer not null default 0,
    respondido_en    timestamptz not null default now(),
    creado_en        timestamptz not null default now()
);
create index if not exists idx_guardianes_respuesta_intento on public.guardianes_respuesta (intento_id);

-- ---------- 8. Eventos / auditoría
create table if not exists public.guardianes_evento (
    id               uuid primary key default gen_random_uuid(),
    estudiante_id    uuid not null references public.perfil(id) on delete cascade,
    intento_id       uuid references public.guardianes_intento(id) on delete set null,
    evento           text not null,
    datos            jsonb not null default '{}',
    creado_en        timestamptz not null default now()
);
create index if not exists idx_guardianes_evento_est on public.guardianes_evento (estudiante_id, creado_en desc);

-- ---------- 9. Seed: configuración y enemigos base
insert into public.guardianes_config (slug, nombre, cursos_permitidos)
values ('guardianes','Guardianes del Conocimiento', array['ab8e59ef-ab9f-40eb-8f31-790ac7edba4a'::uuid])
on conflict (slug) do nothing;

insert into public.guardianes_campana (config_id, titulo, descripcion)
select id, 'Guardianes del Conocimiento',
       'Supervivencia por hordas académicas: derrota oleadas de enemigos mientras resuelves desafíos del curso Principios de Algoritmos.'
  from public.guardianes_config
 where slug = 'guardianes'
   and not exists (select 1 from public.guardianes_campana c join public.guardianes_config cf on cf.id = c.config_id where cf.slug='guardianes');

-- Nivel a partir de cada lekctione
insert into public.guardianes_nivel
    (campana_id, numero, titulo, descripcion, leccion_id, hordas_totales,
     enemigos_inicial, xp_recompensa, monedas_recompensa, objetivo_derrotado_cantidad)
select c.id,
       row_number() over (order by u.numero, m.numero, l.numero)::smallint as numero,
       l.titulo,
       m.titulo as modulo_titulo,
       l.id as leccion_id,
       case when row_number() over (order by u.numero, m.numero, l.numero) = 18 then 6
            when row_number() over (order by u.numero, m.numero, l.numero) in (6, 12) then 4
            else 3 end as hordas_totales,
       case when row_number() over (order by u.numero, m.numero, l.numero) = 18 then 10
            when row_number() over (order by u.numero, m.numero, l.numero) in (6, 12) then 8
            else 6 end as enemigos_inicial,
       l.xp_otorgado as xp_recompensa,
       case when row_number() over (order by u.numero, m.numero, l.numero) = 18 then 30
            when row_number() over (order by u.numero, m.numero, l.numero) = 17 then 25
            when row_number() over (order by u.numero, m.numero, l.numero) in (6, 12) then 15
            else 10 end as monedas_recompensa,
       case when row_number() over (order by u.numero, m.numero, l.numero) = 18 then 120
            when row_number() over (order by u.numero, m.numero, l.numero) in (6, 12) then 80
            else 60 end as objetivo_derrotado_cantidad
  from public.leccion l
  join public.modulo m on m.id = l.modulo_id
  join public.unidad u on u.id = m.unidad_id
  join public.guardianes_campana c on c.config_id = (select id from public.guardianes_config where slug='guardianes')
 where u.curso_id = 'ab8e59ef-ab9f-40eb-8f31-790ac7edba4a'
   and not exists (select 1 from public.guardianes_nivel gn where gn.leccion_id = l.id and gn.campana_id = c.id);

-- Enemigos básicos
insert into public.guardianes_enemy (nombre, hp, dano, velocidad, icono, xp_recompensa, monedas_recompensa, dificultad_min, dificultad_max)
values
    ('Espinita', 20, 5, 90, '🐀', 5, 1, 0.5, 2.5),
    ('Bug Invalido', 40, 8, 75, '🐛', 7, 1, 0.0, 3.0),
    ('Excepcion', 60, 10, 55, '⚡', 10, 2, 1.0, 4.0),
    ('Furia Lógica', 120, 15, 45, '👹', 18, 4, 2.5, 5.0),
    ('Fragmento', 160, 220, 40, '💥', 30, 6, 3.5, 5.0)
on conflict do nothing;

-- Cobertura de hordas para todos los niveles
do $$
declare
    rec record;
    h   integer;
begin
    for rec in select id from public.guardianes_nivel loop
        for h in 1..3 loop
            insert into public.guardianes_nivel_horda (nivel_id, numero, total_enemigos, spawn_cada_ms, tipo_enemy_id, multiplicador)
            select rec.id, h, 6 + h * 4, 800 / h, e.id, 1.0 + (h - 1) * 0.3
            from public.guardianes_enemy e
            where e.nombre = case h when 1 then 'Espinita' when 2 then 'Bug Invalido' else 'Excepcion' end;
        end loop;
    end loop;
end $$;

commit;
