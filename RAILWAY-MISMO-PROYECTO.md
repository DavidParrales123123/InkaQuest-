# Pasos para agregar Frontend al mismo proyecto de Railway

PASO 1: Ir al Proyecto Existente
=================================
1. Ve a: https://railway.app/dashboard
2. Click en tu proyecto existente: inkaquest-production
3. Veras tu backend ya deployado

PASO 2: Agregar Nuevo Servicio
===============================
4. Dentro del proyecto, click en + New
5. Selecciona: GitHub Repo
6. Selecciona el MISMO repositorio: InkaQuest-
7. Railway te preguntara Root Directory

PASO 3: Configurar Root Directory del Frontend
===============================================
8. En Root Directory, escribe: frontend/inkaquest-web
9. En Service Name, escribe: frontend
10. Click en Add Service

PASO 4: Verificar Variables de Entorno
======================================
El frontend usara automaticamente:
- VITE_API_URL ya configurado en environment.prod.ts
- Apunta a: https://inkaquest-production.up.railway.app/api/v1

PASO 5: Deploy Automatico
=========================
Railway detectara:
- nixpacks.toml
- railway.json
- package.json

Y empezara a construir automaticamente.

PASO 6: Networking Interno (Opcional)
=====================================
Railway permite que los servicios se hablen internamente:
- Backend estara en: backend.railway.internal
- Frontend estara en: frontend.railway.internal

Pero por ahora usaremos las URLs publicas.

RESULTADO FINAL
===============
Tendras UN proyecto con DOS servicios:

Railway Project: inkaquest-production
├── backend  → https://inkaquest-production.up.railway.app
└── frontend → https://frontend-production-xxxx.up.railway.app

Ventajas:
- Un solo proyecto
- Networking compartido
- Logs centralizados
- Variables compartidas
- Deploy coordinado
