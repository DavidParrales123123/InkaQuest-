# Base de datos InkaQuest — README

Documentación técnica de la base de datos de InkaQuest (Supabase / PostgreSQL).

> **Estado: APLICADO Y VERIFICADO** en el proyecto Supabase
> `nrfdifzechrjikrvzhdl` (Inkaquest mejorado).

## Documentos

| Documento | Contenido |
|---|---|
| [MODELO-ENTIDAD-RELACION.md](MODELO-ENTIDAD-RELACION.md) | Diagrama ER en Mermaid y vista por módulos |
| [DICCIONARIO-DE-DATOS.md](DICCIONARIO-DE-DATOS.md) | Tablas, columnas, tipos y restricciones |
| [MATRIZ-RLS.md](MATRIZ-RLS.md) | Matriz de políticas por rol y tabla |
| [RELACIONES.md](RELACIONES.md) | Claves foráneas y cardinalidades |
| [INDICES.md](INDICES.md) | Índices y su justificación |
| [FUNCIONES-Y-TRIGGERS.md](FUNCIONES-Y-TRIGGERS.md) | Funciones, triggers y su propósito |
| [INTEGRACION-SPRING-BOOT.md](INTEGRACION-SPRING-BOOT.md) | Mapeo JPA, RLS y autorización desde Spring Boot |
| [MIGRACIONES.md](MIGRACIONES.md) | Orden de aplicación, verificación y reversión |

## Resumen de la base de datos

Valores verificados **por consulta directa al proyecto Supabase remoto**.

| Métrica | Valor |
|---|---|
| Tablas en `public` | 121 |
| Políticas RLS | 209 |
| Tablas con RLS habilitado y forzado | 121 (100%) |
| Funciones | 57 |
| Triggers | 64 |
| Índices | 311 |
| Tipos ENUM | 38 |
| Claves foráneas | 206 |
| Restricciones CHECK | 166 |
| Restricciones UNIQUE | 82 |
| Buckets de Storage | 6 |
| Módulos de negocio | 13 (A–M) |
| Migraciones aplicadas | 13 |

## Estructura de migraciones

```
supabase/
├── migrations/                # Migraciones versionadas (fuente de verdad)
│   ├── 20260101000000_extensiones_tipos_funciones.sql
│   ├── 20260101000100_identidad_academico.sql
│   ├── 20260101000200_matriculas_pagos.sql
│   ├── 20260101000300_gamificacion.sql
│   ├── 20260101000400_progreso_evaluaciones.sql
│   ├── 20260101000500_retos_minijuegos.sql
│   ├── 20260101000600_certificados_soporte_chatbot_auditoria.sql
│   ├── 20260101000700_rls_politicas.sql
│   ├── 20260101000800_storage.sql
│   ├── 20260101000900_seguridad_backend_datos_referencia.sql
│   ├── 20260101001000_rls_permisos.sql
│   ├── 20260101001100_endurecer_permisos.sql
│   └── 20260101001200_correccion_permisos.sql
├── seed/seed.sql              # Datos iniciales (opcional)
├── tests/
│   ├── verificar_esquema.sql  # Verificación del esquema aplicado
│   ├── pruebas_rls.sql        # 46 pruebas funcionales de seguridad
│   └── limpiar_pruebas.sql    # Limpieza de los datos de prueba
├── functions/                 # Edge Functions (Deno)
└── config.toml                # Configuración del CLI de Supabase
```

## Principios de diseño

1. **Las migraciones son la fuente de verdad.** Hibernate nunca genera el
   esquema: `spring.jpa.hibernate.ddl-auto: none`.
2. **RLS en todas las tablas**, habilitada y forzada
   (`enable row level security` + `force row level security`).
3. **El rol efectivo se lee de la base**, no de una variable de sesión
   manipulable.
4. **Permisos mínimos por rol.** Supabase concede por defecto *todos* los
   permisos a `anon` y `authenticated` en cada tabla nueva; las migraciones
   0011 y 0012 los revocan explícitamente.
5. **Integridad transaccional**: la activación de matrícula, el XP y las
   recompensas son idempotentes y ocurren dentro de la misma transacción que
   registra el movimiento.
6. **Nada de datos sensibles**: nunca se almacenan números de tarjeta ni CVV,
   solo tokens opacos del proveedor de pago.

## Verificación

| Script | Propósito | Resultado |
|---|---|---|
| `verificar_esquema.sql` | 11 comprobaciones del esquema + veredicto | `BASE DE DATOS INKAQUEST: OK` |
| `pruebas_rls.sql` | 46 pruebas de seguridad con `SET ROLE` | **46 pasan, 0 fallan** |
| `limpiar_pruebas.sql` | Elimina los datos de prueba | Base limpia |

Las pruebas usan usuarios sintéticos (`test_*@inkaquest.test`) y **no
utilizan datos reales**. Ejecuta `limpiar_pruebas.sql` después de correrlas.
