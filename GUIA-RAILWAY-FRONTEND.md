# GUIA COMPLETA: Subir Frontend a Railway

## PASO 1: Preparar Railway Dashboard

1. Ve a: https://railway.app/dashboard
2. Asegurate de estar logueado
3. Click en **New Project**

## PASO 2: Conectar Repositorio

4. Selecciona: **Deploy from GitHub repo**
5. Si es la primera vez, autoriza Railway a acceder a tu GitHub
6. Busca y selecciona: **InkaQuest-** (tu repositorio)
7. Railway te preguntara que carpeta deployar

## PASO 3: Configurar Root Directory

8. En la configuracion inicial, busca **Root Directory**
9. Cambialo a: \rontend/inkaquest-web\
10. Esto le dice a Railway que solo compile el frontend, no todo el repo

## PASO 4: Verificar Configuracion de Build

Railway detectara automaticamente:
- **nixpacks.toml** (configuracion de build)
- **railway.json** (comando de inicio)

Si Railway pregunta por build command:
- Build Command: \
pm ci && npm run build\
- Start Command: \
px serve dist/inkaquest-web/browser -s -l \\

## PASO 5: Configurar Variables de Entorno

11. Ve a la pestana **Variables**
12. Agrega estas variables:

\\\
NODE_ENV=production
PORT=8080
\\\

## PASO 6: Deploy

13. Click en **Deploy**
14. Railway empezara a construir tu frontend
15. Tiempo estimado: 5-8 minutos

## PASO 7: Verificar Build

En la pestana **Deployments** veras:
- Installing dependencies... ✓
- Building Angular... ✓
- Starting server... ✓
- Deployment successful ✓

## PASO 8: Obtener URL Publica

16. Ve a la pestana **Settings**
17. Busca **Domains**
18. Railway te asignara un dominio automaticamente: 
    \https://inkaquest-web-production.up.railway.app\

## RESULTADO FINAL

Tu arquitectura quedara asi:

\\\
Frontend (Railway)          Backend (Railway)           Base de Datos (Supabase)
Angular 22                  Spring Boot 3.5             PostgreSQL 17
https://inkaquest-web-      https://inkaquest-          https://nrfdifzechrjik
production.up.railway.app   production.up.railway.app   rvzhdl.supabase.co
          ↓                           ↓                           ↓
          └───────────────────────────┴───────────────────────────┘
                      Todo conectado y funcionando
\\\

## Verificar que Todo Funciona

1. Ve a tu URL de Railway del frontend
2. Navega a Cursos
3. Deberias ver 12 cursos (sin login)
4. Haz login
5. Ve a tu Panel
6. Deberias ver Principios de Algoritmos inscrito

## Troubleshooting

### Error: Build failed
- Verifica que Root Directory sea: \rontend/inkaquest-web\
- Revisa los logs de Railway

### Error: serve not found
- Railway deberia instalar automaticamente
- Verifica que package.json tenga serve en dependencies

### Error: Cannot connect to backend
- Verifica que environment.prod.ts tenga la URL correcta del backend
- URL debe ser: https://inkaquest-production.up.railway.app/api/v1

## Comparacion de Costos

### Antes (Vercel):
- Vercel: \-20/mes
- Total con Railway + Supabase: \-45/mes

### Ahora (Railway completo):
- Frontend en Railway: \~\/mes
- Backend en Railway: \~\/mes
- Supabase: \ (Free tier)
- **Total: \~\/mes** (mas barato!)

## Ventajas de Railway para Todo

1. Todo en un dashboard
2. Logs centralizados
3. Networking interno mas rapido
4. Mas facil de debuggear
5. Mas economico

---

**SIGUIENTE PASO**: Sigue esta guia y despliega el frontend en Railway ahora!

Si tienes problemas, dimelo y te ayudo.
