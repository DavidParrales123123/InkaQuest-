package com.inkaquest.modules.panel.controller;

import com.inkaquest.modules.panel.dto.PanelEstudianteResponse;
import com.inkaquest.modules.panel.service.PanelEstudianteService;
import com.inkaquest.shared.response.ApiResponse;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Endpoint agregado del panel del estudiante.
 */
@RestController
@RequestMapping("/api/v1/panel")
public class PanelController {

    private final PanelEstudianteService panelService;

    public PanelController(PanelEstudianteService panelService) {
        this.panelService = panelService;
    }

    /** GET /api/v1/panel/estudiante — cursos, progreso, XP, racha y no leidas. */
    @GetMapping("/estudiante")
    public ApiResponse<PanelEstudianteResponse> estudiante(@AuthenticationPrincipal Jwt jwt) {
        UUID id;
        try {
            id = UUID.fromString(jwt.getClaimAsString("sub"));
        } catch (IllegalArgumentException e) {
            throw new org.springframework.security.authentication.BadCredentialsException(
                    "El token no incluye un sub valido.");
        }
        return ApiResponse.ok(panelService.resumen(id), "Panel del estudiante cargado.");
    }
}
