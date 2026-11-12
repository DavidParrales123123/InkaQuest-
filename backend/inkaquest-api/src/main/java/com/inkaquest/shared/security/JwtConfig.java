package com.inkaquest.shared.security;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Optional;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

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
 *   <li><strong>HS256 legacy</strong>: fallback para proyectos que firman con
 *   el secreto HS256 del dashboard.</li>
 * </ol>
 *
 * <p>Si no hay configuración válida la aplicación no arranca.</p>
 */
@Configuration
@EnableConfigurationProperties(SupabaseProperties.class)
public class JwtConfig {

    public static final String CURVE = "P-256";

    @Bean
    public JwtDecoder jwtDecoder(SupabaseProperties properties) {
        String jwksUri = trimToNull(properties.jwksUri());
        String secret = trimToNull(properties.jwtSecret());

        if (jwksUri != null) {
            return org.springframework.security.oauth2.jwt.NimbusJwtDecoder
                    .withJwkSetUri(jwksUri)
                    .jwsAlgorithm(org.springframework.security.oauth2.jose.jws.SignatureAlgorithm.ES256)
                    .build();
        }

        if (secret != null) {
            return NimbusJwtDecoder.withSecretKey(secretKey(secret)).build();
        }

        throw new IllegalStateException(
                "No hay configuración de JWT: ni SUPABASE_JWKS_URI ni SUPABASE_JWT_SECRET están definidos. "
                        + "Configura SUPABASE_JWKS_URI=https://<ref>.supabase.co/auth/v1/.well-known/jwks.json");
    }

    private static String trimToNull(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    private SecretKey secretKey(String secret) {
        byte[] raw;
        try {
            raw = java.util.Base64.getDecoder().decode(secret);
        } catch (IllegalArgumentException e) {
            raw = secret.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        }
        if (raw.length < 32) {
            throw new IllegalStateException(
                    "SUPABASE_JWT_SECRET tiene menos de 32 bytes: no puede firmar/verificar HS256.");
        }
        return new SecretKeySpec(raw, "HmacSHA256");
    }
}
