package com.inkaquest.modules.soporte.controller;

import com.inkaquest.modules.soporte.dto.AnuncioResponse;
import com.inkaquest.modules.soporte.repository.AnuncioRepository;
import com.inkaquest.shared.response.ApiResponse;
import com.inkaquest.shared.security.RlsExecutor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Endpoints de avisos para el estudiante: anuncios de sus cursos.
 */
@RestController
@RequestMapping("/api/v1/anuncios")
public class AnunciosController {

    private final AnuncioRepository anuncioRepository;
    private final RlsExecutor rlsExecutor;

    public AnunciosController(AnuncioRepository anuncioRepository, RlsExecutor rlsExecutor) {
        this.anuncioRepository = anuncioRepository;
        this.rlsExecutor = rlsExecutor;
    }

    /** GET /api/v1/anuncios — avisos de mis cursos matriculados, fijados primero. */
    @GetMapping
    public ApiResponse<List<AnuncioResponse>> misAvisos(@AuthenticationPrincipal Jwt jwt) {
        UUID usuarioId;
        try {
            usuarioId = UUID.fromString(jwt.getClaimAsString("sub"));
        } catch (IllegalArgumentException e) {
            throw new org.springframework.security.authentication.BadCredentialsException(
                    "El token no incluye un sub valido.");
        }
        List<AnuncioResponse> anuncios = rlsExecutor.executeAs(usuarioId, () ->
                anuncioRepository.findVisiblesPara(usuarioId).stream()
                        .map(AnuncioResponse::from)
                        .toList());
        return ApiResponse.ok(anuncios, "Avisos cargados.");
    }
}
