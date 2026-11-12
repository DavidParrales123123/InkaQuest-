package com.inkaquest.modules.soporte.controller;

import com.inkaquest.modules.soporte.dto.HiloResumenResponse;
import com.inkaquest.modules.soporte.dto.MensajeCrearRequest;
import com.inkaquest.modules.soporte.dto.MensajeResponse;
import com.inkaquest.modules.soporte.service.MensajesService;
import com.inkaquest.shared.response.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Endpoints de mensajeria (chat 1 a 1).
 */
@RestController
@RequestMapping("/api/v1/mensajes")
public class MensajesController {

    private final MensajesService mensajesService;

    public MensajesController(MensajesService mensajesService) {
        this.mensajesService = mensajesService;
    }

    private static UUID authId(Jwt jwt) {
        try {
            return UUID.fromString(jwt.getClaimAsString("sub"));
        } catch (IllegalArgumentException e) {
            throw new org.springframework.security.authentication.BadCredentialsException(
                    "El token no incluye un sub valido.");
        }
    }

    /** GET /api/v1/mensajes/hilos — conversaciones del usuario autenticado. */
    @GetMapping("/hilos")
    public ApiResponse<List<HiloResumenResponse>> hilos(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.ok(mensajesService.hilos(authId(jwt)), "Conversaciones cargadas.");
    }

    /** GET /api/v1/mensajes/{otroId} — mensajes cronologicos con otro usuario. */
    @GetMapping("/{otroId}")
    public ApiResponse<List<MensajeResponse>> conversacion(@AuthenticationPrincipal Jwt jwt,
                                                           @PathVariable UUID otroId) {
        return ApiResponse.ok(mensajesService.conversacion(authId(jwt), otroId), "Mensajes cargados.");
    }

    /** POST /api/v1/mensajes/{otroId} — enviar mensaje. */
    @PostMapping("/{otroId}")
    public ApiResponse<MensajeResponse> enviar(@AuthenticationPrincipal Jwt jwt,
                                               @PathVariable UUID otroId,
                                               @Valid @RequestBody MensajeCrearRequest request) {
        return ApiResponse.ok(mensajesService.enviar(authId(jwt), otroId, request),
                "Mensaje enviado.");
    }

    /** POST /api/v1/mensajes/{otroId}/leidos — marcar como leida la conversacion ajena. */
    @PostMapping("/{otroId}/leidos")
    public ApiResponse<Long> marcarLeidos(@AuthenticationPrincipal Jwt jwt,
                                          @PathVariable UUID otroId) {
        return ApiResponse.ok(mensajesService.marcarLeidos(authId(jwt), otroId),
                "Mensajes marcados como leidos.");
    }
}
