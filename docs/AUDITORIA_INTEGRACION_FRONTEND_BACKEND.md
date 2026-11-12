# Auditoría de integración frontend/backend — InkaQuest

Fecha de revisión: 12 de noviembre de 2026  
Artefacto revisado: `InkaQuest_backend_integrado_v1.zip`

## 1. Resumen ejecutivo

El repositorio ya tiene una arquitectura Angular + Spring Boot + Supabase, pero la migración de las operaciones de negocio al backend está incompleta. Se encontraron:

- 21 servicios Angular en `src/app/core/services`.
- 14 módulos Java bajo `com.inkaquest.modules`.
- 18 controladores REST.
- 2 módulos con entidades y repositorios, pero sin controlador ni servicio de negocio: `evaluaciones` y `minijuegos`.
- 306 referencias a operaciones de Supabase (`from`, `rpc`, `storage` y `auth`) en la capa de servicios. Este conteo es orientativo: incluye autenticación y almacenamiento, que deben permanecer en Supabase según los requisitos.

La base REST ya está normalizada en `/api/v1`; `ApiClientService` toma la URL base del entorno y los controladores existentes usan `/api/v1`. El problema principal no es una ruta `/api` frente a `/api/v1` en los controladores actuales: es que casi todos los servicios Angular todavía consultan Supabase y no consumen esos controladores.

## 2. Auditoría de los 21 servicios Angular

| Servicio | Estado encontrado | Destino recomendado |
|---|---|---|
| `activity.service.ts` | Supabase para actividades, entregas y recursos | Spring Boot para reglas, entregas y calificaciones; Storage para archivos |
| `admin.service.ts` | Supabase para usuarios, permisos, cursos, contenido, evaluaciones, gamificación, auditoría y configuración | Endpoints `/admin` de identidad, academia, evaluaciones, gamificación y reportes |
| `anuncio.service.ts` | Supabase | Endpoint `/api/v1/anuncios` existente |
| `api-client.service.ts` | Cliente REST centralizado y compatible con `ApiResponse` | Conservar y endurecer tipado/errores |
| `auth.service.ts` | Supabase Auth y REST parcial para perfil/solicitud docente | Mantener Supabase Auth; perfil y roles en Spring Boot |
| `certificate.service.ts` | Supabase | Endpoint `/api/v1/certificados` existente |
| `chatbot.service.ts` | REST `/chatbot/...` | Endpoint `/api/v1/chatbot` existente; falta prueba real con proveedor |
| `course.service.ts` | Supabase para catálogo, estructura, contenido y CRUD | `/api/v1/cursos` y endpoints de estructura académica |
| `enrollment.service.ts` | Supabase/RPC para matrículas | `/api/v1/matriculas` |
| `evaluation.service.ts` | Supabase para evaluaciones, preguntas, opciones, intentos y respuestas | Crear servicio/controlador REST de evaluaciones |
| `game.service.ts` | Supabase/RPC para motores, juegos, actividades e intentos | Crear servicio/controlador REST de minijuegos |
| `gamification.service.ts` | Supabase para XP, insignias, rachas, temporadas, ranking y monedas | `/api/v1/gamificacion`; completar operaciones de escritura faltantes |
| `message.service.ts` | Supabase para mensajes y contactos | `/api/v1/mensajes` existente; completar búsqueda de contactos/miembros si el contrato lo requiere |
| `notification.service.ts` | Supabase | `/api/v1/notificaciones` existente |
| `payment.service.ts` | Supabase para pedidos, transacciones, reembolsos y cupones | `/api/v1/pedidos` y `/api/v1/cupones`; definir endpoints administrativos restantes |
| `progress.service.ts` | Supabase/RPC | `/api/v1/progreso` |
| `reward.service.ts` | Supabase para tienda, inventario y compras | Completar módulo de gamificación/comercio e inventario |
| `storage.service.ts` | Supabase Storage | Mantener Supabase Storage; autorizar metadatos/rutas mediante backend |
| `supabase.service.ts` | Cliente y nombres de tablas Supabase | Mantener solo para Auth/Storage y configuración pública necesaria |
| `support.service.ts` | Supabase para tickets y respuestas | `/api/v1/soporte` existente |
| `teacher.service.ts` | Supabase para cursos, estudiantes, actividades y calificaciones | Endpoints docentes en academia/evaluaciones |

### Hallazgo transversal

No se debe reemplazar Supabase por llamadas REST indiscriminadamente. El objetivo correcto es:
- Supabase Auth: inicio/cierre de sesión, recuperación y emisión del JWT.
- Supabase Storage: carga/descarga de archivos, con rutas privadas y autorización.
- Spring Boot: permisos, perfiles, cursos, matrículas, evaluaciones, puntuaciones, gamificación, mensajería, soporte, pagos y demás reglas de negocio.
- PostgreSQL/Supabase: persistencia consultada por el backend; Angular no debe ejecutar consultas de negocio directas.

## 3. Backend existente

| Módulo | Estado estructural | Trabajo pendiente principal |
|---|---|---|
| `academico` | Controladores, servicios, entidades y repositorios | Completar contrato CRUD/contenido y migrar `course.service` |
| `identidad` | Controladores, servicios y repositorios | Conectar administración y docentes; revisar autorización por recurso |
| `matriculas` | Controlador/servicio/repositorios | Migrar servicio Angular y comprobar inscripción gratuita/de pago |
| `progreso` | Controlador/servicio/repositorios | Migrar servicio Angular y validar XP/racha idempotentes |
| `evaluaciones` | Entidades/repositorios; sin controlador ni servicio | Implementar preguntas, opciones, intentos, respuestas, puntuación y revisión |
| `minijuegos` | Entidades/repositorios; sin controlador ni servicio | Implementar catálogo, intentos, respuestas, resultados y puntuaciones |
| `retos` | Controlador/servicio/repositorios | Implementar ejecución aislada solo cuando exista sandbox seguro; actualmente no se debe ejecutar código en el proceso principal |
| `gamificacion` | Controlador/servicio/repositorios | Completar XP, monedas, misiones, recompensas, inventario y escrituras |
| `soporte` | Controladores/servicios/repositorios | Migrar tickets, mensajes, notificaciones y mensajería |
| `chatbot` | Controlador/servicio/repositorios/DTOs | Probar credenciales, límites, errores y persistencia; evitar fuga de datos de otras conversaciones |
| `certificados` | Controlador/servicio/repositorios | Migrar frontend y verificar emisión/propiedad |
| `comercio` | Controladores/servicios/repositorios | Completar conciliación, reembolsos, suscripciones y operaciones administrativas |
| `reportes` | Controlador/servicio | Conectar dashboards de docente/administrador |
| `auditoria` | Controlador/servicio/repositorios | Conectar administración y revisar que las acciones sensibles se registren |

## 4. Rutas y respuestas

- Base de los controladores existentes: `/api/v1`.
- `environment.ts` usa `http://localhost:8080/api/v1`.
- `ApiClientService` concatena rutas relativas como `/chatbot/conversaciones`; por tanto, no se debe volver a anteponer `/api` o `/api/v1` en cada servicio.
- `ApiResponse` define `success`, `message`, `data`, `error`, `timestamp`, `path` y `errors`.
- `ApiClientService` ya desenvuelve `data` cuando recibe `success: true`; hay que conservar ese contrato al migrar servicios.

## 5. Seguridad

Hallazgos de código:
- Spring Security opera sin sesión y exige Bearer JWT para endpoints privados.
- `JwtConfig` admite JWKS ES256 de Supabase y un modo legacy HS256.
- `SecurityConfig` deja públicos health, documentación configurada, verificación pública de certificados y webhook Culqi.
- El comentario de seguridad establece que el rol efectivo se consulta en `public.perfil.rol`, no se confía en el rol enviado desde Angular.
- Hay 30 archivos SQL de migración/prueba en `supabase`, incluidos archivos de RLS y pruebas.

Pendiente de comprobación real:
- No se pudo ejecutar `supabase/tests/pruebas_rls.sql` ni validar políticas contra el proyecto remoto: el ZIP no contiene credenciales de conexión.
- Debe probarse cada endpoint con JWT de estudiante, docente y administrador, incluyendo intentos de acceder a UUIDs ajenos.
- Revisar todas las políticas RLS tras migrar los accesos de Angular a Spring Boot. No debe añadirse una clave `service_role` al navegador.
- Validar autorización de archivos Storage privados y evitar URLs públicas para documentos privados.

## 6. Culqi: corrección aplicada y límites

Correcciones realizadas en este avance:
1. Se unificó `CULQI_API_KEY` como nombre canónico, manteniendo `CULQI_SECRET_KEY` como alias de compatibilidad en `application.yml`.
2. Se añadieron variables de Culqi y chatbot a `infra/deployment/render.yaml`.
3. Se sincronizaron las plantillas raíz y backend para `CULQI_API_KEY`, `CULQI_API_BASE`, `CHATBOT_API_KEY`, `CHATBOT_API_URL` y `CHATBOT_MODEL`.
4. Se corrigió el evento de cargo exitoso a `charge.creation.succeeded`.
5. El webhook ahora interpreta `data` tanto como objeto como cadena JSON.
6. Se añadió verificación remota del evento y del cargo mediante `GET /v2/events/{id}` y `GET /v2/charges/{id}` autenticados con la llave privada.
7. Antes de confirmar, se comprueban ID, metadata del pedido, captura, importe y moneda; la activación de matrícula continúa ocurriendo solo en backend.
8. Se actualizó `SecurityConfig` y la documentación para no afirmar que existe un header HMAC estándar.

**Importante:** la documentación pública consultada de Culqi describe el ID/tipo del evento y la consulta autenticada, pero no define un header HMAC estándar. Por eso se implementó verificación servidor-a-servidor contra Culqi en vez de depender de un header inventado. Referencias oficiales:
- https://docs.culqi.com/es/documentacion/pagos-online/webhooks/
- https://apidocs.culqi.com/

Pendiente:
- Probar con llaves `sk_test_*` y eventos reales Sandbox.
- Confirmar en el panel Culqi los eventos configurados y la URL pública del webhook.
- Probar rechazo, reintento, evento repetido, importe/moneda incorrectos y pedido ya pagado.
- La integración actual genera un pedido interno y crea un cargo (`/v2/charges`); no debe confundirse con el recurso de Órdenes Culqi (`/v2/orders`). Si el negocio necesita PagoEfectivo u órdenes con expiración, se debe implementar ese flujo separado.
- No activar llaves `sk_live_*` hasta completar las pruebas Sandbox y la revisión de producción.

## 7. Chatbot

Ya existe `ChatbotController`, `ChatbotService`, DTOs y persistencia de conversaciones/mensajes. Los cuatro contratos que consume Angular existen:
- `GET /api/v1/chatbot/conversaciones`
- `GET /api/v1/chatbot/conversaciones/{id}/mensajes`
- `POST /api/v1/chatbot/conversaciones`
- `POST /api/v1/chatbot/mensajes`

La configuración usa `CHATBOT_API_KEY`, `CHATBOT_API_URL` y `CHATBOT_MODEL`. Pendiente: prueba con credencial real, límites por usuario, manejo de timeout, límites de contexto/tokens y pruebas de aislamiento entre conversaciones.

## 8. Verificación ejecutable disponible en este entorno

No fue posible ejecutar las compilaciones:
- El `pom.xml` exige Java 25; el entorno de trabajo tiene Java 21.
- Maven no está instalado y el proyecto no incluye `mvnw`.
- El frontend no incluye `node_modules`; su instalación/build requiere resolver dependencias npm.

Por tanto, los cambios de este avance son una modificación de código revisada estáticamente, no una compilación ni una prueba Sandbox certificada. Antes de producción deben ejecutarse `mvn test`, `npm ci`, `npm run build` y las pruebas de integración contra un entorno de prueba.

## 9. Siguiente orden de implementación

1. Completar controladores/servicios de `evaluaciones` y `minijuegos` reutilizando entidades y repositorios existentes.
2. Migrar `evaluation.service.ts` y `game.service.ts` a REST y verificar que no se filtren respuestas correctas antes de entregar un intento.
3. Migrar `course`, `enrollment`, `progress` y `teacher`, pues forman el flujo académico principal.
4. Migrar `gamification`, `reward`, `certificate`, `notification`, `message`, `support` y `activity`.
5. Migrar `admin`, `payment` y `anuncio`, completando endpoints administrativos faltantes.
6. Mantener Auth/Storage en Supabase y eliminar accesos de negocio directos desde Angular.
7. Ejecutar pruebas de roles/RLS, build frontend/backend y Culqi Sandbox.
