package com.inkaquest.shared.security;

import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.oauth2.jwt.BadJwtException;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Convierte y valida los JWT emitidos por Supabase Auth usando el
 * {@link JwtDecoder} autoconfigurado.
 *
 * <p><b>No valida nada sin la clave.</b> El token se verifica criptográficamente
 * contra los metadatos que publica Supabase Auth (JWKS) o con el secreto HS256
 * configurado en {@code supabase.jwt-secret}.</p>
 *
 * <p>Extrae y tipa los claims {@code sub} (UUID del usuario en Supabase),
 * {@code email} y {@code role} y los empaqueta en {@link SupabaseJwtPrincipal}.</p>
 */
@Component
public class SupabaseJwtVerifier {

    private final JwtDecoder jwtDecoder;

    public SupabaseJwtVerifier(JwtDecoder jwtDecoder) {
        this.jwtDecoder = jwtDecoder;
    }

    /** Verifica el token y devuelve el principal. */
    public SupabaseJwtPrincipal authenticate(String bearerToken) {
        try {
            var jwt = jwtDecoder.decode(bearerToken);
            UUID usuarioId = parseSub(jwt.getClaimAsString("sub"));
            String email = stringClaim(jwt.getClaimAsString("email"));
            String rol = stringClaim(jwt.getClaimAsString("role"));
            return new SupabaseJwtPrincipal(usuarioId, email, rol);
        } catch (BadJwtException e) {
            throw new BadCredentialsException("El token no es válido o está expirado.", e);
        }
    }

    private UUID parseSub(String sub) {
        if (sub == null || sub.isBlank()) {
            throw new BadCredentialsException("El token no incluye el claim 'sub'.");
        }
        try {
            return UUID.fromString(sub);
        } catch (IllegalArgumentException e) {
            throw new BadCredentialsException("El claim 'sub' no es un UUID.", e);
        }
    }

    private String stringClaim(String value) {
        return value == null ? "" : value;
    }
}
