package com.inkaquest.shared.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Propiedades de Supabase que necesita el backend para validar los JWT que
 * emite Supabase Auth.
 *
 * <p>Se enlazan desde {@code application.yml} bajo el prefijo {@code supabase}.
 * Los valores sensibles se inyectan por variable de entorno y nunca se
 * versionan.</p>
 *
 * @param url            URL del proyecto Supabase (ej. https://<ref>.supabase.co)
 * @param anonKey        clave pública anon (NO es secreta)
 * @param serviceRoleKey clave service_role; solo backend, NUNCA debe llegar al cliente
 * @param jwtSecret      secreto HS256 usado por Supabase Auth para firmar
 *                       los access tokens; lo necesita el JwtDecoder
 * @param jwksUri        URI JWKS asimétrica (RS256) opcional; si se configura,
 *                       se valida por firma asimétrica en lugar de HS256
 */
@ConfigurationProperties(prefix = "supabase")
public record SupabaseProperties(
        String url,
        String anonKey,
        String serviceRoleKey,
        String jwtSecret,
        String jwksUri) {

    public SupabaseProperties {
        url = url == null ? "" : url;
        anonKey = anonKey == null ? "" : anonKey;
        serviceRoleKey = serviceRoleKey == null ? "" : serviceRoleKey;
        jwtSecret = jwtSecret == null ? "" : jwtSecret;
        jwksUri = jwksUri == null ? "" : jwksUri;
    }

    /** Indica si hay configuración mínima para validar JWT. */
    public boolean configurado() {
        return !(jwtSecret.isBlank() && jwksUri.isBlank());
    }
}
