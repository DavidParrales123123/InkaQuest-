# Supabase — InkaQuest

Base de datos, autenticación, almacenamiento y funciones de borde de InkaQuest.

## Estructura

```
supabase/
├── migrations/                    # 10 migraciones versionadas (fuente de verdad)
├── seed/seed.sql                  # Datos iniciales
├── tests/
│   ├── verificar_esquema.sql      # Verificación del esquema aplicado
│   └── pruebas_rls.sql            # 46 pruebas funcionales de seguridad
├── functions/                     # Edge Functions (Deno)
└── config.toml                    # Configuración del CLI de Supabase
```

## Estado

El esquema **está implementado y verificado**: 121 tablas, 205 políticas RLS,
92 funciones, 64 triggers, 311 índices, 38 tipos ENUM, 206 claves foráneas y
6 buckets de Storage.

**Falta aplicarlo en tu proyecto remoto.** Sigue las instrucciones de
[MIGRACIONES.md](../docs/base-de-datos/MIGRACIONES.md).

## Aplicación rápida

```bash
# Opción A: CLI
supabase login
supabase link --project-ref <PROJECT_REF>
supabase db push

# Opción B: SQL Editor -> New query, en orden de 0000 a 0009
```

## Verificación

```sql
-- En Supabase Dashboard -> SQL Editor
\i supabase/tests/verificar_esquema.sql
```

Devuelve el estado real de cada objeto y un veredicto final.

```sql
-- Pruebas de seguridad (crea usuarios test_* y los limpia al terminar)
\i supabase/tests/pruebas_rls.sql
```

## Módulos implementados

| Módulo | Tablas | Contenido |
|---|---|---|
| A. Identidad y seguridad | 7 | Perfiles, roles, permisos, solicitudes docente, auditoría de accesos |
| B. Gestión académica | 11 | Categorías, cursos, docentes, unidades, módulos, lecciones, contenidos, recursos |
| C. Matrículas | 5 | Matrículas, historial, renovaciones, cancelaciones, acceso |
| D. Pagos | 13 | Carrito, pedidos, cupones, transacciones, intentos, webhooks, reembolsos |
| E. Progreso | 5 | Progreso por curso, unidad y lección, historial |
| F. Evaluaciones | 13 | Actividades, tareas, evaluaciones, preguntas, opciones, entregas, calificaciones |
| G. Retos | 7 | Retos, lenguajes, casos de prueba, envíos, resultados |
| H. Minijuegos | 14 | Motores, versiones, juegos, configuraciones, intentos, resultados, recompensas |
| I. Gamificación | 17 | XP, niveles, insignias, rachas, rankings, misiones, monedero, tienda |
| J. Certificados | 5 | Certificados, titulares, cursos, emisiones, revocaciones |
| K. Soporte | 7 | Notificaciones, mensajes, tickets, respuestas |
| L. Chatbot | 11 | Conversaciones, mensajes, documentos, fragmentos, referencias, consumo |
| M. Auditoría | 6 | Eventos, acciones, cambios administrativos, configuración |

## Buckets de Storage

| Bucket | Público | Contenido | Regla de escritura |
|---|---|---|---|
| `avatares` | Sí | Avatar del usuario | Solo el propietario (`<user_id>/`) |
| `portadas-curso` | Sí | Portada de curso | Docentes y administradores |
| `recursos` | No | Material educativo | Docente del curso (`<curso_id>/`) |
| `entregas` | No | Entrega de tarea | Solo el autor (`<user_id>/`) |
| `certificados` | No | PDF del certificado | Administrador (`<user_id>/`) |
| `archivos` | No | Material autorizado | Solo el propietario (`<user_id>/`) |

## Variables de entorno

| Variable | Dónde se usa | Secreto |
|---|---|---|
| `SUPABASE_URL` | Backend y frontend | No |
| `SUPABASE_ANON_KEY` / `VITE_SUPABASE_ANON_KEY` | Frontend y backend | No (pública) |
| `SUPABASE_PUBLISHABLE_KEY` | Frontend | No (pública) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Solo backend** | **Sí** |
| `SUPABASE_JWT_SECRET` | **Solo backend** | **Sí** |
| `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` | **Solo backend** | La contraseña |

La `service_role` **nunca** debe llegar al bundle del navegador: salta la RLS
por completo.

## Seguridad en dos capas

1. **Permisos del rol** — `anon` solo tiene SELECT sobre 15 tablas de
   catálogo. Lo demás se rechaza antes de evaluar la RLS.
2. **RLS** — 205 políticas que filtran filas según el usuario efectivo.
3. **Triggers** — `trg_perfil_no_escalable` impide que un usuario modifique
   su propio rol, XP o estado de cuenta.

Ver [MATRIZ-RLS.md](../docs/base-de-datos/MATRIZ-RLS.md).

## Documentación

- [Modelo entidad-relación](../docs/base-de-datos/MODELO-ENTIDAD-RELACION.md)
- [Diccionario de datos](../docs/base-de-datos/DICCIONARIO-DE-DATOS.md)
- [Matriz RLS](../docs/base-de-datos/MATRIZ-RLS.md)
- [Relaciones](../docs/base-de-datos/RELACIONES.md)
- [Índices](../docs/base-de-datos/INDICES.md)
- [Funciones y triggers](../docs/base-de-datos/FUNCIONES-Y-TRIGGERS.md)
- [Integración con Spring Boot](../docs/base-de-datos/INTEGRACION-SPRING-BOOT.md)
- [Migraciones](../docs/base-de-datos/MIGRACIONES.md)
