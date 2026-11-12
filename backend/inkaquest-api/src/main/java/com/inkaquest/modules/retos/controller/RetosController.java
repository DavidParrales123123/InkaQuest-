package com.inkaquest.modules.retos.controller;

import com.inkaquest.modules.retos.dto.*;
import com.inkaquest.modules.retos.entity.Lenguaje;
import com.inkaquest.modules.retos.service.RetoService;
import com.inkaquest.shared.response.ApiResponse;
import jakarta.validation.Valid;
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
 * Endpoints de retos de programacion (seccion retos).
 */
@RestController
@RequestMapping("/api/v1")
@Validated
public class RetosController {

    private final RetoService retoService;

    public RetosController(RetoService retoService) {
        this.retoService = retoService;
    }

    private static UUID authId(Jwt jwt) {
        try {
            return UUID.fromString(jwt.getClaimAsString("sub"));
        } catch (IllegalArgumentException e) {
            throw new org.springframework.security.authentication.BadCredentialsException(
                    "El token no incluye un sub valido.");
        }
    }

    /** GET /api/v1/retos — retos publicados paginados. */
    @GetMapping("/retos")
    public ApiResponse<Page<RetoResumenResponse>> listar(@AuthenticationPrincipal Jwt jwt,
                                                         @RequestParam(defaultValue = "0") @Min(value = 0, message = "La pagina debe ser >= 0.") int page,
                                                         @RequestParam(defaultValue = "20") @Min(value = 1, message = "El tamano debe ser >= 1.") @Max(value = 100, message = "El tamano maximo es 100.") int size) {
        PageRequest pageable = PageRequest.of(Math.max(0, page),
                Math.max(1, Math.min(100, size)), Sort.by("creadoEn").descending());
        return ApiResponse.ok(retoService.listar(authId(jwt), null, pageable), "Retos cargados.");
    }

    /** GET /api/v1/retos/{id} — detalle + casos publicos. */
    @GetMapping("/retos/{id}")
    public ApiResponse<RetoDetalleResponse> detalle(@AuthenticationPrincipal Jwt jwt,
                                                    @PathVariable UUID id) {
        return ApiResponse.ok(retoService.detalle(authId(jwt), id), "Reto cargado.");
    }

    /** GET /api/v1/retos/{id}/intentos-restantes — intentos antes de agotarlos. */
    @GetMapping("/retos/{id}/intentos-restantes")
    public ApiResponse<Integer> intentosRestantes(@AuthenticationPrincipal Jwt jwt,
                                                  @PathVariable UUID id) {
        return ApiResponse.ok(retoService.intentosRestantes(authId(jwt), id), "Intentos restantes.");
    }

    /** POST /api/v1/retos/{id}/envios — registrar solucion (queda pendiente de ejecucion). */
    @PostMapping("/retos/{id}/envios")
    public ApiResponse<EnvioRetoResponse> enviar(@AuthenticationPrincipal Jwt jwt,
                                                 @PathVariable UUID id,
                                                 @Valid @RequestBody EnvioCrearRequest request) {
        return ApiResponse.ok(retoService.enviar(authId(jwt), id, request),
                "Envio registrado. Quedara en cola de evaluacion.");
    }

    /** GET /api/v1/retos/{id}/envios/yo — mis envios en el reto. */
    @GetMapping("/retos/{id}/envios/yo")
    public ApiResponse<List<EnvioRetoResponse>> misEnvios(@AuthenticationPrincipal Jwt jwt,
                                                          @PathVariable UUID id) {
        return ApiResponse.ok(retoService.misEnvios(authId(jwt), id), "Envios cargados.");
    }

    /** GET /api/v1/lenguajes — lenguajes activos. */
    @GetMapping("/lenguajes")
    public ApiResponse<List<Lenguaje>> lenguajes(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.ok(retoService.lenguajes(authId(jwt)), "Lenguajes cargados.");
    }
}
