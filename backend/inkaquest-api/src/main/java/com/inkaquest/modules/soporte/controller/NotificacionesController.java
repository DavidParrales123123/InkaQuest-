package com.inkaquest.modules.soporte.controller;

import com.inkaquest.modules.soporte.dto.NotificacionResponse;
import com.inkaquest.modules.soporte.service.NotificacionesService;
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

import java.util.UUID;

/**
 * Endpoints de notificaciones del usuario autenticado.
 */
@RestController
@RequestMapping("/api/v1/notificaciones")
@Validated
public class NotificacionesController {

    private final NotificacionesService notificacionesService;

    public NotificacionesController(NotificacionesService notificacionesService) {
        this.notificacionesService = notificacionesService;
    }

    private static UUID authId(Jwt jwt) {
        try {
            return UUID.fromString(jwt.getClaimAsString("sub"));
        } catch (IllegalArgumentException e) {
            throw new org.springframework.security.authentication.BadCredentialsException(
                    "El token no incluye un sub valido.");
        }
    }

    /** GET /api/v1/notificaciones/yo?page=&size= — mis notificaciones paginadas. */
    @GetMapping("/yo")
    public ApiResponse<Page<NotificacionResponse>> yo(@AuthenticationPrincipal Jwt jwt,
                                                      @RequestParam(defaultValue = "0") @Min(value = 0, message = "La pagina debe ser >= 0.") int page,
                                                      @RequestParam(defaultValue = "20") @Min(value = 1, message = "El tamano debe ser >= 1.") @Max(value = 100, message = "El tamano maximo es 100.") int size) {
        int s = Math.max(1, Math.min(100, size));
        PageRequest pageable = PageRequest.of(Math.max(0, page), s,
                Sort.by("creadoEn").descending());
        return ApiResponse.ok(notificacionesService.misNotificaciones(authId(jwt), pageable),
                "Notificaciones cargadas.");
    }

    /** GET /api/v1/notificaciones/yo/no-leidas — cantidad. */
    @GetMapping("/yo/no-leidas")
    public ApiResponse<Long> noLeidas(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.ok(notificacionesService.contarNoLeidas(authId(jwt)),
                "Contador de notificaciones no leidas.");
    }

    /** POST /api/v1/notificaciones/{id}/leida — marcar una como leida. */
    @PostMapping("/{id}/leida")
    public ApiResponse<NotificacionResponse> marcarLeida(@AuthenticationPrincipal Jwt jwt,
                                                         @PathVariable UUID id) {
        return ApiResponse.ok(notificacionesService.marcarLeida(authId(jwt), id),
                "Notificacion marcada como leida.");
    }

    /** POST /api/v1/notificaciones/leidas — marcar todas como leidas. */
    @PostMapping("/leidas")
    public ApiResponse<Integer> marcarTodasLeidas(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.ok(notificacionesService.marcarTodasLeidas(authId(jwt)),
                "Notificaciones marcadas como leidas.");
    }
}
