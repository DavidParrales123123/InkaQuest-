# Protección ante DDoS

La plataforma tiene tres capas. La aplicación ya implementa las capas 2 y 3; la capa 1 (borde) se configura en Cloudflare.

## 1) Borde (Cloudflare) — recomendado, gratis

1. Cloudflare → **Add a site** → dominio de InkaQuest → plan **Free**.
2. Cambiar los nameservers del dominio por los que da Cloudflare (1 copiar/pegar).
3. En **DNS**, verificar que los registros `A`/`CNAME` apunten a Railway (nube naranja activada).
4. **Security → Settings**: Security Level = *Medium*, Challenge Passage = *30 min*.
5. **Security → WAF → Rate Limiting rules** (2 reglas):
   - `*inkaquest*/*` → 100 peticiones / minuto por IP → acción **Block** (o *Managed Challenge*).
   - `/api/v1/chatbot/*` y `/api/v1/pedidos/*` → 20 peticiones / minuto por IP → **Managed Challenge**.
6. **Speed → Optimization**: activar *Auto Minify* y *Brotli*.
7. **Network**: activar *Onion Routing* si no se usa Tor.

Cloudflare absorbe los ataques L3/L4 y gran parte de L7 antes de que lleguen a Railway.

## 2) Backend (ya implementado)

`RateLimitFilter` + `RateLimiter`:

- Cuota **global por IP** (todas las rutas): 300/min.
- Cuota por IP + ruta: 120/min (general), 30/min (webhook y verificación pública), 20/min (chatbot, pagos y pedidos).
- Respuestas `429` con `Retry-After` y cabeceras `X-RateLimit-*`.
- IP normalizada: `CF-Connecting-IP` → `X-Forwarded-For` → remoto, con validación para evitar evasión por cabeceras falsas.
- Limpieza periódica de ventanas para evitar crecimiento de memoria (memory-DoS).
- Límites de tamaño de cuerpo (`max-http-form-post-size: 2MB`, multipart 5/15 MB).
- Cabeceras de seguridad: CSP, HSTS, `frame-ancestors 'none'`, `Permissions-Policy`, `COOP`, `CORP`.

Variables ajustables sin tocar código:

```
RATE_LIMIT_MAX_PER_MINUTE=120
RATE_LIMIT_STRICT_PER_MINUTE=30
RATE_LIMIT_GLOBAL_PER_MINUTE=300
RATE_LIMIT_SENSITIVE_PER_MINUTE=20
```

## 3) Frontend (ya implementado)

`ApiClientService` reintenta automáticamente 2 veces con backoff ante `429`/`503` respetando `Retry-After`, evitando avalanchas desde el navegador.

## Nota

El rate limiting de la aplicación es por instancia (en memoria). Si Railway escala a varias réplicas, Cloudflare es la capa que garantiza el límite global real.
