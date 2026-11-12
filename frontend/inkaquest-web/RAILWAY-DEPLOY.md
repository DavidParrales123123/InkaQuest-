# Deploy Frontend Angular a Railway

## Configuracion Automatica

Este proyecto ya esta configurado para Railway con:
- nixpacks.toml: Configuracion de build
- railway.json: Comandos de deploy

## Variables de Entorno en Railway

Configura estas variables en el dashboard de Railway:

\\\
NODE_ENV=production
PORT=8080
\\\

## URL del Backend

El frontend se conectara automaticamente al backend de Railway usando:
- VITE_API_URL (configurado en environment.prod.ts)

## Pasos para Deploy

1. Ve a https://railway.app/dashboard
2. Click en New Project
3. Selecciona Deploy from GitHub repo
4. Selecciona InkaQuest-/frontend/inkaquest-web
5. Railway detectara automaticamente nixpacks.toml
6. El build se ejecutara automaticamente
7. Railway asignara un dominio publico

## Verificar Deploy

Despues del deploy, tu frontend estara disponible en:
https://[tu-proyecto].up.railway.app

## Conectar con Backend

El frontend ya esta configurado para conectarse a:
https://inkaquest-production.up.railway.app/api/v1

Y con Supabase:
- URL: https://nrfdifzechrjikrvzhdl.supabase.co
- Anon Key: Ya configurada en environment files
