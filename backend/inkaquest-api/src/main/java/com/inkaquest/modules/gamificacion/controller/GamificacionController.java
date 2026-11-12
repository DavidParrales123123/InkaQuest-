package com.inkaquest.modules.gamificacion.controller;

import com.inkaquest.modules.gamificacion.dto.*;
import com.inkaquest.modules.gamificacion.service.GamificacionService;
import com.inkaquest.shared.response.ApiResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

import java.util.List;
import java.util.UUID;

/**
 * Endpoints de lectura del estado gamificado (seccion gamificacion).
 */
@RestController
@RequestMapping("/api/v1/gamificacion")
@Validated
public class GamificacionController {

    private final GamificacionService gamificacionService;

    public GamificacionController(GamificacionService gamificacionService) {
        this.gamificacionService = gamificacionService;
    }

    private static UUID authId(Jwt jwt) {
        try {
            return UUID.fromString(jwt.getClaimAsString("sub"));
        } catch (IllegalArgumentException e) {
            throw new org.springframework.security.authentication.BadCredentialsException(
                    "El token no incluye un sub valido.");
        }
    }

    /** GET /api/v1/gamificacion/yo — resumen XP/nivel/racha/monedas/insignias/misiones. */
    @GetMapping("/yo")
    public ApiResponse<GamificacionResumenResponse> yo(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.ok(gamificacionService.resumen(authId(jwt)), "Resumen gamificado cargado.");
    }

    /** GET /api/v1/gamificacion/insignias — catalogo + mi progreso. */
    @GetMapping("/insignias")
    public ApiResponse<List<InsigniaCatalogoResponse>> insignias(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.ok(gamificacionService.insignias(authId(jwt)), "Insignias cargadas.");
    }

    /** GET /api/v1/gamificacion/misiones — misiones activas con mi progreso. */
    @GetMapping("/misiones")
    public ApiResponse<List<MisionResponse>> misiones(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.ok(gamificacionService.misiones(authId(jwt)), "Misiones cargadas.");
    }

    /** GET /api/v1/gamificacion/temporada-actual — temporada activa (o null). */
    @GetMapping("/temporada-actual")
    public ApiResponse<TemporadaResponse> temporadaActual(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.ok(gamificacionService.temporadaActual(authId(jwt)), "Temporada cargada.");
    }

    /** GET /api/v1/gamificacion/ranking — temporada activa: top 20 + mi puesto. */
    @GetMapping("/ranking")
    public ApiResponse<RankingTemporadaResponse> ranking(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.ok(gamificacionService.ranking(authId(jwt)), "Ranking cargado.");
    }

    /** GET /api/v1/gamificacion/transacciones-xp?page=&size= — historial XP paginado. */
    @GetMapping("/transacciones-xp")
    public ApiResponse<Page<TransaccionXpResponse>> transacciones(@AuthenticationPrincipal Jwt jwt,
                                                                  @RequestParam(defaultValue = "0") @Min(value = 0, message = "La pagina debe ser >= 0.") int page,
                                                                  @RequestParam(defaultValue = "20") @Min(value = 1, message = "El tamano debe ser >= 1.") @Max(value = 100, message = "El tamano maximo es 100.") int size) {
        int s = Math.max(1, Math.min(100, size));
        PageRequest pageable = PageRequest.of(Math.max(0, page), s, Sort.by("creadoEn").descending());
        return ApiResponse.ok(gamificacionService.transacciones(authId(jwt), pageable),
                "Transacciones cargadas.");
    }
}
