# Arquitectura general — InkaQuest

## 1. Propósito

InkaQuest es una plataforma LMS (Learning Management System) gamificada para el
curso de **Principios de Algoritmos**. Esta documento describe la arquitectura
de la plataforma y cómo se relacionan sus tres componentes independientes.

> **Estado actual:** la plataforma se encuentra en fase de *estructura base*.
> Los proyectos de frontend y backend compilan y están configurados, pero no
> contienen todavía módulos de negocio, interfaces completas ni tablas
> definitivas.

## 2. Componentes

```
                        ┌─────────────────────────────┐
                        │   Navegador del usuario     │
                        │   (Angular 22 · SPA)        │
                        └──────────┬──────────────────┘
                                   │  HTTPS
                ┌──────────────────┴───────────────────┐
                │                                      │
    ┌───────────▼────────────┐          ┌──────────────▼──────────────┐
    │  Vercel                │          │  Render / Railway           │
    │  frontend/             │          │  backend/                   │
    │    inkaquest-web       │          │    inkaquest-api            │
    │  (estático + CDN)      │          │  (Spring Boot 3.5 · J 25)   │
    └───────────┬────────────┘          └──────────────┬──────────────┘
                │                                      │
                │  HTTPS (REST + Bearer JWT)           │  JDBC / SQL
                │  ───────────────────────────────────►│
                │                                      │
                │                          ┌───────────▼──────────────┐
                └─────────────────────────►│  Supabase Cloud           │
                     REST / PostgREST      │  ├─ PostgreSQL 17         │
                     (datos del cliente)   │  ├─ Auth (JWT)            │
                                          │  ├─ Storage (archivos)    │
                                          │  └─ Edge Functions (Deno) │
                                          └──────────────────────────┘
```

### 2.1 Frontend — `frontend/inkaquest-web`

Angular 22 en modo **standalone** (sin `NgModule`), TypeScript en modo estricto
y Tailwind CSS 4 para el estilo.

Responsabilidades:
- Interfaz de usuario y navegación (Angular Router con lazy loading).
- Autenticación contra **Supabase Auth** (email/contraseña, OAuth, OTP).
- Operaciones CRUD directas sobre tablas expuestas por PostgREST, siempre
  bajo las políticas RLS del usuario.
- Invocación de la API REST de Spring Boot para la lógica de negocio que
  requiere validación en servidor (pagos, certificados, cálculo de progreso).
- Persistencia local de la sesión y estado de interfaz.

### 2.2 Backend — `backend/inkaquest-api`

Spring Boot 3.5 sobre Java 25, empaquetado con Maven.

Responsabilidades:
- API REST bajo el prefijo `/api`, con contrato de respuesta uniforme
  (`ApiResponse`).
- Orquestación de lógica de negocio y validaciones que no deben residir en el
  cliente.
- Integración con servicios externos (pasarelas de pago, emisión de
  certificados).
- Acceso a PostgreSQL mediante **Spring Data JPA / Hibernate**.
- Emisión de la documentación OpenAPI y métricas de Actuator.

### 2.3 Supabase — `supabase/`

Plataforma administrada que aporta los servicios de datos.

Responsabilidades:
- **PostgreSQL**: base de datos relacional, con el esquema definido por
  migraciones SQL versionadas en `supabase/migrations/`.
- **Auth**: emisión y validación de JWT, gestión de usuarios y sesiones.
- **Storage**: archivos de usuario (avatares, materiales de curso).
- **Realtime**: actualizaciones en vivo (opcional).
- **Edge Functions**: lógica próxima a los datos, escrita en Deno.

## 3. Flujo de datos

### 3.1 Lectura de datos

```
Angular  --REST (PostgREST, con JWT del usuario)-->  Supabase
                                                       |
                                                       +-- RLS filtra por auth.uid()
                                                       +-- devuelve filas
```

El frontend puede leer directamente lo que RLS le permite. La clave que viaja
en el navegador es **pública** (`anon` / `publishable`); el aislamiento lo
garantiza RLS, no la clave.

### 3.2 Escritura de datos

Las escrituras sensibles (pagos, certificados, progresos derivados) pasan por
el backend:

```
Angular  --HTTPS + Bearer JWT-->  Spring Boot
                                     |
                                     +-- valida el JWT (Supabase JWT secret)
                                     +-- aplica reglas de negocio
                                     +-- escribe en PostgreSQL
                                            (service_role: salta RLS de forma controlada)
```

El backend usa la `service_role` **solo en servidor**. Esa clave nunca se
entrega al navegador.

### 3.3 Almacenamiento de archivos

```
Angular  --firma/URL firmada-->  Supabase Storage
```

Los buckets se configuran con políticas propias; el backend genera URLs
firmadas cuando corresponde.

## 4. Decisiones de arquitectura

| Decisión | Motivo |
|---|---|
| Monorepo con tres proyectos separados | Despliegue independiente de cada capa; el frontend es estático y el backend es un servicio con estado. |
| Angular standalone + lazy loading | Arranque más rápido y acoplamiento mínimo entre features. |
| TypeScript estricto | Detecta errores en compilación, no en producción. |
| Spring Boot modular por capas | Cada módulo de negocio es autónomo y testeable. |
| Contrato `ApiResponse` uniforme | El frontend procesa todas las respuestas igual. |
| RLS como capa de seguridad principal | La base se protege aunque alguien omita el backend. |
| Sin lógica de negocio duplicada | La lógica sensible vive en el backend; el frontend solo presenta. |

## 5. Seguridad en alto nivel

- **Autenticación**: Supabase Auth emite JWT; el backend los valida con el
  secreto JWT del proyecto.
- **Autorización**: RLS en PostgreSQL para el acceso directo del frontend;
  reglas de negocio en el backend para el resto.
- **Transporte**: HTTPS obligatorio entre frontend, backend y Supabase.
- **CORS**: el backend solo acepta los orígenes del frontend configurados en
  `APP_CORS_ALLOWED_ORIGINS`.
- **Secretos**: solo en variables de entorno del proveedor de despliegue; nunca
  en el repositorio ni en el bundle del navegador.

El detalle está en [MODELO-SEGURIDAD.md](../seguridad/MODELO-SEGURIDAD.md).

## 6. Ciclo de vida de una petición

1. El usuario interactúa con la SPA de Angular.
2. Angular adjunta el JWT de Supabase en la cabecera `Authorization`.
3. La petición llega por HTTPS al backend (o directamente a Supabase).
4. Spring Security valida el token; el filtro de CORS comprueba el origen.
5. El controlador delega en el servicio del módulo correspondiente.
6. El servicio valida la lógica de negocio y accede al repositorio JPA.
7. La respuesta se serializa como `ApiResponse<T>` y vuelve al cliente.

## 7. Restricciones operativas

- **Vercel no aloja Spring Boot.** El backend se despliega como aplicación Java
  en Render, Railway u otro proveedor compatible. Vercel sirve el frontend.
- El frontend y el backend se comunican por **HTTPS** en dominios distintos;
  por eso CORS es obligatorio y está parametrizado.
- Ningún despliegue se ha realizado en esta fase.

## 8. Próximas fases

1. Diseño del esquema de datos y primeras migraciones.
2. Autenticación completa (filtro JWT + guardas de rol).
3. Módulos de negocio y sus interfaces.
4. Despliegue en Vercel y Render/Railway.
