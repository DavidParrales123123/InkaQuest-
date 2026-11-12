# Estructura del proyecto — InkaQuest

Descripción de cada carpeta del monorepo y de quién es responsable de su
contenido.

## 1. Vista general

```
.
├── frontend/
│   └── inkaquest-web/
├── backend/
│   └── inkaquest-api/
├── supabase/
│   ├── migrations/
│   ├── seed/
│   ├── functions/
│   └── config.toml
├── docs/
│   ├── arquitectura/
│   ├── frontend/
│   ├── backend/
│   ├── base-de-datos/
│   ├── seguridad/
│   └── despliegue/
├── infra/
│   ├── docker/
│   └── deployment/
├── scripts/
├── .env.example
├── .editorconfig
├── .gitignore
├── README.md
└── vercel.json
```

## 2. `frontend/inkaquest-web/`

Aplicación Angular. Es un proyecto autónomo: su `package.json`, `angular.json`
y `tsconfig.json` viven dentro de la carpeta, de modo que puede compilarse sin
depender de la raíz del repositorio.

```
frontend/inkaquest-web/
├── angular.json          # Configuración del workspace y de los targets
├── package.json          # Dependencias y scripts (lint, build, test)
├── tsconfig.json         # TypeScript estricto + alias de rutas
├── eslint.config.js      # ESLint flat config con angular-eslint
├── .postcssrc.json       # Plugin PostCSS de Tailwind v4
├── public/               # Archivos estáticos copiados al build
└── src/
    ├── main.ts           # Bootstrap de la aplicación
    ├── index.html        # Documento raíz
    ├── styles.scss       # Estilos globales SCSS
    ├── tailwind.css      # Entrada de Tailwind CSS
    ├── environments/     # environment.ts / environment.prod.ts
    └── app/
        ├── app.ts        # Componente raíz
        ├── app.config.ts # Providers de la aplicación
        ├── app.routes.ts # Tablero de rutas raíz
        ├── core/         # Singletons: HTTP, Supabase, auth, tokens
        ├── shared/       # Componentes y utilidades reutilizables
        ├── layout/       # Shell visual: header, sidebar, footer
        └── features/     # Módulos funcionales con lazy loading
```

**Reglas de dependencia:** `core` no depende de `features`; `shared` no depende
de `features`; los `features` no se importan entre sí.

## 3. `backend/inkaquest-api/`

API REST Spring Boot, organizada por capas y módulos.

```
backend/inkaquest-api/
├── pom.xml               # Maven: Spring Boot 3.5.16, Java 25
└── src/
    ├── main/
    │   ├── java/com/inkaquest/
    │   │   ├── InkaQuestApplication.java   # Punto de entrada
    │   │   ├── shared/                     # Común a todos los módulos
    │   │   │   ├── configuration/          # CORS, OpenAPI, propiedades
    │   │   │   ├── security/               # Spring Security
    │   │   │   ├── exception/              # Excepciones y manejador global
    │   │   │   └── response/               # ApiResponse<T>
    │   │   └── modules/                    # Módulos de negocio
    │   └── resources/
    │       ├── application.yml             # Configuración base
    │       └── application-local.yml       # Perfil de desarrollo
    └── test/java/com/inkaquest/            # Pruebas
```

**Reglas de dependencia:** los módulos no acceden a las entidades de otros
módulos; la comunicación se hace por interfaces de servicio. La capa `shared`
no conoce los módulos.

Cada módulo de negocio seguirá esta estructura:

```
modules/<modulo>/
├── controller/    # Endpoints REST
├── service/       # Lógica de negocio
├── repository/    # Repositorios Spring Data JPA
├── entity/        # Entidades JPA
└── dto/           # Objetos de entrada y salida
```

## 4. `supabase/`

```
supabase/
├── migrations/   # Cambios de esquema versionados (SQL)
├── seed/         # Datos iniciales (seed.sql)
├── functions/    # Edge Functions (Deno)
└── config.toml   # Configuración del CLI de Supabase
```

- `migrations/`: cada archivo sigue el patrón
  `YYYYMMDDHHMMSS_descripcion.sql` y se aplica una sola vez. Una migración ya
  aplicada no se edita: se crea una nueva.
- `seed/`: datos de referencia y de prueba. No define el esquema.
- `functions/`: una función por carpeta, con `_shared/` para el código común.

## 5. `docs/`

Documentación técnica, organizada por área.

| Carpeta | Contenido |
|---|---|
| `arquitectura/` | Visión de la plataforma y estructura del monorepo |
| `frontend/` | Configuración de Angular, TypeScript, Tailwind y ESLint |
| `backend/` | Configuración de Spring Boot, Java 25, Maven y perfiles |
| `base-de-datos/` | Supabase, PostgreSQL, migraciones, Auth y Storage |
| `seguridad/` | RLS, JWT, CORS y gestión de secretos |
| `despliegue/` | Estrategia de despliegue en Vercel y Render/Railway |

## 6. `infra/`

```
infra/
├── docker/
│   ├── Dockerfile.backend       # Build multi-stage del backend (JDK 25)
│   └── docker-compose.dev.yml   # PostgreSQL local para desarrollo
└── deployment/
    ├── render.yaml              # Blueprint para Render
    └── railway.json             # Configuración para Railway
```

`infra/` no contiene código de aplicación: solo empaquetado y despliegue.

## 7. `scripts/`

Utilidades de línea de comandos que orquestan tareas de varios proyectos.

| Script | Función |
|---|---|
| `verify-versions.ps1` | Comprueba Node, npm, Java, Maven y Docker |
| `build-all.ps1` | Compila frontend y backend en secuencia |
| `clean-all.ps1` | Elimina los artefactos de build |

## 8. Archivos de la raíz

| Archivo | Contenido |
|---|---|
| `vercel.json` | Build, carpeta de salida, reescrituras y cabeceras del frontend en Vercel |
| `.env.example` | Plantilla de variables de entorno, sin valores reales |
| `.editorconfig` | Formato uniforme de código entre editores |
| `.gitignore` | Exclusiones de Git (dependencias, builds, secretos) |
| `README.md` | Punto de entrada: stack, comandos y estado del proyecto |

## 9. Dónde va cada cosa nueva

| Se quiere añadir… | Va en… |
|---|---|
| Un módulo de negocio (API) | `backend/inkaquest-api/src/main/java/com/inkaquest/modules/<modulo>/` |
| Un componente reutilizable | `frontend/inkaquest-web/src/app/shared/` |
| Un servicio singleton | `frontend/inkaquest-web/src/app/core/` |
| Una pantalla de negocio | `frontend/inkaquest-web/src/app/features/<feature>/` |
| Un cambio de esquema | `supabase/migrations/<timestamp>_<descripcion>.sql` |
| Una Edge Function | `supabase/functions/<nombre>/index.ts` |
| Documentación | `docs/<area>/` |
| Configuración de despliegue | `infra/deployment/` |
