package com.inkaquest.shared.security;

import java.util.UUID;

/**
 * Representa al usuario autenticado por el JWT de Supabase Auth.
 *
 * @param usuarioId UUID del usuario (claim {@code sub} del token)
 * @param email     email del usuario (claim {@code email})
 * @param rol       rol del usuario (claim {@code role} del token; el rol
 *                  efectivo de la aplicación se resuelve siempre contra
 *                  {@code public.perfil.rol} en PostgreSQL)
 */
public record SupabaseJwtPrincipal(UUID usuarioId, String email, String rol) {

    public SupabaseJwtPrincipal {
        if (usuarioId == null) {
            throw new IllegalArgumentException("El sub del token no puede ser nulo");
        }
        if (rol == null || rol.isBlank()) {
            rol = "authenticated";
        }
    }
}
