# Deploy Frontend Angular a Railway

## Estado actual (2026-11-12)

- Frontend: **https://athletic-quietude-production.up.railway.app** (servicio Railway con Dockerfile)
- Backend: **https://inkaquest-production.up.railway.app/api/v1** (mismo proyecto Railway)
- Vercel: **descartado**; nada se publica allí. Los archivos `vercel.json` / `deploy-vercel*.ps1` en la raíz son históricos.

## Cómo funciona el frontend en Railway

- El Dockerfile (`frontend/inkaquest-web/Dockerfile`) compila la app con `npm run build` y la sirve con `serve -s dist -l ${PORT:-8080}`.
- Railway inyecta `$PORT`; si no está definida, usa 8080. El dominio público es `https://athletic-quietude-production.up.railway.app`.
- El `environment.ts` (commiteado) tiene horneado `apiUrl: https://inkaquest-production.up.railway.app/api/v1`. No hay `VITE_*` en runtime; cualquier cambio de API requiere rebuild.

## CORS (causa de "no aparecen los cursos")

El backend (`application-*.yml`) ya admite por defecto:
- `https://*.up.railway.app` vía `APP_CORS_ALLOWED_ORIGIN_PATTERNS` (cubre este y futuros dominios Railway)
- `http://localhost:4200` y `http://127.0.0.1:4200` exactos vía `APP_CORS_ALLOWED_ORIGINS`

Para restringir solo al dominio real del frontend, define en Railway (servicio BACKEND):

```
APP_CORS_ALLOWED_ORIGINS=https://athletic-quietude-production.up.railway.app,http://localhost:4200
APP_CORS_ALLOWED_ORIGIN_PATTERNS=
```

## Redeploy

- Backend: push a `main` → Railway redepliega, o botón Redeploy en el servicio backend.
- Frontend: push a `main` → Railway redepliega, o botón Redeploy en el servicio frontend.

## Verificar que los cursos aparecen

```bash
curl -i "https://inkaquest-production.up.railway.app/api/v1/cursos?page=0&size=3" \
  -H "Origin: https://athletic-quietude-production.up.railway.app"
```

Debe responder `200` con `Access-Control-Allow-Origin: https://athletic-quietude-production.up.railway.app`.
