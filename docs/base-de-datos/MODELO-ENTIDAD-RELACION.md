# Modelo Entidad-Relacion — InkaQuest

Diagrama ER del esquema implementado en Supabase. Refleja exactamente las 121
tablas creadas por las migraciones.

## 1. Panorama general

```mermaid
erDiagram
    auth_users ||--o| perfil : "extiende"
    perfil ||--o{ matricula : "se matricula"
    perfil ||--o{ solicitud_docente : "solicita rol docente"
    perfil ||--o{ curso : "crea"
    perfil ||--o{ docente_curso : "imparte"
    curso ||--o{ docente_curso : "asignado a"
    curso ||--o{ unidad : "contiene"
    unidad ||--o{ modulo : "agrupa"
    modulo ||--o{ leccion : "contiene"
    leccion ||--o{ contenido : "ordena"
    leccion ||--o{ recurso : "adjunta"
    leccion ||--o{ actividad : "evalua"
    curso ||--o{ matricula : "recibe"
    matricula ||--o{ progreso_curso : "genera"
    progreso_curso ||--o{ progreso_unidad : "detalla"
    progreso_curso ||--o{ progreso_leccion : "detalla"
    actividad ||--o| tarea : "especializa"
    actividad ||--o| evaluacion : "especializa"
    evaluacion ||--o{ pregunta : "contiene"
    pregunta ||--o{ opcion : "opciones"
    evaluacion ||--o{ intento_evaluacion : "intentos"
    intento_evaluacion ||--o{ respuesta_evaluacion : "respuestas"
    tarea ||--o{ entrega : "entregas"
    entrega ||--o{ entrega_archivo : "adjuntos"
    entrega ||--o| calificacion : "califica"
    intento_evaluacion ||--o| calificacion : "califica"
```

## 2. Módulo A — Identidad y seguridad

```mermaid
erDiagram
    auth_users ||--o| perfil : "1:1 (id = auth.uid)"
    perfil ||--o{ solicitud_docente : "solicita"
    solicitud_docente ||--o{ aprobacion_docente : "decisiones"
    perfil ||--o{ auditoria_acceso : "registra"
    perfil ||--o{ preferencia_usuario : "configura"
    permiso ||--o{ rol_permiso : "asigna"
    rol_permiso }o--|| perfil : "rol (estudiante|docente|administrador)"
```

**Puntos clave**

- `perfil.id` **es** `auth.users.id`: no hay tabla de usuarios paralela ni
  contraseñas duplicadas.
- El rol por defecto de `perfil` es `estudiante`. El registro público nunca
  crea docentes ni administradores.
- `aprobacion_docente` conserva el histórico de cada decisión sobre una
  solicitud.

## 3. Módulo B — Gestión académica

```mermaid
erDiagram
    categoria ||--o{ curso : "clasifica"
    curso ||--o{ docente_curso : "docentes"
    perfil ||--o{ docente_curso : "imparte"
    curso ||--o{ unidad : "unidades"
    unidad ||--o{ modulo : "modulos"
    modulo ||--o{ leccion : "lecciones"
    leccion ||--o{ contenido : "contenido"
    leccion ||--o{ recurso : "recursos"
    recurso ||--o{ material_descargable : "descargas"
    curso ||--o{ requisito_previo : "requisitos"
    curso ||--o{ historial_publicacion : "publicaciones"
```

`curso` referencia a sí mismo mediante `requisito_previo`, con la restricción
`curso_id <> curso_requisito_id` que impide el auto-requisito.

## 4. Módulo C — Matrículas

```mermaid
erDiagram
    perfil ||--o{ matricula : "estudiante"
    curso ||--o{ matricula : "curso"
    matricula ||--o{ historial_matricula : "transiciones"
    matricula ||--o{ renovacion_matricula : "renovaciones"
    matricula ||--o{ cancelacion_matricula : "cancelaciones"
    matricula ||--o| acceso_curso : "habilita"
```

`unique (estudiante_id, curso_id)`: una sola matrícula por estudiante y curso.

## 5. Módulo D — Pagos y comercio

```mermaid
erDiagram
    perfil ||--o{ carrito : "posee"
    carrito ||--o{ item_carrito : "items"
    curso ||--o{ item_carrito : "producto"
    perfil ||--o{ pedido : "compra"
    pedido ||--o{ detalle_pedido : "lineas"
    curso ||--o{ detalle_pedido : "producto"
    cupon ||--o{ pedido : "aplica"
    descuento ||--o{ promocion : "promociona"
    cupon ||--o{ promocion : "promociona"
    pedido ||--o{ transaccion : "transacciones"
    transaccion ||--o{ intento_pago : "intentos"
    transaccion ||--o{ webhook_pago : "webhooks"
    transaccion ||--o{ reembolso : "reembolsos"
    perfil ||--o{ historial_financiero : "movimientos"
```

**Reglas de integridad**

| Regla | Implementación |
|---|---|
| Idempotencia del pedido | `pedido.clave_idempotencia` UNIQUE |
| Idempotencia del cobro | `transaccion.clave_idempotencia` UNIQUE |
| Idempotencia del webhook | `webhook_pago.evento_id` UNIQUE |
| La matrícula solo se activa con pago | Trigger `fn_activar_matricula_tras_pago` |
| Sin datos de tarjeta | Solo `referencia` y `codigo_autorizacion` (tokens opacos) |

## 6. Módulo E — Progreso académico

```mermaid
erDiagram
    matricula ||--o| progreso_curso : "genera"
    perfil ||--o{ progreso_curso : "estudiante"
    curso ||--o{ progreso_curso : "curso"
    progreso_curso ||--o{ progreso_unidad : "unidades"
    progreso_curso ||--o{ progreso_leccion : "lecciones"
    progreso_curso ||--o{ historial_progreso : "historial"
    perfil ||--o{ actividad_completada : "registra"
```

`fn_registrar_completado_leccion()` recalcula los tres niveles de progreso de
forma transaccional e idempotente.

## 7. Módulo F — Actividades y evaluaciones

```mermaid
erDiagram
    leccion ||--o{ actividad : "contiene"
    curso ||--o{ actividad : "curso"
    actividad ||--o| tarea : "tarea"
    actividad ||--o| evaluacion : "evaluacion"
    evaluacion ||--o{ examen : "programa"
    evaluacion ||--o{ criterio_evaluacion : "rubrica"
    evaluacion ||--o{ pregunta : "preguntas"
    pregunta ||--o{ opcion : "opciones"
    evaluacion ||--o{ intento_evaluacion : "intentos"
    intento_evaluacion ||--o{ respuesta_evaluacion : "respuestas"
    tarea ||--o{ entrega : "entregas"
    entrega ||--o{ entrega_archivo : "adjuntos"
    entrega ||--o| calificacion : "calificacion"
    intento_evaluacion ||--o| calificacion : "calificacion"
    calificacion ||--o{ retroalimentacion : "retroalimentacion"
```

**Datos protegidos**: `opcion.es_correcta` y `pregunta.es_privada` solo son
legibles por el docente del curso o un administrador (ver
[MATRIZ-RLS.md](MATRIZ-RLS.md)).

`calificacion` tiene `check (num_nonnulls(entrega_id, intento_id) = 1)`: una
calificación corresponde a una entrega **o** a un intento, nunca a ambos.

## 8. Módulo G — Retos de programación

```mermaid
erDiagram
    leccion ||--o{ reto : "contiene"
    curso ||--o{ reto : "curso"
    reto ||--o{ caso_prueba : "casos"
    reto ||--o{ restriccion_reto : "restricciones"
    lenguaje ||--o{ envio_reto : "lenguaje"
    reto ||--o{ envio_reto : "envios"
    envio_reto ||--o{ resultado_caso : "resultados"
    envio_reto ||--o{ historial_ejecucion : "traza"
```

`caso_prueba.es_oculto = true` protege la solución: el estudiante solo ve los
casos marcados como `es_ejemplo`.

## 9. Módulo H — Motores de minijuegos

```mermaid
erDiagram
    motor ||--o{ version_motor : "versiones"
    motor ||--o| motor_comun : "disponibilidad global"
    motor ||--o{ motor_curso : "asociado a"
    curso ||--o{ motor_curso : "usa"
    motor ||--o{ juego : "implementa"
    version_motor ||--o{ juego : "version"
    juego ||--o{ configuracion_juego : "parametros"
    juego ||--o{ actividad_juego : "se instala en"
    leccion ||--o{ actividad_juego : "leccion"
    actividad_juego ||--o{ intento_juego : "partidas"
    intento_juego ||--o{ respuesta_juego : "respuestas"
    intento_juego ||--o| resultado_juego : "veredicto"
    juego ||--o{ puntuacion_juego : "tabla de mando"
    intento_juego ||--o{ tiempo_juego : "hitos"
    intento_juego ||--o| finalizacion_juego : "cierre"
    intento_juego ||--o{ recompensa_juego : "recompensas"
```

**Separación de conceptos** (clave para no confundir):

| Concepto | Tabla | Función |
|---|---|---|
| Motor | `motor` | El framework que ejecuta juegos. Sin datos de juego. |
| Versión | `version_motor` | Una versión concreta del motor. |
| Común o específico | `motor_comun` / `motor_curso.es_comun` | Disponibilidad global o por curso. |
| Juego | `juego` | Un juego concreto dentro de un motor. |
| Configuración | `configuracion_juego` | Datos (clave/valor) que definen la partida. |
| Actividad | `actividad_juego` | El juego instalado en una lección. |
| Intento | `intento_juego` | Una partida empezada. |
| Respuesta | `respuesta_juego` | Lo que el usuario contesta. |
| Resultado | `resultado_juego` | Puntaje, precisión, completitud. |
| Recompensa | `recompensa_juego` | Lo que otorga la partida. |

**Extensibilidad**: agregar un motor nuevo requiere solo insertar en `motor`
y `version_motor`. No hay que alterar el modelo: `configuracion_juego` (JSONB)
absorbe las particularidades de cada juego.

## 10. Módulo I — Gamificación

```mermaid
erDiagram
    perfil ||--o{ transaccion_xp : "historial XP"
    regla_progresion ||--o{ transaccion_xp : "determina nivel"
    insignia ||--o{ requisito_insignia : "requisitos"
    insignia ||--o{ insignia_usuario : "obtenidas"
    perfil ||--o{ insignia_usuario : "logros"
    perfil ||--o{ racha : "racha"
    perfil ||--o{ historial_racha : "historial"
    temporada ||--o{ ranking : "clasifica"
    perfil ||--o{ ranking : "participa"
    evento_gamificacion ||--o{ mision : "convoca"
    mision ||--o{ mision_usuario : "progreso"
    perfil ||--o{ monedero : "monedas"
    tienda_item ||--o{ inventario : "posee"
    perfil ||--o{ inventario : "inventario"
    tienda_item ||--o{ compra_virtual : "comprado"
```

`transaccion_xp` es un **libro mayor append-only**: permite auditar de dónde
sale cada punto.

## 11. Módulo J — Certificados

```mermaid
erDiagram
    certificado ||--o{ certificado_titular : "titulares"
    perfil ||--o{ certificado_titular : "obtiene"
    certificado ||--o{ certificado_curso : "cursos"
    curso ||--o{ certificado_curso : "certifica"
    certificado ||--o{ certificado_emision : "emisiones"
    certificado ||--o{ certificado_revocacion : "revocaciones"
```

`certificado.codigo` es único y sirve como código de verificación pública.

## 12. Módulo K — Notificaciones y soporte

```mermaid
erDiagram
    notificacion ||--o{ notificacion_destinatario : "entregas"
    perfil ||--o{ notificacion_destinatario : "recibe"
    perfil ||--o{ preferencia_notificacion : "preferencias"
    perfil ||--o{ mensaje : "envia"
    perfil ||--o{ mensaje : "recibe"
    perfil ||--o{ ticket : "abre"
    ticket ||--o{ ticket_respuesta : "respuestas"
    ticket ||--o{ historial_soporte : "historial"
```

## 13. Módulo L — Chatbot

```mermaid
erDiagram
    chatbot_conversacion ||--o{ chatbot_participante : "participantes"
    chatbot_conversacion ||--o{ chatbot_mensaje : "mensajes"
    chatbot_conversacion ||--o{ chatbot_historial : "resumenes"
    chatbot_conversacion ||--o{ chatbot_derivacion : "escalado"
    chatbot_documento ||--o{ chatbot_documento_version : "versiones"
    chatbot_documento ||--o{ chatbot_fragmento : "fragmentos"
    chatbot_mensaje ||--o{ chatbot_referencia : "respaldado por"
    chatbot_fragmento ||--o{ chatbot_referencia : "citado"
    chatbot_mensaje ||--o{ chatbot_retroalimentacion : "votos"
    perfil ||--o{ chatbot_consumo : "consumo"
```

`chatbot_fragmento.embedding` es `vector(1536)` cuando pgvector está
disponible; si no, la búsqueda funciona por trigram sobre `tokens`.

## 14. Módulo M — Auditoría y configuración

```mermaid
erDiagram
    evento_sistema ||--o{ registro_accion : "cataloga"
    perfil ||--o{ registro_accion : "actor"
    perfil ||--o{ cambio_administrativo : "admin"
    configuracion {
        uuid id PK
        text clave UK
        jsonb valor
        bool es_secreta
    }
    parametro_sistema {
        uuid id PK
        text clave UK
        text valor
        bool solo_lectura
    }
```

`registro_accion` guarda `valor_anterior` y `valor_nuevo` en JSONB, lo que
permite reconstruir el estado anterior de cualquier entidad.

## 15. Convenciones aplicadas

| Convención | Detalle |
|---|---|
| Claves primarias | `uuid` con `gen_random_uuid()` (pgcrypto) |
| Claves foráneas | `on delete cascade` en dependientes, `set null` en referencias débiles, `restrict` en lo que no se debe borrar |
| Fechas | `timestamptz` con `default now()` |
| Dinero | `numeric(10,2)` con `check (>= 0)` |
| Estados | Tipos ENUM nativos (38 definidos) |
| Booleanos | `boolean not null default ...` |
| JSONB | Solo cuando la estructura es abierta (`configuracion_juego`, `datos`, `variables`) |
| Timestamps de auditoría | `creado_en` y `actualizado_en` con trigger automático |
