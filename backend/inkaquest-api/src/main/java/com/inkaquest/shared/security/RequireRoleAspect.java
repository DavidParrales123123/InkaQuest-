package com.inkaquest.shared.security;

import com.inkaquest.shared.enums.RolUsuario;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

/**
 * Aspect de control de acceso por rol.
 *
 * <p>Sustituye a {@code @PreAuthorize} para verificacion de rol efectiva a
 * nivel de metodo/controlador, sin que el desarrollador deba leer Perfil
 * manualmente.</p>
 *
 * <p>Funciona contra la base de datos real: el usuario solo puede ejecutar el
 * metodo si su fila en {@code public.perfil} tiene uno de los roles
 * configurados en la anotacion. El rol NUNCA proviene del token.</p>
 *
 * <p><b>Sobre los dos pointcuts.</b> Spring AOP no admite mezclar
 * {@code @annotation(x)} y {@code @within(x)} en un mismo pointcut con el
 * mismo nombre de parametro: una de las ramas liga el argumento como null.
 * Por eso se separan en dos advices que comparten la logica.</p>
 */
@Aspect
@Component
public class RequireRoleAspect {

    private final CheckRoleService checkRoleService;

    public RequireRoleAspect(CheckRoleService checkRoleService) {
        this.checkRoleService = checkRoleService;
    }

    /** Anotacion colocada en el metodo del controlador/servicio. */
    @Around("@annotation(requireRole)")
    public Object verificarMetodo(ProceedingJoinPoint joinPoint, RequireRole requireRole) throws Throwable {
        return verificar(joinPoint, requireRole);
    }

    /** Anotacion colocada en la clase completa. */
    @Around("@within(requireRole)")
    public Object verificarClase(ProceedingJoinPoint joinPoint, RequireRole requireRole) throws Throwable {
        return verificar(joinPoint, requireRole);
    }

    private Object verificar(ProceedingJoinPoint joinPoint, RequireRole requireRole) throws Throwable {
        Authentication authentication = org.springframework.security.core.context.SecurityContextHolder.getContext()
                .getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof Jwt jwt)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Autenticacion requerida.");
        }
        UUID usuarioId;
        try {
            usuarioId = UUID.fromString(jwt.getClaimAsString("sub"));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token sin sub valido.");
        }

        if (requireRole == null || !checkRoleService.usuarioTieneRol(usuarioId, requireRole.value())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "No tienes permisos para acceder a este recurso.");
        }
        return joinPoint.proceed();
    }
}
