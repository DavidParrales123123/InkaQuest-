# Matriz RLS — InkaQuest

Matriz de políticas de Row Level Security. Refleja las **209 políticas**
verificadas en la base de datos.

## 1. Resumen

| Métrica | Valor |
|---|---|
| Tablas en `public` | 121 |
| Tablas con `enable row level security` | 121 (100%) |
| Tablas con `force row level security` | 121 (100%) |
| Políticas creadas | 209 |
| Tablas con política para `anon` | 16 |
| Tablas con política para `authenticated` | 121 |

`FORCE ROW LEVEL SECURITY` es clave: sin él, el **propietario** de la tabla
(supervisor) saltaría las políticas. Con él, ni siquiera el propietario puede
evadirlas.

## 2. Funciones de contexto

Todas las políticas se apoyan en estas funciones:

| Función | Devuelve | Notas |
|---|---|---|
| `app_user_id()` | `uuid` | Lee `app.current_user_id` (contexto de transacción) |
| `app_user_role()` | `rol_usuario` | **Lee de `public.perfil`**, no de una variable |
| `efectivo_user_id()` | `uuid` | `app_user_id()` o el `sub` del JWT (PostgREST) |
| `app_is_admin()` | `boolean` | Rol = administrador |
| `app_is_docente()` | `boolean` | Rol = docente |
| `app_esta_matriculado(curso)` | `boolean` | Matrícula activa o completada |
| `app_es_docente_del_curso(curso)` | `boolean` | Asignación activa en `docente_curso` |
| `app_es_docente_de_leccion(leccion)` | `boolean` | Resuelve la jerarquía unidad→curso |
| `fn_escritura_sistema()` | `boolean` | TRUE si la escritura viene del motor del sistema |

### Por qué el rol se lee de la tabla

```sql
select pr.rol into v_role from public.perfil pr where pr.id = v_user;
```

Si el rol se leyera de una variable de sesión (`app.current_user_rol`), un
cliente podría escribirla y convertirse en administrador. Leyéndolo de la
base, **el rol efectivo es siempre el que tiene el usuario en `perfil`**.

## 3. Matriz por rol

| Recurso | Anónimo | Estudiante | Docente | Administrador |
|---|---|---|---|---|
| `categoria` | Lectura (activos) | Lectura | Lectura | Total |
| `curso` | Lectura (publicados) | Lectura (publicados) | Lectura + edición de asignados | Total |
| `unidad` / `modulo` | Lectura (publicados) | Lectura | CRUD de asignados | Total |
| `leccion` / `contenido` | Lectura (publicados) | Lectura | CRUD de asignados | Total |
| `recurso` | Lectura | Lectura | CRUD de asignados | Total |
| `material_descargable` | Sin acceso | Lectura **si está matriculado** | Total | Total |
| `perfil` | Sin acceso | Lectura/edición del propio | Lectura de estudiantes de sus cursos | Total |
| `matricula` | Sin acceso | Lectura de la propia | Lectura de sus cursos | Total |
| `calificacion` | Sin acceso | **Lectura de la propia** | Lectura y **escritura** en sus cursos | Total |
| `opcion` (`es_correcta`) | Sin acceso | Lectura **solo de preguntas públicas** | Total de su curso | Total |
| `pregunta` | Sin acceso | Lectura **solo de las no privadas** | Total de su curso | Total |
| `caso_prueba` | Sin acceso | Lectura **solo de los de ejemplo** | Total de su curso | Total |
| `envio_reto` | Sin acceso | Lectura/inserción propios | Lectura de sus cursos | Total |
| `transaccion` / `pago` | Sin acceso | Lectura de las propias | Sin acceso | Total |
| `webhook_pago` | Sin acceso | Sin acceso | Sin acceso | Total |
| `insignia_usuario` | Sin acceso | Lectura propia | Lectura propia | Total |
| `transaccion_xp` | Sin acceso | Lectura propia | Lectura propia | Total |
| `monedero` | Sin acceso | Lectura propia | Lectura propia | Total |
| `certificado` | Lectura (emitidos) | Lectura de los propios | Lectura | Total |
| `ticket` | Sin acceso | Lectura/creación propios | Lectura de asignados | Total |
| `registro_accion` | Sin acceso | Sin acceso | Sin acceso | Total |
| `configuracion` | Sin acceso | Lectura de no secretas | Lectura de no secretas | Total |

## 4. Reglas críticas y su implementación

### 4.1 El estudiante no modifica sus notas

`calificacion` no tiene permiso `INSERT` para `authenticated`, solo `UPDATE`.
Y la política de escritura exige:

```sql
using (
    public.app_is_admin()
    or exists (... public.app_es_docente_del_curso(a.curso_id) ...)
)
```

Un estudiante que intente `UPDATE` no ve la fila: **RLS filtra en silencio y
afecta 0 filas**. Verificado en la prueba *"El UPDATE del estudiante no altera
filas (RLS filtra)"*.

### 4.2 El estudiante no se asigna XP ni insignias

Dos mecanismos:

1. **Trigger `trg_perfil_no_escalable`** — rechaza cualquier cambio manual de
   `xp`, `nivel`, `racha_dias`, `rol` o `estado_cuenta` que no provenga del
   sistema o de un administrador.
2. **Políticas** — `insignia_usuario`, `monedero`, `transaccion_xp` solo
   admiten escritura del administrador.

El motor de gamificación sí puede escribir porque se marca la transacción con
`fn_activar_escritura_sistema()`, flag que **solo el código de confianza**
puede activar (el permiso `SET` sobre la variable se revoca a `PUBLIC`).

### 4.3 El docente no administra cursos ajenos

Toda gestión de contenido pedagógico pasa por
`app_es_docente_del_curso(curso_id)` o `app_es_docente_de_leccion(leccion_id)`.

### 4.4 El anónimo no accede a información privada

Los permisos de `anon` se limitan a 13 tablas de catálogo:

```sql
grant select on
    public.categoria, public.curso, public.unidad, public.modulo, public.leccion,
    public.contenido, public.recurso, public.material_descargable,
    public.motor, public.version_motor, public.juego, public.configuracion_juego,
    public.certificado, public.certificado_titular, public.certificado_curso
to anon;
```

Tablas como `matricula`, `perfil`, `calificacion` o `transaccion` **no tienen
permiso** para `anon`: el acceso se rechaza antes de evaluar la RLS. Es una
defensa en profundidad: permiso → RLS → trigger.

### 4.5 La matrícula solo se activa con pago confirmado

El trigger `trg_activar_matricula_tras_pago` (en `transaccion`) cambia
`matricula.estado` a `activa` **únicamente** cuando la transacción pasa a
`capturado`. Ningún camino (webhook, backend o SQL manual) puede activar una
matrícula sin pago verificado.

### 4.6 Sin políticas recursivas

Las funciones de apoyo (`app_es_docente_del_curso`, `app_esta_matriculado`) son
`SECURITY DEFINER` con `set search_path = ''` y consultan con el privilegio del
propietario, por lo que no disparan políticas sobre las mismas tablas.

### 4.7 `search_path` seguro en funciones privilegiadas

Todas las funciones `SECURITY DEFINER` llevan `set search_path = ''` y
referencian los objetos con nombre completo (`public.tabla`), lo que impide que
un objeto malicioso en el esquema de búsqueda intercepte las llamadas.

## 5. Permisos por rol de base de datos

| Rol | Puede leer | Puede escribir | Notas |
|---|---|---|---|
| `anon` | 15 tablas de catálogo | **Nada** | Todo lo demás se rechaza por permiso |
| `authenticated` | Todas | Según tabla y política | RLS acota filas y columnas |
| `service_role` | Todas | Todas | Salta RLS. **Solo en el backend** |
| `inkaquest_api` | Todas | Todas | Rol dedicado del backend. **No** es superusuario: no puede alterar el esquema ni saltarse RLS |
| `postgres` | Todas | Todas | Propietario. Con `FORCE RLS`, tampoco salta las políticas |

### 4.1 Los default privileges de Supabase (hallazgo importante)

Supabase define permisos por defecto para el esquema `public`:

```
postgres=arwdDxtm/postgres, anon=arwdDxtm/postgres,
authenticated=arwdDxtm/postgres, service_role=arwdDxtm/postgres
```

Es decir, **cada tabla nueva hereda TODOS los permisos** (INSERT, SELECT,
UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER) para `anon` y
`authenticated`.

Consecuencia: un `GRANT SELECT` explícito **no es suficiente** — hay que
`REVOKE` primero. Sin los `REVOKE` de las migraciones 0011 y 0012, `anon`
tenía permisos de escritura (INSERT/UPDATE/DELETE) sobre tablas privadas
como `matricula`, `calificacion`, `perfil` o `transaccion`.

La RLS seguía bloqueando el acceso a las filas (las políticas devuelven 0
filas), pero la defensa dependía de un solo mecanismo. Con los `REVOKE`
explícitos, **anon queda sin ningún permiso de escritura en el esquema
`public`**:

```sql
select count(*) from information_schema.role_table_grants
 where grantee = 'anon'
   and privilege_type in ('INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER');
-- 0
```

> Esta diferencia **no** se detecta en un PostgreSQL local normal: los
> default privileges de Supabase son específicos de la plataforma. La
> validación local debe replicarlos para ser representativa.

## 6. Verificación

El script `supabase/tests/pruebas_rls.sql` ejecuta **46 pruebas** con usuarios
sintéticos y `SET ROLE`:

| Área | Pruebas | Resultado |
|---|---|---|
| Contexto de autorización | 5 | Todas pasan |
| Aislamiento del anónimo | 7 | Todas pasan |
| Anti-escalación del estudiante | 7 | Todas pasan |
| Calificaciones | 5 | Todas pasan |
| Aislamiento entre docentes | 6 | Todas pasan |
| Secretos de evaluación | 4 | Todas pasan |
| Regla de pago → matrícula | 4 | Todas pasan |
| Idempotencia de recompensas | 4 | Todas pasan |
| Progreso y XP | 5 | Todas pasan |
| Auditoría por rol | 2 | Todas pasan |
| Calificación por docente | 1 | Todas pasan |
| **Total** | **46** | **46 pasan, 0 fallan** |

Para ejecutarlas en tu proyecto: abre `supabase/tests/pruebas_rls.sql` en el
SQL Editor de Supabase y ejecútalo. El script crea sus propios datos de prueba
y los limpia al terminar.
