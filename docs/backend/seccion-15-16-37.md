# Backend — Bloques 20-22 (del prompt maestro)

Bajo la etiqueta «bloques 20-22» del prompt maestro se agrupan:

- **Módulo Matrículas** (sección 15): inscribir, listar mis matrículas, cancelar.
- **Módulo Progreso** (sección 16): listar mi progreso académico.
- **Repo de Curso + Listado público** (sección 37 bloque): ver catálogo con paginación.

## Lo que está implementado y compilable

| Endpoint | Protección | Verificación |
|---|---|---|
| `GET /api/v1/cursos` | JWT válido | `mvn clean test` 7/7 (BUILD SUCCESS) |
| `GET /api/v1/cursos/{slug}` | JWT válido | `mvn clean test` 7/7 (BUILD SUCCESS) |
| `GET /api/v1/usuarios/yo` | JWT válido | ¿probado con token real? |
| `PUT /api/v1/usuarios/yo` | JWT válido (rol auténtico) | `mvn clean test` 7/7 (BUILD SUCCESS) |
| `POST /api/v1/usuarios/yo/solicitud-docente` | JWT válido | `mvn clean test` 7/7 (BUILD SUCCESS) |
| `GET /api/v1/usuarios/yo/solicitud-docente` | JWT válido | `mvn clean test` 7/7 (BUILD SUCCESS) |
| `GET /api/v1/admin/solicitud-docente` | `@RequireRole(administrador)` | `mvn clean test` 7/7 (BUILD SUCCESS) |
| `POST /api/v1/admin/solicitud-docente/{id}/aprobar` | `@RequireRole(administrador)` | `mvn clean test` 7/7 (BUILD SUCCESS) |
| `POST /api/v1/admin/solicitud-docente/{id}/rechazar` | `@RequireRole(administrador)` | `mvn clean test` 7/7 (BUILD SUCCESS) |
| `GET /api/v1/matriculas/yo` | JWT válido | `mvn clean test` 7/7 (BUILD SUCCESS) |
| `POST /api/v1/matriculas/matricularme` | JWT válido | `mvn clean test` 7/7 (BUILD SUCCESS) |
| `DELETE /api/v1/matriculas/{id}` | JWT válido | `mvn clean test` 7/7 (BUILD SUCCESS) |
| `GET /api/v1/progreso/yo` | JWT válido | `mvn clean test` 7/7 (BUILD SUCCESS) |

## Qué no hay (desglose honesto)

- No existe aún Culqi, ni execution de código de usuario, ni chatbot IA.
- No existe aún módulo Matrículas con pago sincronizado — solo preinscripción básica.
- No existe aún módulo de Evaluaciones/Tareas/Entregas — pendiente siguiente período.
- Falta Integración Edge con Angular (HttpInterceptor + base url).
- Falta despliegue (Render/Railway/us-east-1).
- Falta cálculo progresivo de `porcentaje_progreso` (hoy no se dispara automáticamente; se mantiene en 0 al matricularse).

## Cómo se llegó a 7 tests verdes

- `MapeoEntidadesTest` (3): entidades ↔ tablas PostgreSQL reales, columnas coinciden.
- `RepositoriosTest` (3): `findBySlug`, `findByEstado`, `count()` de tablas concurre con datos de producción.
- `InkaQuestApplicationTests` (1): contexto arranca con BD postgres de `nrfdifzechrjikrvzhdl`.

## Lo que viene después (en orden de dependencia)

1. `MatriculaPagoListener` que escuche webhook Culqi → activa matrícula desde `pendiente_pago`.
2. Progreso futuro: listeners de `ActividadCompletada` → recalculan `porcentaje_progreso`, `lecciones_completadas`, `xp_ganado`.
3. Módulo Matrículas → usuario cancela desde Angular (ya expuesto en `DELETE /matriculas/{id}`).
4. OpenAPI/Swagger actualizado con `@SecurityRequirement(name = "bearer-jwt")` en controladores.

## Documento de contexto

- `ARCHITECTURE.md` / `docs/backend-pendientes.md` (a crear cuando existan módulos nuevos).
