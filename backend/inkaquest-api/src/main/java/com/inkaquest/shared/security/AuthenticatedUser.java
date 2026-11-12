package com.inkaquest.shared.security;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Anotación para inyectar el ID del usuario autenticado en los parámetros del controlador.
 * 
 * <p>Uso:
 * <pre>
 * {@code @GetMapping("/mi-perfil")}
 * public ResponseEntity&lt;Perfil&gt; obtenerPerfil({@code @AuthenticatedUser UUID userId}) {
 *     // userId contiene el sub del JWT
 * }
 * </pre>
 *
 * <p>El resolver extrae el {@code sub} claim del JWT validado por Spring Security.
 */
@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
public @interface AuthenticatedUser {
}
