# =============================================================================
# Despliegue - InkaQuest
# -----------------------------------------------------------------------------
# Vercel -> frontend Angular (estático)
# Render / Railway -> backend Spring Boot (contenedor Java)
# Supabase -> PostgreSQL, Auth y Storage
#
# Detalle completo en: docs/despliegue/ESTRATEGIA-VERCEL-BACKEND.md
# =============================================================================

infra/
├── docker/
│   ├── Dockerfile.backend       # Imagen multi-stage del backend (JDK 25)
│   └── docker-compose.dev.yml   # PostgreSQL local para desarrollo
└── deployment/
    ├── render.yaml              # Blueprint para desplegar en Render
    └── railway.json             # Configuración para Railway
