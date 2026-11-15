# Guardianes del Conocimiento — Auditoría y plan

**Fecha:** 2026-11-14
**Alcance de la tarea:** videojuego educativo exclusivo del curso **Principios de Algoritmos** (`ab8e59ef-ab9f-40eb-8f31-790ac7edba4a`).
**Plataforma:** Angular 22 + Spring Boot 3.5 + Supabase PostgreSQL + RLS + Railway auto-deploy.

---

## Resumen ejecutivo

- **No existe ningún motor de combate/supervivencia** en el código actual.
- **96 juegos edito** están sembrados, pero **ninguno tiene contenido configurado** (`configuracion_juego = 0`, `actividad_juego = 0`).
- **La plataforma tiene 100 lekctiones listas para reutilizar** en contenido académico (cuenta desde `public.leccion`).
- **No hay Phaser ni canvas engine** en package.json.
- **No había monedas** acreditadas en BD. Ya se corrigió en esta sesión (trigger 1/5 XP→monedas); 068 acumula 60 monedas.

## Estado del curso Principios de Algoritmos (`ab8e59ef-ab9f-40eb-8f31-790ac7edba4a`)

- Slug: `principios-algoritmos`
- Estado: `publicado`

### Estructura académica (18 lekctiones = 18 semanas = 18 niveles)

| Unidad | Módulo | Lecciones | XP ejemplo |
|---|---|---|---|
| **Unidad 1 — Estructura secuencial** | Sesiones 1–6: Fundamentos y estructura secuencial | S1 Presentación, S2 Lógica proposicional, S3 Pseudocódigo, S4 Variables, S5 Diagramas de flujo, S6 Evaluación PC-1 | S1–S5: 60, S6: 100 |
| **Unidad 2 — Estructuras condicionales** | Sesiones 7–12: Estructuras condicionales | S7 Estructura simple, S8 Doble, S9 Anidadas, S10 Múltiple (SWITCH), S11 Aplicación, S12 Evaluación PC-2 | S7–S11: 60, S12: 100 |
| **Unidad 3 — Estructuras repetitivas** | Sesiones 13–18: Estructuras repetitivas + evaluación final | S13 PARA, S14 MIENTRAS, S15 REPETIR, S16 Participación, S17 Repaso Final, S18 Evaluación Final | S13–S15: 60, S16: 80, S17: 100, S18: 200 |

## Inventario de motores y juegos (existen pero NO funcionan como juego)

| Familia | Cantidad | Comentario |
|---|---|---|
| genérico (común) | 4 | arrastrar-soltar · emparejamiento · memoria · quiz-rapido |
| específico | 46 | Motores temáticos específicos (algoritmos-greedy, arbol-binario, backtracking-visual…) |
| adicional | 46 | Motores adicionales (entrevistas, narración, etc.) |
| **Contenido configurado** | **0** | **Toda la `configuracion_juego` está vacía** |
| **Actividades activas** | **0** | **`actividad_juego` vacío** |

> **Recomendación:** no reutilizar motores específicos ni adicionales para `Guardianes del Conocimiento`; mantener la nueva runtime independiente y aislada. El contenido está vacío, así que no hay nada que preservar de los minijuegos actuales como contenido útil para la nueva campaña.

## Estado de gamificación general (existente y reutilizable)

| Componente | Tabla | Row actual | Uso previsto |
|---|---|---|---|
| XP estudiante | `perfil.xp` | 068 → 300 XP (viene de minijuego_terminado) | Incluido en nueva campaña |
| Libro mayor de XP | `transaccion_xp` | 1 fila (300) | Incluir en nuevas transacciones |
| Monedas | `monedero.saldo` | 068 → 60 monedas (backfill 1/5) | Recompensa en niveles |
| Racha | `perfil.racha_dias`, `racha` | — | Bonus por avanzar |
| Progreso de lecciones | `progreso_leccion`/`progreso_curso` | 3 estudiantes con progreso act. | Mantener en el módulo existente |
| Historial | `historial_progreso` | — | Auditoría |

## Bloqueos identificados

1. **Phaser 3 no está instalado** — se requiere `npm install phaser@^3.80`.
2. **El proyecto Angular actualmente SPA** con lazy modules. Agregar Phaser debe hacerse con `import('./game')` dinámico para no inflar bundle.
3. **Sin campaña/niveles/personajes/plan de juego**: hay que diseñar y migrar.
4. **Sin preguntas precargadas** por tema de lección: toda la base de preguntas está vacía.
5. **Sin cron/job** para limpiar partidas abandonadas: existirán sesiones colgadas.

## Plan de implementación

| Fase | Contenido | Estado |
|---|---|---|
| 0 | Auditoría real (este documento) | ✅ entregado |
| 1 | Diseño técnico + migración base `guardianes_*` (tablas, RLS, RPC accesibilidad, auditoría) | pendiente |
| 2 | Frontend: rutas `/estudiante/guardianes`, portada, mapa, personaje, panel de campaña | pendiente |
| 3 | Motor Phaser 3 + índices de combate básico (movimiento, horda, daño, puntuación) | pendiente |
| 4 | 18 niveles académicos + contenido académico vinculado a lekctiones | pendiente |
| 5 | Mejoras (normales · académicas · legendarias) + sincronización del backend | pendiente |
| 6 | Banco de preguntas por competencia (`guardianes_pregunta`), validación en backend | pendiente |
| 7 | REST + Auth + RPC endpoints Spring Boot (`/api/v1/guardianes/*`) | pendiente |
| 8 | Panel docente `/docente/guardianes` (read-only, matriculados de mis cursos) + panel admin | pendiente |
| 9 | Integración con XP/logros/insignias existentes | pendiente |
| 10 | Prueba integrada con navegador, push, Ctrl+F5, verificación | pendiente |

**Estimación honesta:** sprint realista de 6–10 días de trabajo obstinado. Este ticket **NO lo completa en una sesión**. Esta sesión entrega: Fase 0 (auditoría) + diseño de datos + primera migración estructural. El resto queda en backlog priorizado pendiente de tu confirmación.

## Pendenciales críticos antes de codificar

1. **Confirmar Phaser 3 como motor de combate** vs. implementación canvas crudo (presup O(hable más sencillo frente a bibliotek).
2. **Tamaño de bandeja de preguntas por nivel (mínimo viable: 20 preguntas × 18 niveles × 3 competencias = 1.080 preguntas).** ¿Estás dispuesto a cargar esto ahora?
3. **Sprites / arte**: no existen — necesitamos (a) dejar dibujado básico con SVG primitivo o (b) assets libres tipo *Kenney.nl* bajo licencia CC0 para no violar derechos.
4. **Endpoints Spring** como flanco libre; o podemos usar RPC `security definer` functions como solución de transición.
