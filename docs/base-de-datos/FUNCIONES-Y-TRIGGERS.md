# Funciones y triggers — InkaQuest

Las **57 funciones** y **64 triggers** del esquema.

## 1. Clasificación de seguridad

| Función | Modo | `search_path` | Puede ejecutar `anon`/`authenticated` |
|---|---|---|---|
| `fn_actualizar_timestamp` | INVOKER | (por defecto) | Sí |
| `fn_escritura_sistema` | INVOKER | (por defecto) | Sí (solo lectura) |
| `fn_historial_matricula` | INVOKER | (por defecto) | Solo como trigger |
| `fn_activar_escritura_sistema` | DEFINER | `""` | No (revocado a PUBLIC) |
| `fn_desactivar_escritura_sistema` | DEFINER | `""` | No |
| `fn_contexto_usuario` | DEFINER | `""` | Solo `service_role` y `inkaquest_api` |
| `fn_validar_contexto_backend` | DEFINER | `""` | Diagnóstico |
| `fn_registrar_xp` | DEFINER | `""` | `service_role`, `authenticated` |
| `fn_registrar_completado_leccion` | DEFINER | `""` | `service_role`, `authenticated` |
| `fn_otorgar_insignia` | DEFINER | `""` | `service_role`, `authenticated` |
| `fn_actualizar_racha` | DEFINER | `""` | `service_role`, `authenticated` |
| `fn_otorgar_monedas` | DEFINER | `""` | `service_role`, `authenticated` |
| `fn_registrar_resultado_juego` | DEFINER | `""` | `service_role`, `authenticated` |
| `fn_activar_matricula_tras_pago` | DEFINER | `""` | Solo trigger |
| `fn_perfil_no_escalable` | DEFINER | `""` | Solo trigger |

**Regla aplicada**: toda función `SECURITY DEFINER` lleva `set search_path = ''`
y referencia los objetos con nombre completo (`public.tabla`). Esto impide que
un objeto malicioso colocado en el esquema de búsqueda intercepte las
llamadas.

## 2. Funciones de contexto de autorización

### `app_user_id() → uuid`

Lee la variable de transacción `app.current_user_id`.

```sql
create or replace function public.app_user_id()
returns uuid language plpgsql stable set search_path = ''
as $$
declare v_raw text;
begin
    v_raw := current_setting('app.current_user_id', true);
    if v_raw is null or v_raw = '' then return null; end if;
    return v_raw::uuid;
exception when others then return null;
end;
$$;
```

| Aspecto | Detalle |
|---|---|
| Modo | INVOKER (necesita leer el GUC de la sesión) |
| Estabilidad | STABLE (no cambia dentro de la transacción) |
| Cuando es NULL | No hay contexto: sesión administrativa o llamada sin usuario |

### `app_user_role() → rol_usuario`

**Lee el rol de `public.perfil`, nunca de una variable.** Es la pieza que
impide el escalamiento de privilegios: aunque alguien pudiera escribir la
variable `app.current_user_rol`, el rol efectivo seguiría siendo el de la base.

```sql
select pr.rol into v_role
  from public.perfil pr
 where pr.id = v_user;
```

> Nota técnica: el alias `pr` es obligatorio. Con un alias de una sola letra
> (`p`), PostgreSQL interpreta `p.rol` como referencia al **tipo ENUM**
> `rol_usuario` en lugar de a la columna, y la consulta falla.

### `efectivo_user_id() → uuid`

Unifica los dos caminos de acceso:

```sql
select coalesce(
    public.app_user_id(),
    nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'sub', '')::uuid
);
```

| Origen | Contexto |
|---|---|
| `app_user_id()` | Backend con conexión directa (`SET LOCAL`) |
| `request.jwt.claims` | PostgREST con el JWT del usuario |

### Funciones de verificación

| Función | Devuelve | Uso en políticas |
|---|---|---|
| `app_is_admin()` | `boolean` | Acceso total de administración |
| `app_is_docente()` | `boolean` | Gestión de contenido pedagógico |
| `app_is_estudiante()` | `boolean` | Restricciones del rol estudiante |
| `app_esta_matriculado(curso)` | `boolean` | Acceso al contenido de un curso |
| `app_es_docente_del_curso(curso)` | `boolean` | Gestión de cursos asignados |
| `app_es_docente_de_leccion(leccion)` | `boolean` | Gestión de una lección concreta |

`app_es_docente_de_leccion` resuelve la jerarquía:

```
leccion → modulo → unidad → curso → docente_curso
```

Todas son `SECURITY DEFINER` con `search_path = ''` para evitar políticas
recursivas.

## 3. Funciones de motor de gamificación

### `fn_registrar_xp(usuario, xp, concepto, ref_tipo, ref_id) → integer`

Otorga XP, lo registra en el libro mayor `transaccion_xp` y recalcula el nivel.

```sql
update public.perfil set xp = greatest(0, xp + p_xp)
 where id = p_usuario_id returning xp into v_nuevo_xp;

insert into public.transaccion_xp (...) values (...);

select greatest(1, count(*))::integer into v_nuevo_nivel
  from public.regla_progresion r
 where r.activa and r.tipo = 'nivel' and r.xp_requerido <= v_nuevo_xp;
```

**Nivel = número de umbrales de XP alcanzados.** Con las reglas de referencia
(0, 100, 250, 500, 1000, 5000) el usuario alcanza el nivel 3 al llegar a 250 XP.

### `fn_registrar_completado_leccion(estudiante, curso, leccion, minutos) → numeric`

Función central del progreso. En una sola transacción:

1. Localiza la matrícula activa (error si no existe).
2. Crea el `progreso_curso` si es la primera actividad.
3. Marca la lección como completada (**idempotente**: no suma tiempo dos veces
   ni vuelve a otorgar XP).
4. Otorga el XP de la lección (verifica que no exista ya la transacción).
5. Recalcula el porcentaje del curso contando lecciones completadas.
6. Actualiza `progreso_curso` y `matricula`.
7. Registra el movimiento en `historial_progreso`.

### `fn_otorgar_insignia(usuario, insignia, clave) → boolean`

Idempotente: devuelve `true` la primera vez y `false` si ya la tenía. Otorga
también el XP asociado.

### `fn_actualizar_racha(usuario) → integer`

Incrementa la racha si la actividad es del día siguiente, la reinicia si pasó
más de un día, y no hace nada si ya hay actividad hoy. Otorga el XP de racha
configurado en `regla_progresion` (tipo `racha`).

### `fn_otorgar_monedas(usuario, cantidad, concepto, clave) → integer`

Acredita monedas en el monedero y registra el movimiento. **Idempotente** por
`clave`: si la clave ya se usó, no vuelve a acreditar.

## 4. Funciones de minijuegos

### `fn_registrar_resultado_juego(...) → jsonb`

Registra el veredicto de una partida de forma idempotente:

1. Crea o actualiza `resultado_juego` (unique en `intento_juego_id`).
2. Actualiza el estado del intento a `completado`/`fallido`.
3. Actualiza `puntuacion_juego` (mejor puntaje, partidas, victorias, mejor
   tiempo) con `ON CONFLICT DO UPDATE`.
4. Otorga la recompensa de XP con clave de idempotencia
   (`'juego:<intento_id>:xp'`).

## 5. Funciones de autorización del backend

### `fn_contexto_usuario(usuario_id)`

Establece el contexto de la transacción actual:

```sql
perform set_config('app.current_user_id', p_usuario_id::text, true);
```

El tercer parámetro `true` significa **transaction-local**: el valor desaparece
al terminar la transacción. Es esencial para que no se contamine la siguiente
petición.

### `fn_validar_contexto_backend() → jsonb`

Diagnóstico del estado de autorización:

```json
{
  "contexto_establecido": true,
  "usuario_id": "…",
  "rol_efectivo": "docente",
  "es_admin": false,
  "current_user": "inkaquest_api",
  "instruccion": "Contexto activo. El rol se lee de public.perfil (no es falsificable)."
}
```

## 6. Triggers

### 6.1 `trg_actualizar_timestamp` — 60 triggers

Mantenimiento automático de `actualizado_en`.

| Tabla | Disparador |
|---|---|
| `perfil`, `solicitud_docente`, `preferencia_usuario` | BEFORE UPDATE |
| `categoria`, `curso`, `unidad`, `modulo`, `leccion`, `contenido`, `recurso`, `material_descargable` | BEFORE UPDATE |
| `carrito`, `pedido`, `cupon`, `descuento`, `promocion`, `transaccion`, `reembolso` | BEFORE UPDATE |
| `regla_progresion`, `insignia`, `racha`, `temporada`, `evento_gamificacion`, `mision`, `monedero`, `tienda_item` | BEFORE UPDATE |
| `progreso_curso`, `progreso_unidad`, `progreso_leccion`, `actividad`, `tarea`, `evaluacion`, `examen`, `pregunta`, `intento_evaluacion`, `respuesta_evaluacion`, `entrega`, `calificacion` | BEFORE UPDATE |
| `reto`, `envio_reto`, `motor`, `version_motor`, `motor_comun`, `motor_curso`, `juego`, `configuracion_juego`, `actividad_juego`, `intento_juego`, `respuesta_juego` | BEFORE UPDATE |
| `certificado`, `certificado_titular`, `ticket`, `mensaje`, `chatbot_conversacion`, `chatbot_documento`, `chatbot_derivacion`, `chatbot_retroalimentacion`, `configuracion`, `parametro_sistema` | BEFORE UPDATE |

### 6.2 `trg_crear_perfil_al_registrar`

**AFTER INSERT ON `auth.users`** — crea el perfil de aplicación cuando un
usuario se registra.

```sql
insert into public.perfil (id, email, nombre, rol)
values (new.id, coalesce(new.email,''), …, 'estudiante')
on conflict (id) do nothing;
```

| Aspecto | Detalle |
|---|---|
| Rol inicial | **siempre `estudiante`** |
| Motivo | El registro público nunca crea docentes ni administradores |
| `on conflict` | Idempotente si el perfil ya existía |
| Disparado por | Supabase Auth, no por la aplicación |

### 6.3 `trg_perfil_no_escalable` — el guardián del perfil

**BEFORE UPDATE ON `perfil`**. Impide que un usuario manipule sus propios
privilegios.

```sql
if public.fn_escritura_sistema() then
    return new;   -- escritura del motor: se permite
end if;

if new.rol is distinct from old.rol
   and not public.app_is_admin() then
    raise exception 'El rol solo puede ser modificado por un administrador.';
end if;

if (new.xp is distinct from old.xp
    or new.nivel is distinct from old.nivel
    or new.racha_dias is distinct from old.racha_dias)
   and not public.app_is_admin() then
    raise exception 'La progresion (XP, nivel, racha) no puede modificarse manualmente.';
end if;
```

**La válvula de escape** es `fn_escritura_sistema()`: el motor de gamificación
(envuelve sus escrituras con `fn_activar_escritura_sistema()` /
`fn_desactivar_escritura_sistema()`). Ese flag solo puede activarlo el código de
confianza, porque el permiso `SET` sobre la variable se revoca a `PUBLIC` en
la migración 0009.

| Cambio | estudiante | docente | admin | motor del sistema |
|---|---|---|---|---|
| `rol` | Bloqueado | Bloqueado | Permitido | Permitido |
| `xp` / `nivel` / `racha_dias` | Bloqueado | Bloqueado | Permitido | Permitido |
| `estado_cuenta` | Bloqueado | Bloqueado | Permitido | Permitido |
| Nombre, avatar, bio | Permitido | Permitido | Permitido | Permitido |

### 6.4 `trg_activar_matricula_tras_pago`

**AFTER INSERT OR UPDATE OF estado ON `transaccion`**.

```sql
if new.estado = 'capturado' and (tg_op = 'INSERT' or old.estado is distinct from 'capturado') then
    update public.matricula m
       set estado = 'activa', matriculado_en = coalesce(m.matriculado_en, now()), …
      from public.detalle_pedido dp
     where dp.pedido_id = v_pedido and dp.curso_id = m.curso_id
       and m.estudiante_id = new.usuario_id and m.estado = 'pendiente_pago';

    update public.pedido set estado = 'pagado' where id = v_pedido and estado in ('pendiente','procesando');

    insert into public.evento_plataforma (...) values ('pago_capturado', …);
end if;
```

| Aspecto | Detalle |
|---|---|
| Condición | Solo cuando la transacción pasa a `capturado` |
| Efecto | Activa las matrículas del pedido y marca el pedido como pagado |
| Auditoría | Registra el evento en `evento_plataforma` |
| Garantía | **Ningún camino puede activar una matrícula sin pago confirmado** |

### 6.5 `trg_historial_matricula`

**AFTER INSERT OR UPDATE OF estado ON `matricula`** — registra toda transición
de estado en `historial_matricula`, con el estado anterior, el nuevo y el
actor (`app_user_id()`).

## 7. Tablas de auditoría alimentadas por triggers

| Trigger | Alimenta | Tipo |
|---|---|---|
| `trg_crear_perfil_al_registrar` | `perfil` | Automático |
| `trg_perfil_no_escalable` | — | Control (rechaza) |
| `trg_activar_matricula_tras_pago` | `evento_plataforma` | Automático |
| `trg_historial_matricula` | `historial_matricula` | Automático |
| `fn_registrar_xp` | `transaccion_xp` | Explícito |
| `fn_actualizar_racha` | `historial_racha` | Explícito |
| `fn_otorgar_monedas` | `transaccion_moneda` | Explícito |
| `fn_registrar_resultado_juego` | `recompensa_juego` | Explícito |

## 8. Patrones de idempotencia

Todo el sistema usa claves de idempotencia para que reintentos no dupliquen
efectos:

| Función / tabla | Clave |
|---|---|
| `fn_registrar_completado_leccion` | Verifica `transaccion_xp` existente antes de otorgar |
| `fn_otorgar_insignia` | `insignia_usuario` con `obtenida_en` no nulo |
| `fn_otorgar_monedas` | `transaccion_moneda.referencia_id` = clave |
| `fn_registrar_resultado_juego` | `resultado_juego` unique por intento |
| `recompensa_juego` | `clave_idempotencia` UNIQUE |
| `pedido`, `transaccion`, `compra_virtual`, `inventario` | `clave_idempotencia` UNIQUE |
| `webhook_pago` | `evento_id` UNIQUE |
| `certificado_emision`, `notificacion` | `clave_idempotencia` UNIQUE |
