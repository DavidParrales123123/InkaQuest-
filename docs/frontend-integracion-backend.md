# Integración del frontend con backend y Supabase

Documento actualizado al cierre de fases 1–14. Describe **cómo se integra hoy** el frontend, el uso de Supabase, y los **contratos/pendientes** para la API Spring Boot.

> **Estado real del backend (auditado):** `backend/inkaquest-api` contiene entidades JPA y repositorios por dominio, pero **no expone controllers REST, servicios de aplicación expuestos ni DTOs**. No hay endpoints operativos para consumo productivo desde el cliente.
>
> El frontend **no simula** la API: consume datos reales vía Supabase (Auth/PostgREST/Storage/RPC) según RLS/permisos, y mantiene una capa HTTP preparada (`ApiClientService` + interceptores) para integración futura con Spring Boot.

## 1. Arquitectura de integración actual

```text
Frontend Angular (SPA, standalone, lazy, Signals/RxJS)
  ├─ Supabase Auth        → identidad, sesión, JWT, refresh
  ├─ PostgREST (Supabase) → lectura/escritura permitida por RLS
  ├─ Supabase Storage     → recursos/avatares/portadas según buckets y políticas
  ├─ RPC (Supabase)       → operaciones autorizadas en BD (p. ej. progreso)
  └─ API REST (Spring Boot, preparada) → lógica sensible/transaccional/autoritativa (pendiente)
       Authorization: Bearer <jwt Supabase>
```

### 1.1 Autenticación y sesión
- `AuthService` usa `@supabase/supabase-js` para login/registro/recuperación/restablecimiento/callback y estado reactivo de sesión.
- `auth.interceptor.ts` adjunta token a peticiones HTTP al backend cuando aplica.
- `error.interceptor.ts` centraliza manejo/traducción de errores.
- La autorización real se aplica en **RLS** (y en **Spring Security** cuando exista backend); los guards Angular son capa UX.

### 1.2 Configuración
- `core/config/app-config.ts` + `APP_CONFIG`.
- `src/environments/environment.ts` y `environment.prod.ts`: `apiUrl`, `supabaseUrl`, `supabaseAnonKey` (públicos, a configurar por entorno). **Nunca** incluir `service_role`, secretos Culqi/IA, claves privadas o credenciales.

## 2. Integración Supabase implementada/consumida

### 2.1 Datos y dominios (según permisos/RLS)
El frontend consume tablas/vistas/relaciones reales del esquema (121 tablas, RLS activo) a través de servicios de dominio (`core/services/*`) para:
- Catálogo y contenido académico: cursos, categorías, estructura (unidad/módulo/lección), contenidos, recursos, materiales.
- Identidad y roles: perfiles, solicitudes docentes, asignaciones/permisos visibles.
- Matrículas y progreso: matrículas, progreso de curso/unidad/lección.
- Actividades/evaluaciones: actividades, tareas, entregas, calificaciones, evaluaciones e intentos/datos permitidos.
- Gamificación: XP/monedas/monedero, rachas, reglas, eventos, insignias/logros/rankings/recompensas/inventario/tienda (lectura y acciones permitidas).
- Juegos y retos: motores, juegos, configuraciones visibles, instancias/actividades de juego, intentos/resultados permitidos, retos, casos visibles, lenguajes, envíos.
- Comercio/certificados/notificaciones/soporte: pedidos, transacciones, reembolsos, cupones/carrito (según datos), certificados, notificaciones/destinatarios, tickets/soporte.

### 2.2 RPC/funciones usadas o consideradas
| Función/RPC | Uso frontend | Nota |
|---|---|---|
| `fn_registrar_completado_leccion` | Registro de progreso/lección completada desde aula (`ProgressService`) | Ejecutada en BD (autoridad de progreso). Aplicada/verificada en contexto del proyecto. |
| `fn_registrar_resultado_juego` (u otras de resultados/recompensas) | Preparada/soportable según integración de runtime | Debe ejecutarse de forma autoritativa en BD/backend, no en cliente. |

### 2.3 Storage
- Buckets conocidos: `recursos` (privado, acceso por matrícula/docente/admin), `avatares` y `portadas-curso` (públicos).
- `StorageService`/componentes preparan y usan carga/lectura según permisos; URLs firmadas server-side pueden requerirse según evolución de seguridad.

## 3. Capa HTTP preparada para Spring Boot

- **Servicio:** `core/services/api-client.service.ts` (base URL desde config, verbos HTTP tipados).
- **Interceptores:** inyección de auth y manejo de errores.
- **Servicios preparados:** `chatbot.service.ts` consume `/api/chatbot/*` (con manejo de indisponibilidad en UI). Otros dominios pueden migrar/combinar llamadas a REST cuando existan endpoints.

## 4. Contratos pendientes (a implementar en backend, sin inventar en cliente)

### 4.1 Pagos y matrículas (prioridad alta)
| Método | Ruta sugerida | Propósito | Reglas clave |
|---|---|---|---|
| POST | `/api/pagos/pedidos` | Crear pedido validando precio en servidor | Precio desde catálogo/BD; idempotencia |
| POST | `/api/pagos/{pedidoId}/checkout` | Iniciar checkout Culqi (config pública) | No exponer secretos; no enviar datos sensibles de tarjeta al backend propio |
| POST | `/api/pagos/webhooks/culqi` | Confirmación proveedor | Verificar firma/evento; idempotente |
| GET | `/api/pagos/pedidos/{id}` | Estado consolidado | Estado real, no “éxito” por navegador |
| POST | `/api/pagos/reembolsos` | Solicitud/proceso autorizado | Validación server-side |

**Regla:** matrícula activa solo tras confirmación válida en backend; nunca activar desde UI.

### 4.2 Retos de programación (prioridad alta)
| Método | Ruta sugerida | Propósito |
|---|---|---|
| POST | `/api/retos/{id}/ejecuciones` | Enviar solución a sandbox aislado |
| GET | `/api/retos/{id}/ejecuciones/{ejecucionId}` | Consultar resultado |
| GET | `/api/retos/{id}/historial` | Historial/evaluaciones |

**Regla:** ejecución en contenedor aislado (límites CPU/memoria/tiempo/red), nunca en Angular ni en proceso no aislado; evaluación de casos visibles/ocultos en backend.

### 4.3 Chatbot con IA (prioridad alta, UI ya preparada)
| Método | Ruta (usada por frontend) | Propósito |
|---|---|---|
| GET | `/api/chatbot/conversaciones` | Listar conversaciones del usuario |
| GET | `/api/chatbot/conversaciones/{id}/mensajes` | Mensajes de conversación |
| POST | `/api/chatbot/conversaciones` | Crear conversación |
| POST | `/api/chatbot/mensajes` | Enviar mensaje y obtener respuesta `{ conversacionId?, contenido }` |

**Reglas:** clave IA solo en backend; filtrar contexto por rol/permisos/RLS; no exponer datos privados de terceros; no ejecutar acciones sensibles sin autorización; registrar historial/consumo según diseño.

### 4.4 Certificados, archivos y otros (prioridad media/alta)
| Área | Endpoints/servicios esperados |
|---|---|
| Certificados | Emisión autorizada, revocación, descarga/PDF, verificación transaccional ampliada |
| Archivos | URLs firmadas/confirmación/descarga autorizada cuando sea necesario |
| Tienda/compras | Operaciones transaccionales atómicas (saldo/reglas) |
| Notificaciones | Envío masivo/segmentado, plantillas/canales |
| Admin/docente sensible | Endpoints validados para operaciones que excedan capacidades seguras de cliente/RLS directo |

## 5. Seguridad e integridad (obligatorio)
- No exponer secretos (`service_role`, Culqi, IA, credenciales) en frontend.
- No confiar en el cliente para precios, activaciones, correcciones, recompensas, emisión/revocación de certificados ni resultados de ejecución.
- RLS y (futuro) Spring Security como autoridad de acceso; frontend solo UX.
- Idempotencia, validación server-side y auditoría en operaciones críticas.

## 6. Pendientes de integración
- Implementar API REST + DTOs en `backend/inkaquest-api` y alinear contratos con servicios frontend.
- Configurar `apiUrl`/entornos y despliegue CORS/JWT entre Supabase Auth y Spring Boot.
- Pruebas E2E con backend real (pagos sandbox, judge, IA, certificados, cargas).
- Ver `docs/frontend-pendientes.md` para detalle operativo.
