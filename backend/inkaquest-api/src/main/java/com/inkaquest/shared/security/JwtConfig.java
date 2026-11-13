package com.inkaquest.shared.security;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;

/**
 * Configura el {@code JwtDecoder} que valida los tokens firmados por Supabase
 * Auth.
 *
 * <p><b>Estrategia.</b></p>
 * <ol>
 *   <li><strong>ES256 vía JWKS</strong> (proyecto actual): la public key se
 *   publica en {@code /.well-known/jwks.json}. El {@code NimbusJwtDecoder}
 *   inspecciona el header del token y acepta ES256/RS256 según lo que aparezca
 *   en el JWKS.</li>
 * </ol>
 *
 * <p>Si la variable {@code SUPABASE_JWKS_URI} viene vacía o ausente, se usa el
 * JWKS público del proyecto actual. Un valor explícito sigue teniendo
 * prioridad.</p>
 */
@Configuration
@EnableConfigurationProperties(SupabaseProperties.class)
public class JwtConfig {

    /** JWKS público del proyecto "Inkaquest mejorado" (endpoint público). */
    public static final String DEFAULT_JWKS_URI =
            "https://nrfdifzechrjikrvzhdl.supabase.co/auth/v1/.well-known/jwks.json";

    @Bean
    public JwtDecoder jwtDecoder(SupabaseProperties properties) {
        String jwksUri = trimToNull(properties.jwksUri());

        // Si la URL viene vacía o ausente, usamos el JWKS público del proyecto
        // actual (siempre firma ES256). Un SUPABASE_JWKS_URI explícito sigue
        // teniendo prioridad sobre este valor.
        if (jwksUri == null) {
            jwksUri = DEFAULT_JWKS_URI;
        }

        return org.springframework.security.oauth2.jwt.NimbusJwtDecoder
                .withJwkSetUri(jwksUri)
                .jwsAlgorithm(org.springframework.security.oauth2.jose.jws.SignatureAlgorithm.ES256)
                .build();
    }

    private static String trimToNull(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }
}
