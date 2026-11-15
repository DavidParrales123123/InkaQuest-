package com.inkaquest.modules.gamificacion.controller;

import com.inkaquest.modules.academico.repository.DocenteCursoRepository;
import com.inkaquest.modules.identidad.entity.Perfil;
import com.inkaquest.modules.identidad.repository.PerfilRepository;
import com.inkaquest.modules.matriculas.repository.MatriculaRepository;
import com.inkaquest.shared.enums.EstadoMatricula;
import com.inkaquest.shared.enums.RolUsuario;
import com.inkaquest.shared.response.ApiResponse;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.validation.annotation.Validated;

import java.util.UUID;

/**
 * Derecho de acceso al videojuego Guardianes del Conocimiento del curso
 * Principios de Algoritmos. Autoridad Spring Security: la autenticación del
 * JWT (JWKS de Supabase) ya es la puerta de la plataforma.
 */
@RestController
@RequestMapping("/api/v1/gamificacion/guardianes")
@Validated
public class GuardianesController {

    /** Curso dueño del videojuego: Principios de Algoritmos. */
    private static final UUID CURSO_PRINCIPIOS = UUID.fromString("ab8e59ef-ab9f-40eb-8f31-790ac7edba4a");

    private final MatriculaRepository matriculaRepository;
    private final DocenteCursoRepository docenteCursoRepository;
    private final PerfilRepository perfilRepository;

    public GuardianesController(MatriculaRepository matriculaRepository,
                                DocenteCursoRepository docenteCursoRepository,
                                PerfilRepository perfilRepository) {
        this.matriculaRepository = matriculaRepository;
        this.docenteCursoRepository = docenteCursoRepository;
        this.perfilRepository = perfilRepository;
    }

    /** GET /api/v1/gamificacion/guardianes/acceso */
    @GetMapping("/acceso")
    public ApiResponse<AccesoGuardianesResponse> acceso(@AuthenticationPrincipal Jwt jwt) {
        UUID uid = authId(jwt);
        RolUsuario rol = perfilRepository.findById(uid)
                .map(Perfil::getRol)
                .orElse(RolUsuario.estudiante);
        boolean admin = (rol == RolUsuario.administrador);
        boolean estudiante = admin
                || matriculaRepository.existsByEstudianteIdIdAndCursoIdIdAndEstado(uid, CURSO_PRINCIPIOS, EstadoMatricula.activa)
                || matriculaRepository.existsByEstudianteIdIdAndCursoIdIdAndEstado(uid, CURSO_PRINCIPIOS, EstadoMatricula.completada);
        boolean docente = admin
                || docenteCursoRepository.findActiva(uid, CURSO_PRINCIPIOS).isPresent();
        return ApiResponse.ok(new AccesoGuardianesResponse(estudiante, docente, admin), "Acceso revisado.");
    }

    /** Respuesta pública del control: qué roles puede ver/jugar el usuario. */
    public record AccesoGuardianesResponse(boolean estudiante, boolean docente, boolean administrador) { }

    private static UUID authId(Jwt jwt) {
        try {
            return UUID.fromString(jwt.getClaimAsString("sub"));
        } catch (IllegalArgumentException e) {
            throw new org.springframework.security.authentication.BadCredentialsException(
                    "El token no incluye un sub valido.");
        }
    }
}
