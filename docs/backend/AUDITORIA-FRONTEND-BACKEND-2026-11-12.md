# Auditoría técnica de InkaQuest

**Fecha:** 12 de noviembre de 2026  
**Alcance:** revisión estática del ZIP entregado. No se utilizaron credenciales ni se ejecutaron operaciones sobre el proyecto Supabase real.

## 1. Resumen ejecutivo

El proyecto no parte de cero. Contiene una aplicación Angular extensa, un backend Spring Boot modular y un conjunto importante de migraciones PostgreSQL/Supabase. La presencia de archivos no acredita que todos los flujos estén conectados ni que la aplicación esté lista para producción.

| Capa | Hallazgo |
|---|---|
| Frontend | Angular 22, componentes standalone, rutas lazy-loaded, guards, interceptores y servicios por dominio. |
| Identidad | Supabase Auth; el perfil de aplicación se consulta primero al backend y tiene fallback directo a Supabase. |
| Backend | Spring Boot 3.5.16, Java 25, JPA, PostgreSQL, JWT/JWKS, RLS, OpenAPI y Actuator. |
| Persistencia | Migraciones SQL versionadas en `supabase/migrations`. |
| Despliegue | Vercel para Angular y Render/Docker para Spring Boot. |

## 2. Revisión del frontend

### 2.1 Organización funcional

Las rutas se agrupan en las siguientes áreas:

- **Público:** inicio, catálogo y detalle de cursos, información institucional, planes, docentes, FAQ, contacto, testimonios, verificación de certificados y páginas legales.
- **Autenticación:** inicio de sesión, registro, recuperación y restablecimiento de contraseña, callback y solicitud de acceso docente.
- **Estudiante:** dashboard, perfil, cursos, aula, tareas, evaluaciones, minijuegos, progreso, rendimiento, calendario, mensajes, avisos, comunidad, gamificación, insignias, ranking, recompensas, tienda, inventario, certificados, pagos, notificaciones y soporte.
- **Docente:** panel, perfil, cursos, estudiantes, aula, actividades, tareas, evaluaciones, minijuegos, anuncios, mensajes, reportes y configuración relacionada.
- **Administración:** usuarios, solicitudes docentes, cursos, catálogo, gamificación, tienda, cupones, certificados, auditoría y configuración.

### 2.2 Infraestructura del cliente

- `app.routes.ts`: define navegación y protección de rutas por sesión/rol.
- `app.config.ts`: registra Router, HttpClient, interceptores y configuración global.
- `core/guards`: controla la navegación en el cliente; no sustituye la autorización del servidor.
- `core/interceptors`: adjunta el JWT de Supabase y normaliza errores HTTP.
- `core/services`: concentra los servicios de autenticación, cursos, matrículas, evaluaciones, actividades, juegos, gamificación, pagos, notificaciones, soporte, almacenamiento y otros dominios.
- `core/models`: contratos y adaptación del perfil recibido desde el backend.

### 2.3 Integración observada

La integración está mucho más incompleta de lo que sugiere la documentación: en los 21 servicios Angular revisados, solo `auth.service.ts` y `chatbot.service.ts` invocan `ApiClientService`. Los demás dominios (cursos, matrículas, actividades, evaluaciones, juegos, gamificación, pagos, soporte, docente y administración, entre otros) consultan Supabase directamente mediante Supabase JS. Esto significa que la mayor parte de la capa de negocio no está centralizada en Spring Boot, a pesar de que la documentación del cliente describe esa intención. También se verificaron 107 imports dinámicos de rutas y todos apuntan a archivos existentes.

La autenticación depende de Supabase Auth y el frontend usa una clave pública anon/publishable. No se debe trasladar una `service_role` al navegador.

## 3. Revisión del backend

### 3.1 Módulos encontrados

El código Java se organiza por dominios: identidad, académico, matrículas, progreso, evaluaciones, minijuegos, retos, gamificación, certificados, comercio, soporte, chatbot y auditoría. Se encontraron 17 controladores REST y repositorios/entidades para varios dominios.

### 3.2 Endpoints REST presentes

- Identidad y administración de usuarios.
- Catálogo y escritura/administración de cursos.
- Matrículas y progreso.
- Retos y envíos.
- Gamificación.
- Certificados.
- Pedidos, cupones y webhook de Culqi.
- Reportes y auditoría.
- Anuncios, mensajes, notificaciones y tickets de soporte.

### 3.3 Módulos que requieren cierre

Las tablas y entidades de evaluaciones, actividades, juegos y chatbot existen, y el frontend usa esos dominios, pero no se encontraron controladores REST equivalentes para cubrir todos los flujos. En particular, no existe un controlador de chatbot, aunque `chatbot.service.ts` ya consume cuatro rutas HTTP previstas. El frontend todavía opera la mayoría de esos dominios directamente mediante Supabase. La implementación de un chatbot con respuestas de IA también requiere definir y configurar un proveedor/modelo y su credencial en el servidor; no es correcto simular esa integración.

## 4. Defectos de configuración confirmados y correcciones aplicadas

1. **Prefijo de API:** los controladores usan `/api/v1`, pero el entorno de desarrollo del frontend apuntaba a `/api`. Se corrigió `environment.ts` para apuntar a `http://localhost:8080/api/v1`.
2. **Configuración de producción:** `environment.prod.ts` estaba vacío y no había un generador conectado al build de Angular. Se añadió `scripts/write-environment.mjs`, que construye ese archivo con `VITE_API_URL`, `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`, valida las URLs HTTPS y exige que la API termine en `/api/v1`. Se conectó al comando `npm run build`.
3. **Health check de Render:** el YAML consultaba `/api/actuator/health`, pero `server.servlet.context-path` está configurado como `/`. Se corrigió a `/actuator/health`.
4. **JWT de producción:** `JwtConfig` exige `SUPABASE_JWKS_URI` (preferido para ES256) o un secreto HS256 legacy. Se añadió la variable JWKS a la plantilla de Render.
5. **Plantilla local del backend:** se corrigieron el perfil a `local` y el nombre de puerto a `SERVER_PORT`, que son los nombres que consume Spring.
6. **Perfil de producción:** se añadió `application-prod.yml`, que exige credenciales de base de datos y CORS explícito, reduce el pool de conexiones, desactiva Swagger por defecto y limita Actuator a health.
7. **Despliegue y versiones:** se corrigió `infra/deployment/railway.json` (contenía comentarios que invalidaban el JSON), se alinearon sus health checks con `/actuator/health` y se actualizó el rango de Node.js del frontend al que exige Angular CLI 22.2.x.

## 5. Pendientes para considerar el backend completo

Estos puntos no se deben marcar como resueltos hasta implementar y probarlos: 

- Migrar progresivamente las operaciones de negocio que hoy acceden a Supabase desde Angular hacia endpoints Spring, conservando Supabase Auth y Storage donde corresponda.
- Completar API de evaluaciones, actividades, tareas/entregas, calificaciones, juegos y chatbot, alineada con los contratos que ya consumen los componentes Angular.
- Revisar la autorización por rol y propiedad del recurso en cada operación, además de las políticas RLS.
- Verificar pagos con Culqi sandbox, firma de webhooks, idempotencia y estados de pedido; no usar cobros reales durante pruebas.
- Añadir pruebas de integración para endpoints y pruebas de seguridad (usuario ajeno, rol insuficiente, token inválido/expirado y acceso sin sesión).
- Verificar el despliegue de migraciones, CORS, variables de Render y Vercel, conectividad PostgreSQL y almacenamiento.
- Definir proveedor/modelo de IA del chatbot y sus límites/costos antes de habilitar respuestas generativas.

## 6. Límites de esta auditoría

Esta revisión fue estática. El entorno de ejecución disponible para esta auditoría tenía Node 22.16 (inferior al mínimo requerido por Angular 22.2.6: 22.22.3 o 24.15.0) y Java 21 (inferior al `release` 25 del backend); además, Maven no estaba instalado. La instalación de dependencias npm no terminó dentro del tiempo disponible. Por tanto, no se afirma que el build Angular, el empaquetado Spring, las pruebas o las conexiones con Supabase hayan sido ejecutados satisfactoriamente.

Para una validación final se necesita ejecutar con Node 24.15+ y JDK 25, instalar Maven 3.10, disponer de credenciales de prueba de Supabase y Culqi sandbox, y ejecutar la batería completa en un entorno controlado.
