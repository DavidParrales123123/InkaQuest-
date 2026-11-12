package com.inkaquest.shared.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Límites de peticiones por IP, configurables por entorno.
 *
 * <p>Valores por defecto razonables para la API pública; ajustables sin tocar
 * código vía {@code RATE_LIMIT_MAX_PER_MINUTE} / {@code RATE_LIMIT_STRICT_PER_MINUTE}.</p>
 */
@ConfigurationProperties(prefix = "app.rate-limit")
public record RateLimitProperties(
        /** Cuota general por IP y ruta (peticiones/minuto). */
        int maxPerMinute,
        /** Cuota estricta para rutas sensibles (webhooks, verificación pública). */
        int strictPerMinute) {

    public RateLimitProperties {
        if (maxPerMinute <= 0) {
            maxPerMinute = 60;
        }
        if (strictPerMinute <= 0) {
            strictPerMinute = 20;
        }
    }
}
