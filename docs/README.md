# Documentación — InkaQuest

Documentación técnica de la plataforma, organizada por área.

## Guía de lectura

| Si quieres… | Lee… |
|---|---|
| Entender cómo encajan las piezas | [arquitectura/ARQUITECTURA-GENERAL.md](arquitectura/ARQUITECTURA-GENERAL.md) |
| Saber qué va en cada carpeta | [arquitectura/ESTRUCTURA-PROYECTO.md](arquitectura/ESTRUCTURA-PROYECTO.md) |
| Trabajar en el frontend | [frontend/CONFIGURACION-ANGULAR.md](frontend/CONFIGURACION-ANGULAR.md) |
| Trabajar en el backend | [backend/CONFIGURACION-SPRING-BOOT.md](backend/CONFIGURACION-SPRING-BOOT.md) |
| Trabajar con la base de datos | [base-de-datos/CONFIGURACION-SUPABASE.md](base-de-datos/CONFIGURACION-SUPABASE.md) |
| Revisar el modelo de seguridad | [seguridad/MODELO-SEGURIDAD.md](seguridad/MODELO-SEGURIDAD.md) |
| Desplegar | [despliegue/ESTRATEGIA-VERCEL-BACKEND.md](despliegue/ESTRATEGIA-VERCEL-BACKEND.md) |

## Convenciones transversales

- **Un proyecto por concerns**: `frontend/` y `backend/` son autónomos; cada
  uno se compila sin depender de la raíz del repositorio.
- **La base de datos es de Supabase**, y su esquema se define con migraciones
  SQL versionadas, nunca con el ORM.
- **Los secretos solo viven en variables de entorno** del proveedor de
  despliegue.
- **La documentación se actualiza con el código**: un cambio de configuración
  relevante se acompaña de su actualización en esta carpeta.

## Estado

Esta fase cubre la estructura y los proyectos base. La documentación de los
módulos de negocio se añadirá a medida que se implementen.
