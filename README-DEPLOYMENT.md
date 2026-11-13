# 🚀 Deployment Rápido de InkaQuest

## TL;DR - Despliegue en 5 minutos

### 1. Backend en Railway

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy desde el directorio del backend
cd backend/inkaquest-api
railway init
railway up
```

**Configurar variables de entorno** en Railway Dashboard:
- `SPRING_PROFILES_ACTIVE=prod`
- `DB_URL=jdbc:postgresql://...` (Supabase)
- `DB_USERNAME=postgres.nrfdifzechrjikrvzhdl`
- `DB_PASSWORD=<tu-password>`
- `SUPABASE_JWT_SECRET=<tu-secret>`
- `APP_CORS_ALLOWED_ORIGIN_PATTERNS=https://*.up.railway.app` (o `APP_CORS_ALLOWED_ORIGINS=<dominio exacto del frontend>`)

---

### 2. Frontend en Vercel

```bash
# Instalar Vercel CLI
npm install -g vercel

# Deploy desde el directorio del frontend
cd frontend/inkaquest-web
vercel --prod
```

**Configurar variables de entorno** en Vercel Dashboard:
- `VITE_API_URL=https://tu-backend.up.railway.app/api/v1`
- `VITE_SUPABASE_URL=https://nrfdifzechrjikrvzhdl.supabase.co`
- `VITE_SUPABASE_ANON_KEY=eyJhbG...` (clave pública)

---

### 3. Verificar

```bash
# Backend health check
curl https://tu-backend.up.railway.app/actuator/health

# Frontend
# Abre: https://tu-proyecto.vercel.app
# Login y verifica que funcione
```

---

## Scripts de Deployment

### PowerShell (Windows)

```powershell
# Frontend a Vercel
.\deploy-vercel.ps1

# Backend: usa Railway Dashboard o CLI
```

---

## Troubleshooting Rápido

### ❌ "Failed to fetch" en frontend
→ Verifica `APP_CORS_ALLOWED_ORIGIN_PATTERNS`/`APP_CORS_ALLOWED_ORIGINS` en Railway incluye tu dominio del frontend en Railway

### ❌ "Invalid JWT"
→ Copia el JWT Secret correcto desde Supabase → Settings → API

### ❌ "Database connection failed"
→ Verifica credenciales en Railway y whitelist IP en Supabase

---

## Documentación Completa

Ver: [Guía Deployment Completa](./docs/deployment/DEPLOYMENT-GUIDE.md)

---

## URLs Útiles

- **Railway Dashboard**: https://railway.app/dashboard
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://supabase.com/dashboard

---

**¡Listo! Tu aplicación está en producción.** 🎉
