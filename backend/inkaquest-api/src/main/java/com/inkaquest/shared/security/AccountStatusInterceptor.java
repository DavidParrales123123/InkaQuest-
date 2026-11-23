package com.inkaquest.shared.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Map;
import java.util.UUID;

/**
 * Corta cualquier petición autenticada de una cuenta suspendida o eliminada.
 *
 * <p>Se registra como interceptor de Spring MVC: se ejecuta DESPUÉS del filtro
 * JWT (hay Authentication) y antes del controller. Es la autoridad real aunque
 * la RLS esté en modo degradado, porque consulta el perfil con el rol de
 * conexión, sin depender de políticas.</p>
 */
@Component
public class AccountStatusInterceptor implements HandlerInterceptor {

    private static final String EXCLUIDO = "/api/v1/usuarios/yo";

    private final JdbcTemplate jdbc;
    private final ObjectMapper mapper = new ObjectMapper();

    public AccountStatusInterceptor(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws Exception {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof Jwt jwt)) {
            return true;
        }
        String ruta = request.getRequestURI();
        // Se permite leer el propio perfil para mostrar el aviso de suspensión.
        if (ruta.equals(EXCLUIDO) || ruta.startsWith(EXCLUIDO + "/")) {
            return true;
        }
        String sub = jwt.getClaimAsString("sub");
        if (sub == null) {
            return true;
        }
        String estado;
        try {
            estado = jdbc.queryForObject(
                    "select estado_cuenta::text from public.perfil where id = ?",
                    String.class, UUID.fromString(sub));
        } catch (Exception e) {
            // Sin perfil no hay autorización que proteger; el servicio correspondiente decidirá.
            return true;
        }
        if ("suspendido".equals(estado) || "eliminado".equals(estado)) {
            response.setStatus(HttpStatus.FORBIDDEN.value());
            response.setContentType("application/json;charset=UTF-8");
            mapper.writeValue(response.getWriter(), Map.of(
                    "success", false,
                    "message", "Tu cuenta está suspendida. Contacta con el administrador.",
                    "error", "CUENTA_SUSPENDIDA"));
            return false;
        }
        return true;
    }
}
