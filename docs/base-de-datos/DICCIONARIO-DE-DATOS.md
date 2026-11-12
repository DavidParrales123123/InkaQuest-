# Diccionario de datos — InkaQuest

Descripción de las tablas principales del esquema. Refleja exactamente lo
implementado y verificado en la base de datos.

> Las 121 tablas están agrupadas por módulo. Este documento detalla las
> 30 tablas más relevantes; el resto sigue el mismo patrón de diseño.

## Convenciones

| Elemento | Convención |
|---|---|
| `id` | `uuid` PK, `default gen_random_uuid()` |
| Fechas | `timestamptz`, `creado_en default now()`, `actualizado_en` con trigger |
| Dinero | `numeric(10,2)` / `numeric(8,2)` con `check (>= 0)` |
| Estados | ENUM nativo (38 tipos) |
| Flags | `boolean not null default ...` |
| Campos abiertos | `jsonb not null default '{}'::jsonb` |
| Soft delete | Solo donde aporta (`borrado_por_emisor` en `mensaje`) |

---

## A. Identidad y seguridad

### `perfil` — Perfil de usuario

Extiende `auth.users` sin duplicar el mecanismo de autenticación.

| Columna | Tipo | Null | Default | Descripción |
|---|---|---|---|---|
| `id` | uuid | NO | — | PK, FK → `auth.users(id)` ON DELETE CASCADE |
| `email` | text | NO | — | UNIQUE |
| `nombre` | text | NO | — | Nombre completo |
| `apellido` | text | sí | — | — |
| `documento` | text | sí | — | UNIQUE |
| `genero` | text | sí | — | — |
| `fecha_nacimiento` | date | sí | — | — |
| `telefono` | text | sí | — | — |
| `avatar_url` | text | sí | — | Ruta en Storage |
| `bio` | text | sí | — | — |
| `rol` | rol_usuario | NO | `'estudiante'` | ENUM: estudiante, docente, administrador |
| `estado_cuenta` | estado_cuenta | NO | `'pendiente_verificacion'` | ENUM |
| `xp` | integer | NO | `0` | check >= 0. Solo el sistema lo modifica |
| `nivel` | integer | NO | `1` | check >= 1. Derivado de `regla_progresion` |
| `racha_dias` | integer | NO | `0` | check >= 0 |
| `ultima_conexion` | timestamptz | sí | — | — |

### `solicitud_docente` — Solicitud de rol docente

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid | PK |
| `usuario_id` | uuid | FK → `perfil` CASCADE |
| `estado` | estado_solicitud_docente | pendiente, en_revision, aprobada, rechazada |
| `institucion` / `especialidad` / `codigo_docente` | text | Datos profesionales |
| `motivo` | text | NOT NULL — justificación del solicitante |
| `documentos_adjuntos` | jsonb | Lista de adjuntos |
| `revisado_por` / `revisado_en` / `motivo_revision` | — | Traza de la decisión |

### `aprobacion_docente` — Historial de decisiones

Append-only. `unique` implícito por combinación de `solicitud_id` +
`creado_en` (no se restringe: se conservan todos los intentos).

### `permiso` / `rol_permiso` — RBAC granular

`permiso` (15 filas de referencia) + `rol_permiso` (rol × permiso). El rol se
almacena como `text` con `check (rol in (...))` porque un ENUM no admite clave
foránea.

---

## B. Gestión académica

### `curso`

| Columna | Tipo | Null | Default | Descripción |
|---|---|---|---|---|
| `id` | uuid | NO | `gen_random_uuid()` | PK |
| `categoria_id` | uuid | sí | — | FK → `categoria` SET NULL |
| `titulo` | text | NO | — | — |
| `slug` | text | NO | — | UNIQUE, URL amigable |
| `descripcion` / `contenido` | text | sí | — | Texto largo |
| `portada_url` | text | sí | — | Bucket `portadas-curso` |
| `estado` | estado_curso | NO | `'borrador'` | borrador, en_revision, publicado, archivado |
| `precio` | numeric(10,2) | NO | `0` | check >= 0 |
| `moneda` | text | NO | `'PEN'` | ISO 4217 |
| `xp_total` | integer | NO | `0` | XP por completar el curso |
| `duracion_minutos` | integer | NO | `0` | — |
| `creado_por` | uuid | sí | — | FK → `perfil` SET NULL |
| `publicado_en` | timestamptz | sí | — | — |

### Jerarquía del contenido

```
curso → unidad → modulo → leccion → contenido
                            └──────→ recurso → material_descargable
```

| Tabla | Campos clave | Restricción |
|---|---|---|
| `unidad` | `curso_id`, `numero`, `titulo`, `xp_otorgado`, `publicado` | unique (curso_id, numero) |
| `modulo` | `unidad_id`, `numero`, `titulo` | unique (unidad_id, numero) |
| `leccion` | `modulo_id`, `numero`, `tipo_contenido`, `duracion_minutos`, `xp_otorgado`, `publicado`, `requerido_aprobacion` | unique (modulo_id, numero) |
| `contenido` | `leccion_id`, `orden`, `tipo`, `cuerpo`, `datos` | unique (leccion_id, orden) |
| `recurso` | `leccion_id`, `contenido_id`, `nombre`, `tipo`, `url`, `ruta_storage`, `tamano_bytes`, `descargable` | — |
| `material_descargable` | `recurso_id`, `ruta_storage`, `hash_sha256`, `max_descargas`, `descargas`, `requiere_matricula`, `expira_en` | unique (recurso_id, nombre) |

### `docente_curso` — Asignación docente

| Columna | Descripción |
|---|---|
| `curso_id` + `docente_id` | PK compuesta |
| `es_responsable` | Un único responsable activo por curso |
| `activo` | Permite desactivar sin perder el histórico |

Índice único parcial: `uq_docente_curso_responsable` sobre `curso_id` donde
`es_responsable and activo`.

### `requisito_previo` — Prerrequisitos

`curso_id` + `curso_requisito_id`, con `check (curso_id <> curso_requisito_id)`.

---

## C. Matrículas

### `matricula`

| Columna | Tipo | Null | Default | Descripción |
|---|---|---|---|---|
| `id` | uuid | NO | `gen_random_uuid()` | PK |
| `estudiante_id` | uuid | NO | — | FK → `perfil` CASCADE |
| `curso_id` | uuid | NO | — | FK → `curso` CASCADE |
| `estado` | estado_matricula | NO | `'pendiente_pago'` | ENUM de 6 valores |
| `precio_pagado` | numeric(10,2) | NO | `0` | — |
| `porcentaje_progreso` | numeric(5,2) | NO | `0` | check between 0 and 100 |
| `xp_ganado` | integer | NO | `0` | — |
| `matriculado_en` / `completado_en` / `cancelado_en` | timestamptz | sí | — | — |

**unique (estudiante_id, curso_id)** — una sola matrícula por par.

Tablas Satellite: `historial_matricula` (transiciones), `renovacion_matricula`
(vigencia), `cancelacion_matricula` (motivo), `acceso_curso` (permisos
puntuales).

---

## D. Pagos y comercio

### `transaccion`

| Columna | Descripción |
|---|---|
| `pedido_id` | FK → `pedido` CASCADE |
| `usuario_id` | FK → `perfil` RESTRICT |
| `estado` | ENUM: iniciado, requiere_accion, autorizado, capturado, fallido, reembolsado, anulado |
| `metodo` | ENUM: tarjeta, transferencia, yape, plazo, otro |
| `monto` / `moneda` | Importe |
| `proveedor` | `culqi` por defecto |
| `referencia` / `codigo_autorizacion` | **Tokens opacos. Nunca número de tarjeta ni CVV** |
| `clave_idempotencia` | **UNIQUE** — un reintento no duplica el cobro |
| `datos` | jsonb con metadatos del proveedor |

### Tablas del módulo

| Tabla | Clave de idempotencia | Nota |
|---|---|---|
| `pedido` | `clave_idempotencia` UNIQUE | `numero` UNIQUE |
| `detalle_pedido` | — | Snapshot del título y precio |
| `cupon` | — | `tipo`, `valor`, `usos_maximos`, `usos_actuales`, vigencia |
| `descuento` / `promocion` | — | Descuentos por curso o globales |
| `intento_pago` | unique (transaccion_id, numero) | Varios intentos por transacción |
| `webhook_pago` | `evento_id` UNIQUE | Un evento se procesa una vez |
| `reembolso` | — | Estados: solicitado, aprobado, rechazado, procesado |
| `historial_financiero` | — | Libro mayor por usuario |

---

## E. Progreso académico

| Tabla | Campos clave | UNIQUE |
|---|---|---|
| `progreso_curso` | `matricula_id`, `estudiante_id`, `curso_id`, `estado`, `porcentaje`, `lecciones_completadas`, `minutos_estudio` | (matricula_id) |
| `progreso_unidad` | `progreso_curso_id`, `unidad_id`, `porcentaje` | (progreso_curso_id, unidad_id) |
| `progreso_leccion` | `progreso_curso_id`, `leccion_id`, `xp_obtenido` | (progreso_curso_id, leccion_id) |
| `historial_progreso` | `tipo`, `valor_anterior`, `valor_nuevo`, `duracion_minutos` | Append-only |
| `actividad_completada` | `actividad_id`, `xp_obtenido` | (estudiante_id, actividad_id) |

---

## F. Actividades y evaluaciones

### `actividad` — Contenedor genérico

| Columna | Descripción |
|---|---|
| `leccion_id` / `curso_id` | FK, redundancia deliberada para consultas rápidas |
| `tipo` | ENUM: lectura, video, tarea, quiz, examen, reto, minijuego, foro |
| `puntos` / `xp_otorgado` | Recompensa |
| `tiempo_limite_minutos` / `intentos_permitidos` | Reglas |
| `publicado` | Visible para el estudiante |

### `evaluacion` y `pregunta`/`opcion`

| Tabla | Campos clave |
|---|---|
| `evaluacion` | `actividad_id` UNIQUE, `nota_maxima`, `porcentaje_aprobacion`, `intentos_permitidos`, `aleatorizar_preguntas`, `mostrar_resultado_inmediato`, `duracion_minutos` |
| `examen` | `evaluacion_id`, `fecha_apertura`, `fecha_cierre`, `intentos_maximos`, `disponible` |
| `pregunta` | `evaluacion_id`, `orden`, `tipo`, `enunciado`, `puntos`, **`es_privada`**, `requiere_revision`, `retroalimentacion` |
| `opcion` | `pregunta_id`, `orden`, `texto`, **`es_correcta`**, `valor` |
| `criterio_evaluacion` | `evaluacion_id`, `nombre`, `peso` (rubrica) |

**`es_correcta` y `es_privada` son datos protegidos**: la RLS impide que el
estudiante los lea antes de entregar.

### `intento_evaluacion` / `respuesta_evaluacion`

| Tabla | Campos clave | UNIQUE |
|---|---|---|
| `intento_evaluacion` | `evaluacion_id`, `estudiante_id`, `numero`, `estado`, `puntaje`, `puntaje_maximo`, `aprobado`, `tiempo_inicio`, `tiempo_fin` | (evaluacion_id, estudiante_id, numero) |
| `respuesta_evaluacion` | `intento_id`, `pregunta_id`, `opcion_id`, `texto_respuesta`, `es_correcta`, `puntaje_otorgado`, `retroalimentacion` | (intento_id, pregunta_id) |

### `entrega` y `calificacion`

| Tabla | Campos clave |
|---|---|
| `entrega` | `tarea_id`, `estudiante_id`, `estado`, `contenido`, `nota`, `enviada_en`, `revisada_en` |
| `entrega_archivo` | `entrega_id`, `nombre`, `ruta_storage`, `mime_type`, `tamano_bytes` |
| `calificacion` | `entrega_id` XOR `intento_id`, `estudiante_id`, `docente_id`, `nota`, `nota_maxima`, `aprobado`, `comentario` |
| `retroalimentacion` | `calificacion_id`, `autor_id`, `mensaje`, `visible_estudiante` |

`calificacion` aplica `check (num_nonnulls(entrega_id, intento_id) = 1)`.

---

## G. Retos de programación

| Tabla | Campos clave | Notas |
|---|---|---|
| `reto` | `leccion_id`, `curso_id`, `dificultad`, `tiempo_limite_seg`, `memoria_limite_mb`, `intentos_maximos`, `published` | — |
| `lenguaje` | `codigo` UNIQUE, `nombre`, `version`, `plantilla` | Catálogo |
| `caso_prueba` | `reto_id`, `orden`, `entrada`, `salida_esperada`, **`es_oculto`**, `es_ejemplo`, `peso` | unique (reto_id, orden) |
| `restriccion_reto` | `reto_id`, `tipo`, `valor` | unique (reto_id, tipo) |
| `envio_reto` | `reto_id`, `estudiante_id`, `lenguaje_id`, `codigo`, `estado`, `puntaje`, `aprobado`, **`clave_idempotencia` UNIQUE**, `ejecucion_externa_id` | — |
| `resultado_caso` | `envio_id`, `caso_prueba_id`, `estado`, `salida_obtenida`, `tiempo_ms`, `memoria_usada_mb` | unique (envio_id, caso_prueba_id) |
| `historial_ejecucion` | `envio_id`, `evento`, `detalle` | Append-only |

---

## H. Minijuegos

| Tabla | Campos clave |
|---|---|
| `motor` | `codigo` UNIQUE, `nombre`, `version_actual`, `estado`, `es_comun`, `familia` |
| `version_motor` | `motor_id`, `version`, `compatibilidad` jsonb, `activa` — unique (motor_id, version) |
| `motor_comun` | `motor_id` UNIQUE, `automatico`, `instalar_en_todas`, `activo` |
| `motor_curso` | `motor_id`, `curso_id`, `es_comun`, `version_motor_id` — unique (motor_id, curso_id) |
| `juego` | `motor_id`, `codigo` UNIQUE, `estado`, `version_juego`, `dificultad`, `xp_otorgado`, `monedas_otorgadas` |
| `configuracion_juego` | `juego_id`, `clave`, `valor` jsonb — unique (juego_id, clave) |
| `actividad_juego` | `juego_id`, `leccion_id`, `curso_id`, `orden`, `puntos`, `xp_otorgado`, `intentos_permitidos` — unique (juego_id, leccion_id) |
| `intento_juego` | `actividad_juego_id`, `estudiante_id`, `numero`, `estado`, **`clave_idempotencia` UNIQUE**, `duracion_ms` |
| `respuesta_juego` | `intento_juego_id`, `pregunta_clave`, `valor` jsonb, `es_correcta`, `puntaje` — unique (intento_juego_id, pregunta_clave) |
| `resultado_juego` | `intento_juego_id` UNIQUE, `puntaje`, `puntaje_maximo`, `precision`, `completitud`, `aciertos`, `errores`, `estrellas`, `completado`, `desglose` jsonb |
| `puntuacion_juego` | `juego_id`, `usuario_id`, `mejor_puntaje`, `partidas`, `victorias`, `mejor_tiempo_ms` — unique (juego_id, usuario_id) |
| `tiempo_juego` | `intento_juego_id`, `hito`, `tiempo_ms`, `datos` jsonb |
| `finalizacion_juego` | `intento_juego_id` UNIQUE, `duracion_total_ms`, `tiempo_activo_ms`, `pausas`, `motivo_fin` |
| `recompensa_juego` | `intento_juego_id`, `tipo`, `cantidad`, **`clave_idempotencia` UNIQUE**, `recurso_id` |

---

## I. Gamificación

| Tabla | Campos clave |
|---|---|
| `regla_progresion` | `tipo` (nivel/racha/puntos), `xp_requerido`, `valor` — unique (tipo, xp_requerido) |
| `transaccion_xp` | `usuario_id`, `xp`, `concepto` (ENUM), `referencia_tipo`, `referencia_id` — libro mayor |
| `insignia` | `codigo` UNIQUE, `xp_otorgado`, `rareza`, `activa` |
| `requisito_insignia` | `insignia_id`, `tipo`, `valor`, `curso_id` |
| `insignia_usuario` | `usuario_id`, `insignia_id`, `progreso`, `obtenida_en` — unique (usuario_id, insignia_id) |
| `racha` | `usuario_id` UNIQUE, `racha_actual`, `mejor_racha`, `ultima_actividad` |
| `historial_racha` | `usuario_id`, `fecha`, `racha` — unique (usuario_id, fecha) |
| `temporada` | `nombre` UNIQUE, `estado`, `fecha_inicio`, `fecha_fin` — check (fecha_fin > fecha_inicio) |
| `ranking` | `temporada_id`, `usuario_id`, `puntos`, `posicion` — unique (temporada_id, usuario_id) |
| `evento_gamificacion` | `nombre` UNIQUE, `fecha_inicio`, `fecha_fin` — check |
| `mision` | `evento_id`, `tipo`, `objetivo_tipo`, `objetivo_cantidad`, `xp_recompensa`, `monedas_recompensa` |
| `mision_usuario` | `mision_id`, `usuario_id`, `progreso`, `estado`, `recompensa_otorgada` — unique (mision_id, usuario_id) |
| `monedero` | `usuario_id` UNIQUE, `saldo` check >= 0 |
| `tienda_item` | `codigo` UNIQUE, `tipo`, `precio_monedas`, `precio_xp`, `stock`, `limite_por_usuario` |
| `inventario` | `usuario_id`, `tienda_item_id`, `cantidad`, **`clave_idempotencia` UNIQUE** |
| `compra_virtual` | `usuario_id`, `tienda_item_id`, `monedas_gastadas`, **`clave_idempotencia` UNIQUE** |
| `transaccion_moneda` | `usuario_id`, `monedas`, `saldo_resultante`, `concepto` |

---

## J. Certificados

| Tabla | Campos clave |
|---|---|
| `certificado` | `codigo` UNIQUE, `estado` (emitido/revocado/expirado), `emitido_en`, `expira_en`, `plantilla`, `ruta_storage`, `hash_sha256`, `veces_verificado` |
| `certificado_titular` | `certificado_id`, `usuario_id`, `nombre_completo`, `porcentaje_progreso`, `nota_final`, `es_principal` — unique (certificado_id, usuario_id) |
| `certificado_curso` | `certificado_id`, `curso_id`, `titulo_snapshot`, `horas` — unique (certificado_id, curso_id) |
| `certificado_emision` | `certificado_id`, `tipo`, **`clave_idempotencia` UNIQUE**, `actor_id`, `datos` |
| `certificado_revocacion` | `certificado_id`, `motivo` NOT NULL, `revocado_por` |

---

## K. Notificaciones y soporte

| Tabla | Campos clave |
|---|---|
| `notificacion` | `titulo`, `mensaje`, `plantilla`, `variables` jsonb, `canal` ENUM, `destinatario_id`, `entidad_tipo`, `entidad_id`, `enviar_en`, **`clave_idempotencia` UNIQUE** |
| `notificacion_destinatario` | `notificacion_id`, `usuario_id`, `canal`, `estado` ENUM, `leida_en`, `enviada_en` — unique (notificacion_id, usuario_id, canal) |
| `preferencia_notificacion` | `usuario_id`, `tipo`, `canal`, `habilitada` — unique (usuario_id, tipo, canal) |
| `mensaje` | `emisor_id`, `destinatario_id`, `hilo_id`, `asunto`, `cuerpo`, `adjuntos` jsonb, `leido_en`, `borrado_por_emisor`, `borrado_por_destinatario` |
| `ticket` | `usuario_id`, `asunto`, `descripcion`, `categoria`, `prioridad` ENUM, `estado` ENUM, `asignado_a`, `valoracion` (1-5) |
| `ticket_respuesta` | `ticket_id`, `autor_id`, `cuerpo`, `es_interna` (oculta al usuario) |
| `historial_soporte` | `ticket_id`, `evento`, `actor_id`, `datos` jsonb |

---

## L. Chatbot

| Tabla | Campos clave |
|---|---|
| `chatbot_conversacion` | `usuario_id` (NULL = anónimo), `estado` ENUM, `rol_usuario`, `modelo`, `temperatura`, `max_tokens`, `resumen`, `tokens_totales`, `escalado` |
| `chatbot_participante` | `conversacion_id`, `usuario_id`, `rol` ENUM, `puede_ver_privado` — unique (conversacion_id, usuario_id, rol) |
| `chatbot_mensaje` | `conversacion_id`, `autor_id`, `rol` ENUM, `origen` ENUM, `contenido`, `tokens_entrada`, `tokens_salida`, `latencia_ms`, `datos` jsonb, `es_privado` |
| `chatbot_historial` | `conversacion_id`, `turno`, `resumen` — unique (conversacion_id, turno) |
| `chatbot_documento` | `titulo`, `slug` UNIQUE, **`rol_minimo`** (NULL = público), `curso_id`, `origen`, `indexado`, `fragmentos`, `embedding_modelo`, `version_actual` |
| `chatbot_documento_version` | `documento_id`, `version`, `hash_sha256` — unique (documento_id, version) |
| `chatbot_fragmento` | `documento_id`, `version`, `orden`, `contenido`, `tokens`, `metadatos` jsonb, `embedding vector(1536)` (opcional) — unique (documento_id, version, orden) |
| `chatbot_referencia` | `mensaje_id`, `fragmento_id`, `documento_id`, `relevancia`, `cita` |
| `chatbot_retroalimentacion` | `mensaje_id`, `usuario_id`, `voto` (util/no_util/incorrecto) — unique (mensaje_id, usuario_id) |
| `chatbot_derivacion` | `conversacion_id`, `ticket_id`, `estado` ENUM, `motivo` NOT NULL |
| `chatbot_consumo` | `usuario_id`, `modelo`, `tokens_entrada`, `tokens_salida`, `costo`, `latencia_ms` |

---

## M. Auditoría y configuración

| Tabla | Campos clave |
|---|---|
| `evento_sistema` | `codigo` UNIQUE, `nombre`, `modulo`, `nivel` (debug/info/aviso/critico), `contiene_datos_sensibles` |
| `registro_accion` | `evento_id`, `codigo_evento`, `actor_id`, `usuario_objetivo_id`, `entidad_tipo`, `entidad_id`, `accion` ENUM, `valor_anterior` jsonb, `valor_nuevo` jsonb, `ip` inet, `agente_usuario`, `ruta`, `metodo`, `exito`, `correlation_id`, `duracion_ms` |
| `cambio_administrativo` | `admin_id`, `entidad_tipo`, `campo`, `valor_anterior`, `valor_nuevo`, `motivo` NOT NULL, `revertido_en` |
| `historial_modificacion` | `entidad_tipo`, `entidad_id`, `campo`, `valor_anterior`, `valor_nuevo`, `actor_id`, `origen` |
| `configuracion` | `clave` UNIQUE, `valor` jsonb, `tipo` ENUM, `categoria`, `editable`, `es_secreta` |
| `parametro_sistema` | `clave` UNIQUE, `valor` text, `tipo`, `categoria`, `solo_lectura` |
| `evento_plataforma` | `tipo`, `entidad`, `entidad_id`, `actor_id`, `datos` jsonb — auditoría de negocio |
| `auditoria_acceso` | `usuario_id`, `email`, `evento`, `exito`, `ip` inet, `agente_usuario` — auditoría de autenticación |
