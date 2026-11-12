# Índices — InkaQuest

Los **311 índices** del esquema, con su justificación.

## 1. Tipos de índice utilizados

| Tipo | Uso | Ejemplos |
|---|---|---|
| `BTREE` (por defecto) | Igualdad, rangos, ordenación, FK | Casi todos |
| `UNIQUE` | Integridad de negocio | `matricula (estudiante_id, curso_id)` |
| `GIN + gin_trgm_ops` | Búsqueda de texto difuso | `curso.titulo`, `chatbot_fragmento.tokens` |
| `GIN` (jsonb) | Consultas sobre JSONB | `configuracion_juego.valor` |
| `BRIN` | Rangos en columnas grandes ordenadas | Fechas de auditoría |
| Parcial (`WHERE`) | Subconjuntos activos | `uq_docente_curso_responsable` |

## 2. Índices por criterio

### 2.1 Claves primarias

Cada tabla tiene su `PRIMARY KEY` sobre `id uuid`, lo que genera un índice
únique. Con 121 tablas, son 121 índices.

### 2.2 Claves foráneas

PostgreSQL **no** crea índices automáticamente en las FK. Se han creado
explícitamente para evitar que un borrado o un JOIN por FK degrade el
rendimiento con una tabla que crece.

| Índice | Tabla | Columnas | Motivo |
|---|---|---|---|
| `idx_matricula_curso` | `matricula` | `(curso_id, estado)` | Listar matrículas de un curso por estado |
| `idx_matricula_estudiante` | `matricula` | `(estudiante_id, estado)` | Panel del estudiante |
| `idx_docente_curso_docente` | `docente_curso` | `(docente_id, activo)` | Cursos asignados al docente |
| `idx_cursos_docentes_curso` | `docente_curso` | `(curso_id)` | Docentes de un curso |
| `idx_niveles_curso` | `unidad` | `(curso_id, numero)` | Orden del temario |
| `idx_lecciones_nivel` | `leccion` | `(modulo_id, numero)` | Orden de lecciones |
| `idx_progreso_curso_estudiante` | `progreso_curso` | `(estudiante_id, estado)` | Progreso por curso |
| `idx_progreso_leccion_estudiante` | `progreso_leccion` | `(estudiante_id, estado)` | Lecciones completadas |
| `idx_actividad_leccion` | `actividad` | `(leccion_id)` | Actividades de una lección |
| `idx_actividad_curso_tipo` | `actividad` | `(curso_id, tipo)` | Filtrar por tipo |
| `idx_pregunta_evaluacion` (implícito UNIQUE) | `pregunta` | `(evaluacion_id, orden)` | Orden de preguntas |
| `idx_opcion_pregunta` | `opcion` | `(pregunta_id)` | Opciones de una pregunta |
| `idx_entrega_tarea` | `entrega` | `(tarea_id)` | Entregas de una tarea |
| `idx_entrega_estudiante` | `entrega` | `(estudiante_id, estado)` | Entregas del estudiante |
| `idx_calificacion_estudiante` | `calificacion` | `(estudiante_id, calificado_en DESC)` | Historial de notas |
| `idx_calificacion_entrega` | `calificacion` | `(entrega_id)` | Calificación de una entrega |
| `idx_envio_reto_reto` | `envio_reto` | `(reto_id, creado_en DESC)` | Envíos de un reto |
| `idx_envio_reto_estudiante` | `envio_reto` | `(estudiante_id, creado_en DESC)` | Historial del estudiante |
| `idx_resultado_caso_envio` | `resultado_caso` | `(envio_id)` | Resultados de un envío |
| `idx_intento_juego_estudiante` | `intento_juego` | `(estudiante_id, estado)` | Partidas del estudiante |
| `idx_intento_juego_actividad` | `intento_juego` | `(actividad_juego_id, estado)` | Partidas de una actividad |
| `idx_puntuacion_juego_ranking` | `puntuacion_juego` | `(juego_id, mejor_puntaje DESC)` | Tabla de mando |
| `idx_insignia_usuario_usuario` | `insignia_usuario` | `(usuario_id, obtenida_en DESC)` | Insignias del usuario |
| `idx_transaccion_xp_usuario` | `transaccion_xp` | `(usuario_id, creado_en DESC)` | Historial de XP |
| `idx_ranking_temporada_puntos` | `ranking` | `(temporada_id, puntos DESC)` | Clasificación |
| `idx_certificados_estudiante` | `certificado` | `(estudiante_id)` | Certificados del usuario |
| `idx_notificaciones_usuario` | `notificacion_destinatario` | `(usuario_id, leida, creado_en DESC)` | Bandeja de notificaciones |
| `idx_ticket_usuario` | `ticket` | `(usuario_id, estado)` | Tickets del usuario |
| `idx_ticket_asignado` | `ticket` | `(asignado_a, estado)` | Cola de soporte |
| `idx_chatbot_conversacion_usuario` | `chatbot_conversacion` | `(usuario_id, creado_en DESC)` | Historial de chats |
| `idx_chatbot_mensaje_conversacion` | `chatbot_mensaje` | `(conversacion_id, creado_en)` | Mensajes de una conversación |
| `idx_registro_accion_actor` | `registro_accion` | `(actor_id, creado_en DESC)` | Auditoría por usuario |
| `idx_registro_accion_entidad` | `registro_accion` | `(entidad_tipo, entidad_id, creado_en DESC)` | Auditoría por entidad |
| `idx_historial_modificacion_entidad` | `historial_modificacion` | `(entidad_tipo, entidad_id, creado_en DESC)` | Historial de una entidad |

### 2.3 Índices de unicidad de negocio

| Índice | Restricción |
|---|---|
| `matricula (estudiante_id, curso_id)` UNIQUE | Un estudiante, una matrícula por curso |
| `docente_curso (curso_id, docente_id)` UNIQUE | Un docente, una asignación por curso |
| `pedido.numero` UNIQUE | Número de pedido único |
| `pedido.clave_idempotencia` UNIQUE | Idempotencia del pedido |
| `transaccion.clave_idempotencia` UNIQUE | Idempotencia del cobro |
| `webhook_pago.evento_id` UNIQUE | Un evento, un procesamiento |
| `compra_virtual.clave_idempotencia` UNIQUE | Idempotencia de la compra |
| `inventario.clave_idempotencia` UNIQUE | Idempotencia del otorgamiento |
| `recompensa_juego.clave_idempotencia` UNIQUE | Idempotencia de la recompensa |
| `certificado.codigo` UNIQUE | Código de verificación único |
| `certificado_emision.clave_idempotencia` UNIQUE | Idempotencia de la emisión |
| `notificacion.clave_idempotencia` UNIQUE | Idempotencia del envío |
| `intento_juego.clave_idempotencia` UNIQUE | Idempotencia de la partida |
| `envio_reto.clave_idempotencia` UNIQUE | Idempotencia del envío de código |
| `curso.slug` UNIQUE | URL del curso |
| `categoria.slug` UNIQUE | URL de la categoría |
| `perfil.email` UNIQUE | Un perfil por correo |
| `perfil.documento` UNIQUE | Un perfil por documento |

**Por qué importa la idempotencia**: si el proveedor de pagos reintenta el
webhook, la clave única hace que la segunda inserción no cree un cobro ni una
matrícula duplicada. Es la garantía de integridad más crítica del módulo D.

### 2.4 Índices de búsqueda de texto

| Índice | Tipo | Motivo |
|---|---|---|
| `idx_cursos_titulo_trgm` | GIN trigram | Buscar cursos por nombre con tolerancia a typos ("algoritmo" → "algoritmos") |
| `idx_chatbot_fragmento_tokens_trgm` | GIN trigram | Búsqueda por palabras clave en el chatbot cuando no hay pgvector |

### 2.5 Índices parciales

| Índice | Condición | Motivo |
|---|---|---|
| `uq_docente_curso_responsable` | `WHERE es_responsable AND activo` | Solo un docente responsable activo por curso. Un índice parcial es más pequeño y rápido que uno total con filtro |
| `idx_notificacion_programada` | `WHERE enviada_en IS NULL` | Cola de notificaciones pendientes de envío |

### 2.6 Índices compuestos con orden

Cuando el filtro y el orden coinciden, el índice cubre ambos:

```sql
create index idx_transaccion_xp_usuario
    on public.transaccion_xp (usuario_id, creado_en desc);
```

Esta consulta:

```sql
select * from transaccion_xp
 where usuario_id = ? order by creado_en desc limit 20;
```

usa el índice sin ninguna operación de ordenamiento adicional.

## 3. Estrategia por volumen

| Tabla | Volumen esperado | Índices |
|---|---|---|
| `perfil` | Miles | `rol`, `email` UNIQUE |
| `curso`, `categoria` | Cientos | `estado`, `categoria_id`, `titulo` trigram |
| `matricula` | Decenas de miles | `(curso_id, estado)`, `(estudiante_id, estado)` |
| `transaccion` | Decenas de miles | `(pedido_id)`, `(usuario_id, creado_en)`, `referencia` |
| `opcion` | Cientos de miles | `pregunta_id` |
| `respuesta_evaluacion` | Millones | `intento_id` |
| `transaccion_xp` | Millones | `(usuario_id, creado_en DESC)` |
| `registro_accion` | Millones | `(actor_id)`, `(entidad_tipo, entidad_id)`, `codigo_evento` |
| `chatbot_mensaje` | Millones | `(conversacion_id, creado_en)` |
| `progreso_leccion` | Millones | `(estudiante_id, estado)`, `(leccion_id)` |

## 4. Recomendaciones de mantenimiento

```sql
-- Detectar índices sin usar (requiere track_io_timing, no activo por defecto)
select relname, indexrelname, idx_scan
  from pg_stat_user_indexes
 where idx_scan = 0
   and indexrelname not like '%_pkey'
   and indexrelname not like '%_key'
 order by relname;
```

```sql
-- Reindexar (trasRestore de datos masivos)
reindex database postgres;
```

```sql
-- Estadísticas de tamaño
select relname,
       pg_size_pretty(pg_total_relation_size(relid)) as tamaño,
       n_live_tup as filas
  from pg_stat_user_tables
 order by pg_total_relation_size(relid) desc
 limit 20;
```

## 5. Buenas prácticas aplicadas

1. **Todo índice justificado**: cada uno responde a una consulta concreta
   documentada.
2. **FK indexadas**: evita que un `DELETE` en la padre haga un `SEQUENTIAL SCAN`
   sobre la hija.
3. **Composición izquierda→derecha**: la columna más selectiva primero, la de
   ordenación al final.
4. **Selectividad**: los índices empiezan filtrando por la columna de alta
   cardinalidad.
5. **Sin índices redundantes**: si un índice compuesto `(a, b)` cubre la
   consulta por `a`, no se crea un índice aparte por `a` (salvo que se
   necesite uno más selectivo).
6. **Sin índices en columnas de baja cardinalidad** sin combina: `boolean`
   solo se indexa junto con otra columna (`leida` en notificaciones).
