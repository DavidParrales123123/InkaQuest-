# Railway Manual Deploy - InkaQuest Backend

## 🚨 Situación Actual
El backend en Railway está caído (503 Service Unavailable) y necesita redesplegar para aplicar los cambios más recientes.

## 📝 Cambios Pendientes de Deploy
- ✅ Endpoints de catálogo públicos (sin autenticación)
- ✅ SecurityConfig actualizado
- ✅ CursoController modificado
- ✅ JAR compilado localmente (target/inkaquest-api-0.1.0.jar)

## 🔄 Opción 1: Auto-Deploy (Recomendado)

Railway debería detectar automáticamente los cambios del repositorio Git.

### Verificar estado:
1. Ve a: https://railway.app/dashboard
2. Busca el proyecto "inkaquest-production"
3. Click en el servicio del backend
4. Ve a la pestaña "Deployments"
5. Debería aparecer un nuevo deployment en progreso

### Tiempo estimado: 5-15 minutos

## 🛠️ Opción 2: Forzar Redeploy Manual

Si Railway no detecta los cambios automáticamente:

### Paso 1: Acceder a Railway
1. Ve a: https://railway.app/dashboard
2. Login con tu cuenta

### Paso 2: Seleccionar Proyecto
3. Click en "inkaquest-production"
4. Click en el servicio del backend (Spring Boot)

### Paso 3: Forzar Deploy
5. Click en la pestaña "Deployments"
6. Click en el botón "Deploy" (esquina superior derecha)
7. Selecciona "Deploy from GitHub"
8. Confirma el branch "main"
9. Click en "Deploy Now"

### Paso 4: Monitorear Logs
10. Ve a la pestaña "Logs"
11. Observa el proceso de compilación
12. Espera a ver "Started InkaQuestApplication"

### Tiempo estimado: 8-12 minutos

## ⚡ Opción 3: Verificar Configuración

Si el deployment falla, verifica:

### Variables de Entorno
Asegúrate de que Railway tiene configuradas:

```env
# Base de Datos
DB_HOST=db.nrfdifzechrjikrvzhdl.supabase.co
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=[tu-password-de-supabase]
DB_PORT=5432

# Spring Profile
SPRING_PROFILES_ACTIVE=prod

# JWT (Supabase)
SUPABASE_JWT_ISSUER=https://nrfdifzechrjikrvzhdl.supabase.co/auth/v1
SUPABASE_JWT_JWKS_URI=https://nrfdifzechrjikrvzhdl.supabase.co/auth/v1/jwks

# Puerto
PORT=8080
```

### Build Command
```bash
mvn clean package -DskipTests
```

### Start Command
```bash
java -Dspring.profiles.active=prod -Dserver.port=$PORT -jar target/inkaquest-api-0.1.0.jar
```

## 🧪 Verificar Deployment Exitoso

### 1. Health Check
```bash
curl https://inkaquest-production.up.railway.app/actuator/health
```

Respuesta esperada:
```json
{
  "status": "UP"
}
```

### 2. Catálogo Público (Sin autenticación)
```bash
curl "https://inkaquest-production.up.railway.app/api/v1/cursos?page=0&size=5"
```

Respuesta esperada:
```json
{
  "success": true,
  "message": "Cursos listados.",
  "data": {
    "content": [...],
    "totalElements": 12,
    ...
  }
}
```

### 3. Verificar en el Frontend
1. Ve a: https://inkaquest-web.vercel.app
2. Click en "Cursos" en el menú
3. Deberías ver 12 cursos
4. NO requiere login

## ❌ Troubleshooting

### Error: "Out of memory"
Aumenta la memoria en Railway Settings:
- Memory: 512 MB → 1024 MB

### Error: "Build failed"
Revisa los logs y verifica:
- Java version: 17
- Maven version: 3.8+
- Dependencias descargadas correctamente

### Error: "Port already in use"
Railway asigna automáticamente el puerto via `$PORT`
Verifica que el start command use: `-Dserver.port=$PORT`

### Error: "Database connection refused"
Verifica las variables de entorno de la base de datos
Confirma que Supabase está activo

## 📞 Soporte

Si nada funciona:
1. Exporta los logs de Railway
2. Revisa el archivo pom.xml
3. Verifica que el JAR se compile localmente: `mvn clean package`
4. Contacta soporte de Railway si el problema persiste

## ✅ Checklist Final

Después del deployment exitoso:

- [ ] Health check responde 200
- [ ] Endpoint público `/cursos` funciona sin JWT
- [ ] Frontend muestra cursos en catálogo
- [ ] Login funciona correctamente
- [ ] Matrículas se cargan para usuarios logueados

---

**Última actualización**: 2026-11-12 18:45 UTC-5
**Commits relevantes**:
- 1e7b37f: Make course catalog endpoints public
- c128602: Trigger Railway redeploy for backend
