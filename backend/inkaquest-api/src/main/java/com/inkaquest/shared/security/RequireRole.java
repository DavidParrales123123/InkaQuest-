package com.inkaquest.shared.security;

import com.inkaquest.shared.enums.RolUsuario;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Restringe el método/controlador a usuarios cuyo {@code perfil.rol} coincida
 * con alguno de los roles indicados.
 *
 * <p>El rol del usuario autenticado se resuelve SIEMPRE contra
 * {@code public.perfil.rol} en PostgreSQL —nunca se confía en el token.</p>
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface RequireRole {
    /** Roles requeridos (OR lógico entre ellos). */
    RolUsuario[] value();
}
