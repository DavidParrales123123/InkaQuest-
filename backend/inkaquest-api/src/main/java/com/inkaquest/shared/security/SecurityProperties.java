package com.inkaquest.shared.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

/**
 * Propiedades de seguridad de la API.
 *
 * <p>Se enlazan desde {@code application.yml} con el prefijo {@code app.security}.
 * Los valores sensibles (por ejemplo, el secreto de Supabase para validar JWT)
 * se inyectan por variable de entorno y nunca se versionan.
 */
@ConfigurationProperties(prefix = "app.security")
public record SecurityProperties(
        /** Orígenes desde los que se acepta el token JWT de Supabase. */
        List<String> allowedOrigins,
        /** Rutas públicas que no requieren autenticación. */
        List<String> publicEndpoints) {

    public SecurityProperties {
        allowedOrigins = allowedOrigins == null ? List.of() : List.copyOf(allowedOrigins);
        publicEndpoints = publicEndpoints == null ? List.of() : List.copyOf(publicEndpoints);
    }
}
