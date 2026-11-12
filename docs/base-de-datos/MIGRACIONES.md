# Migraciones — InkaQuest

Orden de aplicación, contenido, verificación y reversión de las migraciones.

## 1. Las 10 migraciones

| # | Archivo | Contenido | Depende de |
|---|---|---|---|
| 0000 | `20260101000000_extensiones_tipos_funciones.sql` | Extensiones (pgcrypto, pg_trgm, vector), 38 tipos ENUM, funciones de contexto y de autorización | — |
| 0001 | `20260101000100_identidad_academico.sql` | Módulo A (identidad) y B (académico) | 0000 |
| 0002 | `20260101000200_matriculas_pagos.sql` | Módulo C (matrículas) y D (pagos) | 0001 |
| 0003 | `20260101000300_gamificacion.sql` | Módulo I (gamificación) | 0002 |
| 0004 | `20260101000400_progreso_evaluaciones.sql` | Módulo E (progreso) y F (evaluaciones) | 0003 |
| 0005 | `20260101000500_retos_minijuegos.sql` | Módulo G (retos) y H (minijuegos) | 0004 |
| 0006 | `20260101000600_certificados_soporte_chatbot_auditoria.sql` | Módulos J, K, L y M | 0005 |
| 0007 | `20260101000700_rls_politicas.sql` | Habilitación de RLS, 209 políticas, permisos por rol | 0000–0006 |
| 0008 | `20260101000800_storage.sql` | 6 buckets de Storage y sus políticas | 0007 |
| 0009 | `20260101000900_seguridad_backend_datos_referencia.sql` | Rol del backend, permisos de contexto, datos de referencia | 0008 |
| 0010 | `20260101001000_rls_permisos.sql` | Políticas RLS para `permiso` y `rol_permiso` | 0007 |
| 0011 | `20260101001100_endurecer_permisos.sql` | Revoca a `anon` los permisos heredados de los default privileges de Supabase | 0010 |
| 0012 | `20260101001200_correccion_permisos.sql` | Corrige permisos residuales de escritura en el catálogo | 0011 |

**Orden imposed por dependencias reales**:

- 0000 antes que 0001: `app_user_role()` consulta `public.perfil`.
- 0003 (gamificación) antes que 0004 (progreso): `fn_registrar_completado_leccion()` usa `transaccion_xp` y `regla_progresion`.
- 0007 al final: habilita RLS sobre tablas que ya existen.

## 2. Cómo aplicarlas

### Opción A — Supabase CLI (recomendada)

```bash
# 1. Autenticarse (abre el navegador)
supabase login

# 2. Enlazar el proyecto
supabase link --project-ref <PROJECT_REF>

# 3. Aplicar
supabase db push
```

### Opción B — SQL Editor (manual)

Supabase Dashboard → **SQL Editor** → **New query**. Abre cada archivo de
`supabase/migrations/` en orden y pulsa **Run**.

> ⚠️ **Aplica el orden exacto.** El SQL Editor no tiene control de
> dependencias: si ejecutas la 0007 antes que la 0001, fallará.

### Opción C — psql

```bash
for f in supabase/migrations/*.sql; do
  echo "Aplicando $f"
  psql "$DB_URL" -v ON_ERROR_STOP=1 -f "$f" || break
done
```

`-v ON_ERROR_STOP=1` detiene la ejecución en el primer error: evita aplicar
las siguientes migraciones sobre un estado inconsistente.

## 3. Idempotencia

Todas las migraciones son **reaplicables**:

| Elemento | Técnica |
|---|---|
| Tablas | `create table if not exists` |
| Índices | `create index if not exists` |
| Tipos ENUM | Bloque `DO ... exception when duplicate_object then null` |
| Funciones | `create or replace` |
| Triggers | `drop trigger if exists` antes de crear |
| Políticas | `drop policy if exists` antes de crear |
| Buckets | `insert ... on conflict (id) do update` |
| Datos de referencia | `insert ... on conflict do nothing` |

Ejecutar el conjunto completo dos veces no produce errores ni duplica datos.

## 4. Verificación

Después de aplicar, ejecuta `supabase/tests/verificar_esquema.sql` en el SQL
Editor. Comprueba:

| Verificación | Valor esperado |
|---|---|
| Tablas en `public` | 121 |
| Políticas RLS | ≥ 205 |
| Tablas con RLS habilitado | 121 (todas) |
| Funciones | ≥ 57 |
| Triggers | ≥ 64 |
| Índices | ≥ 311 |
| Tipos ENUM | 38 |
| Claves foráneas | ≥ 206 |
| Buckets de Storage | 6 |
| Tablas con RLS pero **sin** política | **0** |
| Funciones DEFINER sin `search_path` seguro | **0** |
| Filas huérfanas | **0** |

El script termina con un veredicto:

```
BASE DE DATOS INKAQUEST: OK - esquema aplicado y verificado
```

## 5. Pruebas funcionales

`supabase/tests/pruebas_rls.sql` ejecuta **46 pruebas** de seguridad con
usuarios sintéticos (`test_*@inkaquest.test`):

```bash
psql "$DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/pruebas_rls.sql
```

| Resultado esperado | Significado |
|---|---|
| `total = 46, pasan = 46, fallan = 0` | Todo correcto |

El script es **destructivo solo con sus propios datos de prueba**: limpia al
inicio lo que creó en ejecuciones anteriores y elimina la tabla auxiliar al
finalizar. **No toca datos reales.**

> En Supabase, el rol `service_role` ignora la RLS. Las pruebas usan
> `SET ROLE authenticated` / `SET ROLE anon` para ejercitar las políticas de
> verdad.

## 6. Estructura de una migración

```sql
-- 1. Encabezado: objetivo y dependencias
-- =============================================================================
-- MIGRACION 000X - Descripción
-- Depende de: 000Y
-- =============================================================================

-- 2. Extensiones (si aplica)
create extension if not exists pgcrypto;

-- 3. Tipos ENUM (idempotentes)
do $$ begin
    create type public.mi_estado as enum ('a', 'b');
exception when duplicate_object then null;
end $$;

-- 4. Tablas
create table if not exists public.mi_tabla (
    id        uuid primary key default gen_random_uuid(),
    estado    public.mi_estado not null default 'a',
    creado_en timestamptz not null default now()
);

-- 5. Índices
create index if not exists idx_mi_tabla_estado on public.mi_tabla (estado);

-- 6. Funciones
create or replace function public.fn_mi_funcion() returns void
language plpgsql security definer set search_path = '' as $$ ... $$;

-- 7. Triggers
drop trigger if exists trg_mi_trigger on public.mi_tabla;
create trigger trg_mi_trigger after insert on public.mi_tabla
    for each row execute function public.fn_mi_funcion();

-- 8. Comentario de cierre
```

## 7. Reglas para nuevas migraciones

1. **Nunca edites una migración aplicada.** Crea una nueva con el siguiente
   timestamp.
2. **Siempre `if not exists` / `or replace`** para mantener la idempotencia.
3. **Una migración, un módulo.** Si mezcla dominios, divídela.
4. **Nada de `DROP SCHEMA` ni `DROP TABLE`** para empezar de cero.
5. **Todo ENUM en la migración 0000** (o en una nueva, con bloque `DO`).
6. **RLS en la migración 0007** para las tablas nuevas, o en una nueva que
   vuelva a habilitarlo (el bloque es dinámico y cubre todas las tablas).
7. **Documenta el cambio** en este archivo y en
   [DICCIONARIO-DE-DATOS.md](DICCIONARIO-DE-DATOS.md).

## 8. Reversión

PostgreSQL no tiene rollback automático de DDL en PostgreSQL. Para revertir:

### 8.1 Reversión manual (recomendado)

```sql
-- Ejemplo: revertir la creación de una tabla
drop table if exists public.mi_tabla cascade;

-- Revertir una política
drop policy if exists pol_mi_politica on public.mi_tabla;

-- Revertir una función
drop function if exists public.fn_mi_funcion(uuid);
```

### 8.2 Recrear desde cero

Para un entorno de desarrollo:

```bash
supabase db reset
```

Esto borra los datos, aplica todas las migraciones desde el principio y
ejecuta el seed. **Solo en desarrollo**: nunca en producción.

### 8.3 Restaurar un respaldo

```bash
psql "$DB_URL" -f backup.sql
```

## 9. Historial de migraciones en Supabase

Supabase registra las migraciones aplicadas en la tabla
`supabase_migrations.schema_migrations`:

```sql
select version, name, statements
  from supabase_migrations.schema_migrations
 order by version;
```

`supabase db push` solo aplica lo que falta; `supabase db reset` rehace todo.

## 10. Errores frecuentes y soluciones

| Error | Causa | Solución |
|---|---|---|
| `no existe la relación "public.X"` | Migración aplicada fuera de orden | Aplicar en orden; en desarrollo, `supabase db reset` |
| `ya existe el tipo "public.X"` | ENUM sin protección | Usar el bloque `DO ... duplicate_object` |
| `la política ya existe` | Política sin `drop` | Añadir `drop policy if exists` |
| `insufficient privilege` al crear el rol | Requiere superusuario | Ejecutar como `postgres` (SQL Editor lo hace) |
| `syntax error` en un `DO $$` | Falta `$$` o el delimitador | Revisar que el bloque cierre correctamente |
| `no se pueden eliminar objetos` | `RESTRICT` en una FK | Revisar el orden de borrado de datos |

## 11. Verificación local sin Supabase

Para validar la sintaxis antes de tocar el proyecto real, se puede usar un
PostgreSQL local con un mock de los esquemas `auth` y `storage`:

```sql
create schema if not exists auth;
create schema if not exists storage;
create table if not exists auth.users (
    id uuid primary key default gen_random_uuid(),
    email text unique,
    raw_user_meta_data jsonb not null default '{}'::jsonb
);
create or replace function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'sub', '')::uuid;
$$;
create table if not exists storage.buckets (
    id text primary key, name text not null, public boolean not null default false,
    file_size_limit bigint, allowed_mime_types text[],
    created_at timestamptz not null default now(), updated_at timestamptz
);
create table if not exists storage.objects (
    id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets(id),
    name text not null, owner uuid,
    created_at timestamptz not null default now(), updated_at timestamptz
);
create or replace function storage.foldername(name text) returns text[]
language sql immutable as $$ select string_to_array(name, '/'); $$;
```

Esto permite ejecutar el conjunto completo de migraciones y detectar errores
de sintaxis o de dependencias **antes** de aplicarlas en Supabase.

> Este mock **no** es parte del proyecto: sirve únicamente para validación.
> El mock de `auth.uid()` debe incluir también `auth.jwt()` si alguna
> migración lo usa.
