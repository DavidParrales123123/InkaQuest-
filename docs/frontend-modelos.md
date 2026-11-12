# Modelos e interfaces del frontend

Documento actualizado al cierre de fases 1–14. Describe los contratos tipados usados en `frontend/inkaquest-web`.

## 1. Fuentes de verdad
- **Esquema Supabase (real):** tablas, relaciones, enums y RPC en `supabase/migrations` y proyecto remoto (alineación obligatoria).
- **Backend Spring Boot:** actualmente **sin DTOs/controladores REST**; cuando se definan, los modelos/DTOs frontend deben alinearse sin duplicación ni propiedades inventadas.
- **Regla:** no inventar entidades ni campos; adaptar/extend con cautela y solo cuando el contrato real lo soporte.

## 2. Ubicación de modelos

| Ubicación | Propósito |
|---|---|
| `src/app/core/models/domain.models.ts` | Modelos de dominio compartidos (catálogo, usuarios/perfiles, matrícula/progreso, actividades/evaluaciones, juegos/retos, gamificación, comercio/pagos, certificados, notificaciones, soporte, etc.) |
| `src/app/core/services/*.ts` | Interfaces/tipos locales de respuesta o vista cuando son específicos del servicio/componente (p. ej. contratos preparados) |
| `src/app/core/services/chatbot.service.ts` | `ChatbotConversacion`, `ChatbotMensaje` (contrato UI/preparado para API backend `/api/chatbot/*`) |
| `src/app/shared/*`, `src/app/features/**` | Tipos de presentación locales (VM/UI) derivados de modelos de dominio, sin sustituir contratos fuente |

## 3. Dominios cubiertos en `domain.models.ts`

El archivo central tipa (entre otros, según evolución del proyecto) las entidades y estructuras usadas por la UI:

- **Identidad y acceso:** `Perfil`, `RolUsuario`, estados de cuenta, solicitudes/permisos y relaciones visibles.
- **Académico:** `Categoria`, `Curso`, `Unidad`, `Modulo`, `Leccion`, `Contenido`, `Recurso`, `MaterialDescargable`, estructuras de curso/publicación.
- **Matrícula y progreso:** `Matricula`, `ProgresoCurso`, `ProgresoUnidad`, `ProgresoLeccion`.
- **Actividades y evaluación:** `Actividad`, `Tarea`, `Entrega`, `EntregaArchivo`, `Calificacion`, `Retroalimentacion`, `Evaluacion`, `Pregunta`, `Opcion`, `IntentoEvaluacion`, `RespuestaEvaluacion`, `Examen`/criterios según esquema.
- **Juegos y retos:** `Motor`, `Juego`, `ConfiguracionJuego`, `ActividadJuego`, `MotorCurso`, intentos/resultados/puntuaciones, `Reto`, `CasoPrueba`, `RestriccionReto`, `Lenguaje`, `EnvioReto`.
- **Gamificación:** `Insignia`, asignaciones, `TransaccionXp`, `TransaccionMoneda`, `Monedero`, `Racha`, `Ranking`, `Temporada`, `Mision`, eventos, reglas de progresión.
- **Comercio:** `Pedido`, `DetallePedido`, `Transaccion`, `Reembolso`, `Cupon`, `Carrito`, `ItemCarrito` (según disponibilidad).
- **Certificados:** `Certificado` y entidades relacionadas (titular, emisión, revocación, curso) según consumo.
- **Comunicación y soporte:** `Notificacion`, `NotificacionDestinatario`, `PreferenciaNotificacion`, `Ticket`, respuestas/historial, `Mensaje` y entidades de mensajería disponibles.

> La definición exacta de campos, nulabilidad y enums debe consultarse en `core/models/domain.models.ts` y validarse contra el esquema real/RLS.

## 4. Convenciones de tipado
- **TypeScript estricto:** sin `any` implícito cuando es evitable; tipos explícitos en servicios/componentes.
- **Nulabilidad y estados:** campos opcionales/nulos reflejan la realidad del dato; estados de UI (`loading/error/empty/success`) modelados en componentes/signals.
- **DTOs futuros:** al existir API REST, introducir DTOs de request/response en capa de integración/servicios sin romper modelos de dominio ni duplicar semántica.
- **IDs y fechas:** UUIDs como `string`; fechas según formato recibido (ISO string) con parseo/controlado en UI.
- **No autoritativo:** presencia de campos de recompensa/puntaje/estado no implica que el cliente pueda modificarlos o decidirlos.

## 5. Modelos preparados para integraciones pendientes
- **Chatbot:** `ChatbotConversacion`, `ChatbotMensaje` (frontend) mapeables a contratos backend cuando se implementen.
- **Pagos/checkout/ejecuciones de retos/certificados transaccionales:** contratos a definir en backend; el frontend usa hoy modelos de lectura/estado disponibles y formularios/acciones preparadas donde corresponde.

## 6. Mantenimiento
- Actualizar este documento y `domain.models.ts` ante cambios de migraciones, RPC o DTOs.
- Documentar discrepancias temporales entre modelo UI y esquema/contrato en `docs/frontend-pendientes.md`.
