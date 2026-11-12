package com.inkaquest.modules.progreso.controller;

import com.inkaquest.modules.progreso.dto.ProgresoCursoResponse;
import com.inkaquest.modules.progreso.service.ProgresoService;
import com.inkaquest.shared.response.ApiResponse;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.validation.annotation.Validated;

import java.util.List;
import java.util.UUID;

/**
 * Endpoint del progreso académico del estudiante autenticado.
 */
@RestController
@RequestMapping("/api/v1/progreso")
@Validated
public class ProgresoController {

    private final ProgresoService progresoService;

    public ProgresoController(ProgresoService progresoService) {
        this.progresoService = progresoService;
    }

    /** GET /api/v1/progreso/yo — listado de mis cursos con su progreso. */
    @GetMapping("/yo")
    public ApiResponse<List<ProgresoCursoResponse>> yo(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.ok(progresoService.misProgresos(authId(jwt)),
                "Progreso cargado.");
    }

    /**
     * POST /api/v1/progreso/lecciones/{leccionId}/completar —
     * marca la leccion como completada para el estudiante autenticado.
     */
    @PostMapping("/lecciones/{leccionId}/completar")
    public ApiResponse<com.inkaquest.modules.progreso.dto.LeccionCompletadaResponse> completar(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID leccionId) {
        return ApiResponse.ok(progresoService.completarLeccion(authId(jwt), leccionId),
                "Leccion completada.");
    }

    private static UUID authId(Jwt jwt) {
        try {
            return UUID.fromString(jwt.getClaimAsString("sub"));
        } catch (IllegalArgumentException e) {
            throw new org.springframework.security.authentication.BadCredentialsException(
                    "El token no incluye un sub válido.");
        }
    }
}
