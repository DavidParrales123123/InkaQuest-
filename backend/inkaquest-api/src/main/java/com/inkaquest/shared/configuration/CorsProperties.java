package com.inkaquest.shared.configuration;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

/**
 * Propiedades de configuración de la capa de presentación.
 *
 * <p>Se enlazan desde {@code application.yml} con el prefijo {@code app.cors}
 * y admiten sobreescritura por variables de entorno.
 */
@ConfigurationProperties(prefix = "app.cors")
public record CorsProperties(
        /** Orígenes permitidos del frontend. */
        List<String> allowedOrigins,
        /** Métodos HTTP permitidos. */
        List<String> allowedMethods,
        /** Cabeceras permitidos. */
        List<String> allowedHeaders,
        /** Si se permiten credenciales (cookies/Authorization). */
        boolean allowCredentials,
        /** Tiempo máximo de cache de la respuesta de preflight, en segundos. */
        long maxAge) {

    public CorsProperties {
        allowedOrigins = allowedOrigins == null ? List.of() : List.copyOf(allowedOrigins);
        allowedMethods = allowedMethods == null ? List.of() : List.copyOf(allowedMethods);
        allowedHeaders = allowedHeaders == null ? List.of() : List.copyOf(allowedHeaders);
    }
}
