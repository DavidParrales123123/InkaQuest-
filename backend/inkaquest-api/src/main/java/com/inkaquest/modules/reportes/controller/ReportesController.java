package com.inkaquest.modules.reportes.controller;

import com.inkaquest.modules.reportes.dto.RendimientoCursoResponse;
import com.inkaquest.modules.reportes.dto.ResumenAdminResponse;
import com.inkaquest.modules.reportes.service.ReportesService;
import com.inkaquest.shared.enums.RolUsuario;
import com.inkaquest.shared.response.ApiResponse;
import com.inkaquest.shared.security.RequireRole;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.UUID;

/**
 * Endpoints de reportes y analitica.
 */
@RestController
@RequestMapping("/api/v1/reportes")
@Validated
public class ReportesController {

    private final ReportesService reportesService;

    public ReportesController(ReportesService reportesService) {
        this.reportesService = reportesService;
    }

    private static UUID authId(Jwt jwt) {
        try {
            return UUID.fromString(jwt.getClaimAsString("sub"));
        } catch (IllegalArgumentException e) {
            throw new org.springframework.security.authentication.BadCredentialsException(
                    "El token no incluye un sub valido.");
        }
    }

    /** GET /api/v1/reportes/admin/resumen — agregados globales de la plataforma (admin). */
    @RequireRole(RolUsuario.administrador)
    @GetMapping("/admin/resumen")
    public ApiResponse<ResumenAdminResponse> resumenAdmin(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.ok(reportesService.resumenAdmin(authId(jwt)), "Resumen administrativo cargado.");
    }

    /**
     * GET /api/v1/reportes/docente/cursos/{slug}/rendimiento — rendimiento de un
     * curso (creador/docente asignado/admin).
     */
    @GetMapping("/docente/cursos/{slug}/rendimiento")
    public ApiResponse<RendimientoCursoResponse> rendimientoCurso(@AuthenticationPrincipal Jwt jwt,
                                                                  @PathVariable @Size(min = 1, max = 200) @Pattern(regexp = "^[a-z0-9]+(-[a-z0-9]+)*$", message = "Slug de curso invalido.") String slug) {
        return ApiResponse.ok(reportesService.rendimientoCurso(authId(jwt), slug),
                "Rendimiento del curso cargado.");
    }
}
