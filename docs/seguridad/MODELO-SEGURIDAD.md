# Modelo de seguridad — InkaQuest

Descripción de las capas de protección, la gestión de secretos y las
recomendaciones operativas.

> En esta fase el modelo está **diseñado y configurado**, pero la lógica de
> autorización fina (filtro JWT, guardas de rol, políticas RLS definitivas) se
> implementará en la fase de seguridad.

## 1. Capas de defensa

```
┌─────────────────────────────────────────────────────────────┐
│ 1. TRANSPORTE     HTTPS obligatorio entre todas las capas    │
├─────────────────────────────────────────────────────────────┤
│ 2. CORS           El backend solo acepta orígenes configurados│
├─────────────────────────────────────────────────────────────┤
│ 3. AUTENTICACIÓN  Supabase Auth emite el JWT                 │
├─────────────────────────────────────────────────────────────┤
│ 4. AUTORIZACIÓN   RLS en PostgreSQL + reglas en el backend   │
├─────────────────────────────────────────────────────────────┤
│ 5. VALIDACIÓN     Bean Validation en el backend               │
├─────────────────────────────────────────────────────────────┤
│ 6. AUDITORÍA      Logs estructurados + Actuator               │
└─────────────────────────────────────────────────────────────┘
```

## 2. Modelo de credenciales

| Credencial | Dónde vive | ¿Llega al navegador? |
|---|---|---|
| `SUPABASE_ANON_KEY` / `publishable` | Frontend + backend | **Sí** (es pública) |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo backend | **No** |
| `SUPABASE_JWT_SECRET` | Solo backend | **No** |
| `DB_PASSWORD` | Solo backend | **No** |
| JWT de sesión del usuario | En memoria / `localStorage` | Sí, en las peticiones |

La clave `anon` no es una credencial secreta: la protección la aporta RLS. Lo
que resulta peligroso es que la `service_role` llegue al cliente, porque
ignora RLS por completo. Por eso:

- El backend se conecta a PostgreSQL con credenciales de servicio.
- El frontend solo usa la clave pública.
- El bundle se revisa antes de cada despliegue.

## 3. Row Level Security

RLS es el pilar de la seguridad de datos: aunque alguien manipule el
frontend, no puede leer ni escribir filas ajenas.

```sql
alter table public.recurso enable row level security;

create policy "lectura de las propias filas"
    on public.recurso
    for select
    to authenticated
    using (auth.uid() = usuario_id);
```

Puntos de diseño:

- `auth.uid()` identifica al usuario de la sesión.
- `to authenticated` evita que un anónimo aplique la política.
- Una tabla sin políticas es inaccesible: el comportamiento por defecto es
  seguro.
- Las operaciones administrativas (pagos, certificados) se ejecutan desde el
  backend con `service_role`.

## 4. Autenticación en el backend

Flujo previsto:

1. El frontend obtiene un JWT de Supabase Auth.
2. Lo envía en `Authorization: Bearer <token>`.
3. Un filtro de Spring Security valida firma, emisor y expiración contra
   `SUPABASE_JWT_SECRET`.
4. El `SecurityContext` recibe un `Authentication` con el `user_id`.
5. Los controladores consultan el principal para decidir la autorización.

Configuración ya presente en `SecurityConfig`:

- Sesiones `STATELESS` (sin cookies, sin CSRF).
- Endpoints públicos: salud de Actuator, documentación OpenAPI y `OPTIONS`.
- El resto requiere autenticación.

## 5. CORS

El frontend (Vercel) y el backend (Render/Railway) viven en dominios
distintos, así que el navegador aplica CORS de forma estricta.

```yaml
app:
  cors:
    allowed-origins: ${APP_CORS_ALLOWED_ORIGINS:http://localhost:4200}
    allowed-methods: GET,POST,PUT,DELETE,PATCH,OPTIONS
    allowed-headers: "*"
    allow-credentials: true
```

En producción:

```
APP_CORS_ALLOWED_ORIGINS=https://tu-app.vercel.app,https://tu-dominio.com
```

> No usar `*` con `allow-credentials: true`: la combinación es rechazada por
> los navegadores y ampliaría el origen de los ataques.

## 6. Gestión de secretos

Reglas del proyecto:

1. Ningún secreto en Git. `.gitignore` excluye `.env`, `.env.*` y
   `application-local.yml`.
2. `.env.example` documenta el **nombre** de cada variable, nunca su valor.
3. Los secretos se inyectan en el panel del proveedor de despliegue
   (Vercel → Environment Variables, Render/Railway → Environment).
4. Rotación: cambiar la clave en Supabase, actualizar el proveedor y
   reiniciar el backend.
5. Los secretos de las Edge Functions se definen con `supabase secrets set`.

Antes de cada despliegue conviene comprobar:

```bash
git grep -nIE "(service_role|sb_secret_|sk_(test|live)_[A-Za-z0-9]{20,})" -- .
```

## 7. Cabeceras HTTP

`vercel.json` aplica cabeceras defensivas al frontend:

| Cabecera | Valor | Motivo |
|---|---|---|
| `X-Content-Type-Options` | `nosniff` | Evita el sniffing de tipos MIME |
| `X-Frame-Options` | `DENY` | Evita el *clickjacking* |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limita la fuga de URLs |
| `Permissions-Policy` | cámara, micro, geolocalización y pago desactivados | Reduce la superficie |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Fuerza HTTPS |

## 8. Validación de entrada

- **Backend**: Bean Validation (`@Valid`, `@NotBlank`, `@Size`, `@Pattern`) en
  los DTO. Los errores se traducen a `400 VALIDATION_ERROR` en
  `GlobalExceptionHandler`.
- **Base de datos**: restricciones `NOT NULL`, `CHECK` y `UNIQUE` como última
  línea de defensa.
- **Frontend**: el formulario valida para dar respuesta inmediata, pero la
  validación autoritativa es la del servidor.

## 9. Límite de peticiones

La API expone Actuator con las métricas de la aplicación. En fases posteriores
se añadirá un control de tasa por IP para los endpoints sensibles (login,
registro, recuperación de contraseña), evitando fuerza bruta.

## 10. Errores y filtrado de información

- Las excepciones de negocio se traducen a mensajes claros.
- Las excepciones no controladas registran la traza completa en el servidor,
  pero al cliente solo se devuelve un mensaje genérico
  (`INTERNAL_ERROR`), sin detalles internos.

## 11. Checklist de seguridad

- [ ] RLS habilitado en **todas** las tablas exposed al cliente.
- [ ] Políticas que usan `auth.uid()` para el aislamiento por usuario.
- [ ] La `service_role` solo existe como variable de entorno del backend.
- [ ] `APP_CORS_ALLOWED_ORIGINS` no contiene comodines en producción.
- [ ] `.env` y `application-local.yml` no están versionados.
- [ ] `git grep` sin coincidencias de secretos antes de publicar.
- [ ] Las cabeceras defensivas están activas en el despliegue.
