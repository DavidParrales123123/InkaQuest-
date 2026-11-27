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
import java.util.concurrent.atomic.AtomicLong;

/**
 * Protección de primera línea ante abuso / DDoS a nivel de aplicación.
 *
 * <p>Aplica tres capas: cuota GLOBAL por IP (todas las rutas), cuota por
 * IP+ruta y cuota más estricta para rutas caras o públicas sensibles.
 * Las cabeceras de proxy se normalizan y validan para evitar evasión.</p>
 */
@Component
@EnableConfigurationProperties(RateLimitProperties.class)
public class RateLimitFilter extends OncePerRequestFilter {

    /** Webhooks y verificación pública: abuso directo contra recursos externos. */
    private static final Set<String> RUTAS_ESTRICTAS = Set.of(
            "/api/v1/webhooks/culqi",
            "/api/v1/certificados/verificar");

    /** Rutas caras (IA y pagos): se limitan más que el resto. */
    private static final Set<String> RUTAS_SENSIBLES = Set.of(
            "/api/v1/chatbot",
            "/api/v1/pagos",
            "/api/v1/pedidos");

    private final RateLimiter limiter = new RateLimiter();
    private final AtomicLong peticiones = new AtomicLong();
    private final ObjectMapper objectMapper;
    private final int maxGeneral;
    private final int maxEstricto;
    private final int maxGlobal;
    private final int maxSensible;

    public RateLimitFilter(RateLimitProperties properties, ObjectMapper objectMapper) {
        this.maxGeneral = properties.maxPerMinute();
        this.maxEstricto = properties.strictPerMinute();
        this.maxGlobal = properties.globalPerMinute();
        this.maxSensible = properties.sensitivePerMinute();
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String ruta = request.getRequestURI();

        // El healthcheck de la plataforma no debe contar como abuso.
        if ("/actuator/health".equals(ruta)) {
            chain.doFilter(request, response);
            return;
        }

        // Limpieza periódica para que el mapa de ventanas no crezca sin límite.
        if (peticiones.incrementAndGet() % 500 == 0) {
            limiter.limpiar();
        }

        String ip = clientIp(request);

        // Capa 1: tope global por IP, sin importar la ruta.
        if (!limiter.intentar("global|" + ip, maxGlobal)) {
            rechazar(response, ruta, maxGlobal, ip);
            return;
        }

        // Capa 2: tope por IP + ruta, con tiers según el tipo de endpoint.
        boolean estricta = RUTAS_ESTRICTAS.stream().anyMatch(ruta::startsWith);
        // La configuración pública es una lectura tiny y la necesita cada carga de página.
        boolean sensible = RUTAS_SENSIBLES.stream().anyMatch(ruta::startsWith)
                && !"/api/v1/pagos/configuracion".equals(ruta);
        int limite = estricta ? maxEstricto : (sensible ? maxSensible : maxGeneral);
        if (!limiter.intentar(ip + "|" + ruta, limite)) {
            rechazar(response, ruta, limite, ip);
            return;
        }

        response.setHeader("X-RateLimit-Limit", String.valueOf(limite));
        response.setHeader("X-RateLimit-Policy", "global=" + maxGlobal);
        chain.doFilter(request, response);
    }

    private void rechazar(HttpServletResponse response, String ruta, int limite, String ip) throws IOException {
        int retry = Math.max(
                limiter.segundosHastaReinicio("global|" + ip),
                limiter.segundosHastaReinicio(ip + "|" + ruta));
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setHeader("Retry-After", String.valueOf(retry));
        response.setHeader("X-RateLimit-Limit", String.valueOf(limite));
        response.setHeader("X-RateLimit-Remaining", "0");
        response.setContentType("application/json;charset=UTF-8");
        objectMapper.writeValue(response.getOutputStream(), ApiResponse.error(
                "Demasiadas peticiones. Espera un momento e inténtalo de nuevo.",
                "TOO_MANY_REQUESTS", ruta));
        response.getOutputStream().flush();
    }

    /** Cabecera de Cloudflare tiene prioridad; luego el primer proxy; luego remoto. */
    private String clientIp(HttpServletRequest request) {
        String cf = limpiarIp(request.getHeader("CF-Connecting-IP"));
        if (cf != null) return cf;
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            int coma = forwarded.indexOf(',');
            String primera = coma > 0 ? forwarded.substring(0, coma) : forwarded;
            String ip = limpiarIp(primera);
            if (ip != null) return ip;
        }
        String remote = request.getRemoteAddr();
        return remote != null && !remote.isBlank() ? remote : "unknown";
    }

    private String limpiarIp(String valor) {
        if (valor == null || valor.isBlank()) return null;
        String ip = valor.trim();
        if (ip.length() > 45) return null;
        // Solo caracteres válidos en IPv4/IPv6; evita cabeceras falsas largas.
        if (!ip.matches("[0-9a-fA-F:.]+")) return null;
        return ip;
    }
}
