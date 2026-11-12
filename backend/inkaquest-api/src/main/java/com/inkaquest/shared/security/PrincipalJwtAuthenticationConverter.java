package com.inkaquest.shared.security;

import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;

import java.util.List;
import java.util.UUID;

/**
 * Convierte el JWT de Supabase a un {@code JwtAuthenticationToken} cuya
 * autoridad principal es el UUID del usuario, no el {@code role} del token.
 *
 * <p>El rol {@code authenticated} que trae el token se mapea a la autoridad
 * {@code ROLE_AUTHENTICATED} para poder usarlo en {@code @PreAuthorize}. La
 * autorización REAL por rol (estudiante/docente/administrador) se evalúa en
 * base de datos contra {@code perfil.rol}; no se puede falsear.</p>
 */
public final class PrincipalJwtAuthenticationConverter extends JwtAuthenticationConverter {

    public PrincipalJwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter authorities = new JwtGrantedAuthoritiesConverter();
        authorities.setAuthoritiesClaimName("role");
        authorities.setAuthorityPrefix("ROLE_");
        setJwtGrantedAuthoritiesConverter(authorities);
    }

    /** Extrae el UUID del sub, compatible con cualquier controller o servicio. */
    public static UUID usuarioId(org.springframework.security.core.Authentication authentication) {
        if (authentication == null) {
            return null;
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof Jwt jwt) {
            try {
                return UUID.fromString(jwt.getClaimAsString("sub"));
            } catch (IllegalArgumentException e) {
                return null;
            }
        }
        return null;
    }

    /** Lista de authorities del token (exposición explícita al consumidor). */
    public static List<String> authorities(org.springframework.security.core.Authentication authentication) {
        if (authentication == null) {
            return List.of();
        }
        return authentication.getAuthorities().stream()
                .map(Object::toString)
                .toList();
    }
}
