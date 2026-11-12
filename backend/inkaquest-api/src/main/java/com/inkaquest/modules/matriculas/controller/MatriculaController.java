package com.inkaquest.modules.matriculas.controller;

import com.inkaquest.modules.matriculas.dto.MatriculaRequest;
import com.inkaquest.modules.matriculas.dto.MatriculaResponse;
import com.inkaquest.modules.matriculas.service.MatriculaService;
import com.inkaquest.shared.response.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.validation.annotation.Validated;

import java.util.List;
import java.util.UUID;

/**
 * Endpoint REST de matriculas.
 */
@RestController
@RequestMapping("/api/v1/matriculas")
@Validated
public class MatriculaController {

    private final MatriculaService matriculaService;

    public MatriculaController(MatriculaService matriculaService) {
        this.matriculaService = matriculaService;
    }

    @GetMapping("/yo")
    public ApiResponse<List<MatriculaResponse>> yo(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.ok(matriculaService.misMatriculas(authId(jwt)),
                "Matrículas cargadas.");
    }

    @PostMapping("/matricularme")
    public ApiResponse<MatriculaResponse> matricularme(@AuthenticationPrincipal Jwt jwt,
                                                        @Valid @RequestBody MatriculaRequest request) {
        return ApiResponse.ok(matriculaService.matricularme(authId(jwt), request),
                "Te has matriculado correctamente.");
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> cancelar(@AuthenticationPrincipal Jwt jwt,
                                       @PathVariable UUID id) {
        matriculaService.cancelar(authId(jwt), id);
        return ApiResponse.ok("Matrícula cancelada correctamente.");
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
