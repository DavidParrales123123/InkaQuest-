package com.inkaquest.shared.logging;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * Filtro para logging de peticiones HTTP.
 *
 * <p>Características:
 * <ul>
 *   <li>Asigna un {@code request-id} único a cada petición (MDC)</li>
 *   <li>Registra método, URI, IP y duración en logs TEXTO PLANO</li>
 *   <li>NO registra cuerpos de petición/respuesta (por seguridad y performance)</li>
 *   <li>NO registra headers sensibles (Authorization, Cookie)</li>
 * </ul>
 *
 * <p>Formato de log: Texto plano legible, NO JSON en desarrollo.
 * En producción usar logback-spring.xml con formato JSON estructurado.</p>
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestLoggingFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RequestLoggingFilter.class);

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                     HttpServletResponse response,
                                     FilterChain filterChain) throws ServletException, IOException {
        // Generar request ID único
        String requestId = UUID.randomUUID().toString();
        MDC.put("request-id", requestId);
        MDC.put("method", request.getMethod());
        MDC.put("uri", request.getRequestURI());
        
        // Obtener IP real (detrás de proxy/CDN)
        String ip = obtenerIpReal(request);
        MDC.put("ip", ip);

        long startTime = System.currentTimeMillis();

        try {
            // Log de inicio (nivel DEBUG para no saturar en producción)
            if (log.isDebugEnabled()) {
                log.debug("Iniciando petición: {} {} desde IP: {}", 
                    request.getMethod(), 
                    request.getRequestURI(),
                    ip);
            }

            filterChain.doFilter(request, response);

        } finally {
            long duration = System.currentTimeMillis() - startTime;
            MDC.put("duration", String.valueOf(duration));
            MDC.put("status", String.valueOf(response.getStatus()));

            // Log de finalización (nivel INFO para auditoría)
            log.info("Petición completada: {} {} -> {} ({} ms)", 
                request.getMethod(),
                request.getRequestURI(),
                response.getStatus(),
                duration);

            // Limpiar MDC
            MDC.clear();
        }
    }

    /**
     * Obtiene la IP real del cliente, considerando proxies y CDNs.
     *
     * <p>Orden de prioridad:
     * <ol>
     *   <li>X-Forwarded-For (primer IP de la lista)</li>
     *   <li>X-Real-IP</li>
     *   <li>RemoteAddr</li>
     * </ol>
     */
    private String obtenerIpReal(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip != null && !ip.isBlank()) {
            // X-Forwarded-For puede contener múltiples IPs separadas por coma
            ip = ip.split(",")[0].trim();
        }
        if (ip == null || ip.isBlank()) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isBlank()) {
            ip = request.getRemoteAddr();
        }
        return ip != null ? ip : "unknown";
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        // No loguear peticiones a actuator ni swagger (demasiado verboso)
        String path = request.getRequestURI();
        return path.startsWith("/actuator") || 
               path.startsWith("/swagger-ui") || 
               path.startsWith("/api-docs");
    }
}
