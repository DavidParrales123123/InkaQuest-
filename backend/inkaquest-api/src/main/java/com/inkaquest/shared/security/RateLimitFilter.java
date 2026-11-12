package com.inkaquest.shared.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import com.inkaquest.shared.response.ApiResponse;

import java.io.IOException;
import java.util.Set;

/**
 * Rate limiting por IP + ruta con cuota estricta para rutas sensibles
 * (webhooks, verificación pública). Configuración vía variables de entorno.
 */
@Component
@EnableConfigurationProperties(RateLimitProperties.class)
public class RateLimitFilter extends OncePerRequestFilter {

    /** Prefijos con cuota estricta (webhook de pagos, verificación pública). */
    private static final Set<String> RUTAS_ESTRICTAS = Set.of(
            "/api/v1/webhooks/culqi",
            "/api/v1/certificados/verificar");

    private final RateLimiter limiter = new RateLimiter();
    private final ObjectMapper objectMapper;
    private final int maxGeneral;
    private final int maxEstricto;

    public RateLimitFilter(RateLimitProperties properties, ObjectMapper objectMapper) {
        this.maxGeneral = properties.maxPerMinute();
        this.maxEstricto = properties.strictPerMinute();
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String ruta = request.getRequestURI();
        String llave = clientIp(request) + "|" + ruta;
        boolean estricta = RUTAS_ESTRICTAS.stream().anyMatch(ruta::startsWith);
        int limite = estricta ? maxEstricto : maxGeneral;

        if (!limiter.intentar(llave, limite)) {
            int retry = limiter.segundosHastaReinicio(llave);
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setHeader("Retry-After", String.valueOf(retry));
            response.setHeader("X-RateLimit-Limit", String.valueOf(limite));
            response.setHeader("X-RateLimit-Remaining", "0");
            response.setContentType("application/json;charset=UTF-8");
            objectMapper.writeValue(response.getOutputStream(), ApiResponse.error(
                    "Demasiadas peticiones. Espera un momento e intentalo de nuevo.",
                    "TOO_MANY_REQUESTS", ruta));
            response.getOutputStream().flush();
            return;
        }
        response.setHeader("X-RateLimit-Limit", String.valueOf(limite));
        chain.doFilter(request, response);
    }

    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            int coma = forwarded.indexOf(',');
            return (coma > 0 ? forwarded.substring(0, coma) : forwarded).trim();
        }
        String remote = request.getRemoteAddr();
        return remote != null ? remote : "unknown";
    }
}
