# Configuración de Supabase — InkaQuest

Configuración de los servicios de datos de InkaQuest.

## 1. Componentes de Supabase

| Servicio | Función | Uso en InkaQuest |
|---|---|---|
| PostgreSQL | Base de datos relacional | Fuente de verdad de los datos |
| Auth | Identidad y JWT | Login, registro, recuperación, OAuth, OTP |
| Storage | Archivos | Avatares, materiales de curso, entregas |
| Realtime | Suscripciones en vivo | Progreso y notificaciones en tiempo real |
| Edge Functions | Lógica en Deno | Acciones junto a los datos |

## 2. Estructura del proyecto

```
supabase/
├── migrations/   # Cambios de esquema versionados
├── seed/         # Datos iniciales (seed.sql)
├── functions/    # Edge Functions
├── config.toml   # Configuración del CLI
└── README.md     # Guía rápida de conexión
```

## 3. Enlace con el proyecto

```bash
npm install -g supabase
supabase login
supabase link --project-ref <PROJECT_REF>
```

El `<PROJECT_REF>` está en **Supabase Dashboard → Project Settings → API**.
No es un secreto, pero cada entorno debe apuntar a su propio proyecto.

Comandos habituales:

```bash
supabase db push           # aplica las migraciones pendientes
supabase migration list    # estado de las migraciones
supabase db diff -f <nombre>  # genera una migración desde los cambios locales
supabase functions deploy <fn>
```

## 4. Migraciones

Convenciones obligatorias:

- Nombre: `YYYYMMDDHHMMSS_descripcion_corta.sql`.
- El orden de aplicación es lexicográfico por nombre.
- Una migración ya aplicada **no se edita**: se crea otra nueva.
- Cada migración debe ser idempotente (`IF NOT EXISTS`, `DROP ... IF EXISTS`).
- Las tablas se crean **con RLS habilitado desde el principio**.

```sql
-- Ejemplo de estructura base
create table if not exists public.ejemplo (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz not null default now()
);

alter table public.ejemplo enable row level security;
```

> En esta fase la carpeta `migrations/` está vacía a propósito: el esquema
> definitivo se diseñará más adelante, y hacerlo ahora fijaría decisiones que
> aún pueden cambiar.

## 5. Row Level Security (RLS)

RLS es la **capa de seguridad principal** de la base de datos. Activa o desactiva
el acceso fila a fila en función del usuario autenticado, con independencia de
la aplicación que consulte los datos.

```sql
alter table public.ejemplo enable row level security;

create policy "usuarios leen solo sus filas"
    on public.ejemplo
    for select
    to authenticated
    using (auth.uid() = user_id);
```

Puntos clave:

- `auth.uid()` devuelve el UUID del usuario de la sesión actual.
- `to authenticated` limita la política a usuarios con sesión válida.
- Sin políticas, el acceso queda **denegado** por defecto: es un fallo seguro.
- Las tablas administrativas se mantienen fuera del alcance del cliente.

## 6. Autenticación (Supabase Auth)

- El frontend obtiene una sesión con `supabase.auth.signInWithPassword()`,
  `signUp()` o un proveedor OAuth.
- La sesión emite un **JWT** que el frontend envía como `Authorization: Bearer <token>`.
- El backend valida ese JWT con el secreto del proyecto
  (`SUPABASE_JWT_SECRET`).
- La `anon` / `publishable` key es pública: puede ir en el bundle.
- La `service_role` es secreta: solo en el backend.

Configuración en `supabase/config.toml`:

```toml
[auth]
enabled = true
site_url = "http://localhost:4200"
additional_redirect_urls = ["http://localhost:4200"]
jwt_expiry = 3600
enable_refresh_token_rotation = true
refresh_token_reuse_interval = 10
```

Los proveedores OAuth (Google, GitHub) se activan desde el panel de Supabase;
sus URLs de redirección deben apuntar al frontend desplegado.

## 7. Storage

```toml
[storage]
enabled = true
file_size_limit = "50MiB"
```

Los buckets se crean desde el panel o por SQL. Cada bucket define sus propias
políticas de acceso, siguiendo el mismo patrón que las tablas: el usuario
accede a sus propios archivos mediante `auth.uid()`.

## 8. Edge Functions

```
supabase/functions/
└── <nombre-funcion>/
    ├── index.ts      # Handler: (req: Request) => Response
    └── _shared/      # Código común (código de errores, utilidades)
```

Reglas:

- `verify_jwt = true` en `config.toml` (ya configurado para las funciones
  declaradas).
- Los secretos se inyectan con `supabase secrets set --env-file .env`.
- Código TypeScript ejecutado en Deno (no Node).

```bash
supabase functions deploy <nombre-funcion>
supabase functions list
```

## 9. Variables de entorno

| Variable | Consumidor | Secreto |
|---|---|---|
| `SUPABASE_URL` | Backend y frontend | No |
| `SUPABASE_ANON_KEY` / `VITE_SUPABASE_ANON_KEY` | Frontend y backend | No |
| `SUPABASE_PUBLISHABLE_KEY` | Frontend | No |
| `SUPABASE_SERVICE_ROLE_KEY` | **Solo backend** | **Sí** |
| `SUPABASE_JWT_SECRET` | **Solo backend** | **Sí** |
| `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` | **Solo backend** | La contraseña |

Definición de secretos para las funciones:

```bash
supabase secrets set --env-file .env.functions
```

## 10. Variables de conexión

Supabase expone PostgreSQL en el puerto 5432 con dos nombres de host:

| Host | Uso |
|---|---|
| `db.<ref>.supabase.co` | Conexión directa (IPv6, requiere `sslmode=require`) |
| `<ref>.pooler.supabase.com` | Pooler de transactions o session |

Para el backend, se recomienda el **pooler** en modo *session* cuando la
plataforma lo soporte, ya que las conexiones IPv6 directas fallan en muchos
proveedores de despliegue.

```bash
DB_URL=jdbc:postgresql://db.<ref>.supabase.co:5432/postgres?sslmode=require
```

## 11. Seed

```toml
[db.seed]
enabled = true
sql_paths = ["./supabase/seed/seed.sql"]
```

`supabase db reset` aplica las migraciones y luego el seed. En entornos
externos, el seed se aplica manualmente:

```bash
psql "$DB_URL" -f supabase/seed/seed.sql
```

El seed **no** define el esquema: solo inserta datos.

## 12. Desarrollo local

```bash
supabase start      # requiere Docker Desktop
supabase status
supabase db reset
```

El stack local replica Auth, Storage, Realtime y las funciones, pero la base
remota sigue siendo la fuente de verdad.

## 13. Copias de seguridad

Para respaldar el proyecto:

```bash
supabase db dump --db-url "$DB_URL" -f backup.sql
```

Conviene versionar la política de retención: se configuran en las políticas de
 ciclo de vida del bucket de destino.

## 14. Checklist antes de una migración

- [ ] El archivo sigue el patrón `YYYYMMDDHHMMSS_descripcion.sql`.
- [ ] La migración es idempotente.
- [ ] Las tablas nuevas tienen `ENABLE ROW LEVEL SECURITY`.
- [ ] Existen políticas para `authenticated` (y `anon` si aplica).
- [ ] No se inserts datos sensibles reales.
- [ ] `supabase db push` se ejecutó y el estado es correcto.
