# Estrategia de despliegue — Vercel (frontend) y Render/Railway (backend)

## 1. Distribución de responsabilidades

```
┌─────────────────────┐        ┌──────────────────────┐        ┌─────────────────┐
│ VERCEL              │        │ RENDER / RAILWAY     │        │ SUPABASE CLOUD  │
│                     │  HTTPS │                      │  JDBC  │                 │
│ frontend/           │◄──────►│ backend/             │◄──────►│ PostgreSQL      │
│   inkaquest-web     │  REST  │   inkaquest-api      │  SQL   │ Auth + Storage  │
│                     │        │                      │        │                 │
│ Archivos estáticos  │        │ Contenedor Java 25   │        │ Gestionado      │
└─────────────────────┘        └──────────────────────┘        └─────────────────┘
```

**Vercel NO aloja Spring Boot.** El frontend Angular se publica como
aplicación estática en Vercel; el backend es una aplicación Java con estado
que se despliega en Render, Railway u otro proveedor compatible con
contenedores Java. Ambos se comunican por **HTTPS** en dominios distintos.

## 2. Frontend en Vercel

### 2.1 Configuración del repositorio

En el panel de Vercel, al conectar el repositorio:

| Campo | Valor |
|---|---|
| Framework Preset | Other |
| Root Directory | *(raíz del repositorio)* |
| Build Command | *(el de `vercel.json`)* |
| Output Directory | *(el de `vercel.json`)* |
| Install Command | *(el de `vercel.json`)* |

Los valores vienen de `vercel.json`, de modo que no hay que duplicarlos en el
panel:

```json
{
  "buildCommand": "cd frontend/inkaquest-web && npm ci && npm run build",
  "outputDirectory": "frontend/inkaquest-web/dist/inkaquest-web/browser",
  "installCommand": "cd frontend/inkaquest-web && npm ci"
}
```

### 2.2 Carpeta de salida

Verificada con un build real de Angular 22:

```
frontend/inkaquest-web/dist/inkaquest-web/
├── 3rdpartylicenses.txt
└── browser/
    ├── index.html
    ├── main-<hash>.js
    ├── chunk-<hash>.js
    ├── styles-<hash>.css
    └── favicon.ico
```

El builder `@angular/build:application` genera el navegador en el subdirectorio
`browser/`. Por eso `outputDirectory` apunta a `.../dist/inkaquest-web/browser`
y **no** a `.../dist/inkaquest-web`.

### 2.3 Reescrituras para Angular Router

Angular es una SPA: las rutas como `/cursos/42` no existen como archivos, el
router las resuelve en el cliente. Vercel debe servir `index.html` en esos
casos.

```json
"rewrites": [
  {
    "source": "/((?!api/|assets/|.*\\.[a-zA-Z0-9]+$).*)",
    "destination": "/index.html"
  }
]
```

La expresión excluye tres casos para que no se rompan:

| Patrón excluido | Motivo |
|---|---|
| `api/` | Rutas de la API (no las sirve Vercel, pero no deben redirigirse) |
| `assets/` | Recursos con hash; deben servirse tal cual |
| `.*\.[a-zA-Z0-9]+$` | Cualquier archivo con extensión (imágenes, JS, CSS) |

Sin esas exclusiones, un `.js` o una imagen se devolverían como `index.html`.

### 2.4 Variables de entorno en Vercel

Se configuran en **Settings → Environment Variables**:

| Variable | Entorno | Descripción |
|---|---|---|
| `VITE_API_URL` | Production / Preview | URL del backend, con el sufijo `/api/v1` |
| `VITE_SUPABASE_URL` | Production / Preview | URL del proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Production / Preview | Clave **pública** |

Las variables `VITE_*` se incrustan en el bundle **en tiempo de build**: si
cambia el valor, hay que volver a desplegar.

> No añadir `SUPABASE_SERVICE_ROLE_KEY` ni ninguna clave secreta: quedarían
> visibles en el JavaScript del navegador.

### 2.5 Despliegue

El despliegue se activa con un *push* a la rama conectada, o de forma manual
desde el panel. Vercel ejecuta:

```
cd frontend/inkaquest-web && npm ci && npm run build
```

y publica `frontend/inkaquest-web/dist/inkaquest-web/browser`.

## 3. Backend en Render

### 3.1 Configuración

`infra/deployment/render.yaml` es un *blueprint* listo para usar:

```yaml
services:
  - type: web
    name: inkaquest-api
    runtime: docker
    dockerfilePath: ./infra/docker/Dockerfile.backend
    dockerContext: .
    plan: starter
    region: oregon
    healthCheckPath: /actuator/health
```

Despliegue desde el panel o con:

```bash
render blueprint launch
```

### 3.2 Variables de entorno

Definidas en el panel de Render (`sync: false` en el blueprint significa
"configurar a mano"):

| Variable | Secreto |
|---|---|
| `SPRING_PROFILES_ACTIVE=prod` | No |
| `SERVER_PORT=8080` | No |
| `DB_URL` | No |
| `DB_USERNAME` | No |
| `DB_PASSWORD` | **Sí** |
| `SUPABASE_URL` | No |
| `SUPABASE_ANON_KEY` | No |
| `SUPABASE_SERVICE_ROLE_KEY` | **Sí** |
| `SUPABASE_JWT_SECRET` | **Sí** |
| `APP_CORS_ALLOWED_ORIGINS` | No |

> `APP_CORS_ALLOWED_ORIGINS` debe incluir el dominio de Vercel, por ejemplo
> `https://tu-app.vercel.app`. Sin esto, el navegador bloqueará las llamadas
> del frontend al backend.

### 3.3 Alternativa con Railway

`infra/deployment/railway.json` define el build con Dockerfile y la sonda de
salud. En el panel de Railway se crea un servicio desde el repositorio y se
definen las mismas variables de entorno.

### 3.4 Consideraciones del pool de conexiones

Render y Railway limitan las conexiones simultáneas a la base de datos. Con
`maximum-pool-size: 10` y varias réplicas se puede agotar el límite de
Supabase. Opciones:

- Reducir el pool a 5 en el plan gratuito.
- Usar el pooler de Supabase en modo *session*:

```
DB_URL=jdbc:postgresql://<ref>.pooler.supabase.com:5432/postgres?sslmode=require
```

## 4. Conexión frontend ↔ backend

```
VITE_API_URL=https://inkaquest-api.onrender.com/api/v1
```

El frontend antepone esta URL a todas las llamadas:

```ts
const url = `${environment.apiUrl}/cursos`;
```

Los controladores del backend publican sus rutas con el prefijo `/api/v1`; el contexto del servidor es `/`. Los endpoints de Actuator y OpenAPI quedan fuera de ese prefijo.

Flujo completo:

```
Angular  ──GET https://inkaquest-api.onrender.com/api/v1/cursos──▶  Spring Boot
         ◀──200 {"success": true, "message": "...", "data": {...}}─────
```

Sobre HTTPS en el plan gratuito de Render: el servicio se despierta con la
primera petición tras un periodo de inactividad, por lo que la primera
respuesta puede tardar unos segundos. Para evitarlo en el flujo crítico de
autenticación, conviene usar un plan con SwapelAutomático o activar un
*ping* programado.

## 5. Migraciones de base de datos

Las migraciones **no** se ejecutan automáticamente en el despliegue del
backend: el esquema se gestiona de forma explícita y controlada.

```bash
supabase link --project-ref <PROJECT_REF>
supabase db push
```

El orden recomendado es:

1. Aplicar las migraciones en Supabase.
2. Desplegar el backend.
3. Desplegar el frontend.

## 6. Cabeceras y caché

`vercel.json` define las cabeceras defensivas y la caché inmutable de los
assets con hash:

```json
{
  "source": "/assets/(.*)",
  "headers": [
    { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
  ]
}
```

El nombre con hash cambia en cada build, por lo que la caché puede ser
eterna. `index.html` no debe cachearse de forma agresiva, porque apunta a los
assets con hash del build actual.

## 7. Lista de verificación previa al despliegue

- [ ] `npm run lint` y `npm run build` correctos en el frontend.
- [ ] `mvn clean verify` correcto en el backend.
- [ ] `VITE_API_URL` apunta al backend desplegado y termina en `/api/v1`.
- [ ] `APP_CORS_ALLOWED_ORIGINS` incluye el dominio del frontend.
- [ ] Migraciones aplicadas en Supabase.
- [ ] Sin secretos en el repositorio ni en las variables `VITE_*`.
- [ ] El endpoint `/actuator/health` responde `UP`.
- [ ] La documentación OpenAPI está accesible.

## 8. Estado actual

**No se ha realizado ningún despliegue.** Vercel, Render, Railway y Supabase
siguen sin configurar. Los archivos de esta carpeta dejan preparada la
configuración; los valores concretos (tokens, claves, dominios) se
introducirán en el momento del despliegue.
