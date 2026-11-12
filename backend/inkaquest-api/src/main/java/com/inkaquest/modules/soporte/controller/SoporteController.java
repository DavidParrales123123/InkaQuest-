package com.inkaquest.modules.soporte.controller;

import com.inkaquest.modules.soporte.dto.TicketCrearRequest;
import com.inkaquest.modules.soporte.service.SoporteService;
import com.inkaquest.shared.response.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.validation.annotation.Validated;

import java.util.List;
import java.util.UUID;

/**
 * Endpoints de soporte y tickets.
 */
@RestController
@RequestMapping("/api/v1/soporte")
@Validated
public class SoporteController {

    private final SoporteService soporteService;

    public SoporteController(SoporteService soporteService) {
        this.soporteService = soporteService;
    }

    private static UUID authId(Jwt jwt) {
        try {
            return UUID.fromString(jwt.getClaimAsString("sub"));
        } catch (IllegalArgumentException e) {
            throw new org.springframework.security.authentication.BadCredentialsException(
                    "El token no incluye un sub valido.");
        }
    }

    /** POST /api/v1/soporte/tickets — crear ticket. */
    @PostMapping("/tickets")
    public ApiResponse<TicketCrearRequest.TicketResponse> crear(@AuthenticationPrincipal Jwt jwt,
                                                                @Valid @RequestBody TicketCrearRequest request) {
        return ApiResponse.ok(soporteService.crear(authId(jwt), request), "Ticket registrado.");
    }

    /** GET /api/v1/soporte/tickets/yo — mis tickets. */
    @GetMapping("/tickets/yo")
    public ApiResponse<List<TicketCrearRequest.TicketResponse>> misTickets(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.ok(soporteService.misTickets(authId(jwt)), "Tickets cargados.");
    }

    /** GET /api/v1/soporte/tickets/{id} — detalle (autor o admin). */
    @GetMapping("/tickets/{id}")
    public ApiResponse<TicketCrearRequest.TicketResponse> detalle(@AuthenticationPrincipal Jwt jwt,
                                                                  @PathVariable UUID id) {
        return ApiResponse.ok(soporteService.detalle(authId(jwt), id), "Ticket cargado.");
    }

    /** POST /api/v1/soporte/tickets/{id}/mensajes — responder. */
    @PostMapping("/tickets/{id}/mensajes")
    public ApiResponse<TicketCrearRequest.RespuestaResponse> responder(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id,
            @Valid @RequestBody TicketCrearRequest.MensajeTicketRequest request) {
        return ApiResponse.ok(soporteService.responder(authId(jwt), id, request),
                "Mensaje registrado.");
    }

    /** POST /api/v1/soporte/tickets/{id}/cerrar — cerrar ticket. */
    @PostMapping("/tickets/{id}/cerrar")
    public ApiResponse<TicketCrearRequest.TicketResponse> cerrar(@AuthenticationPrincipal Jwt jwt,
                                                                 @PathVariable UUID id) {
        return ApiResponse.ok(soporteService.cerrar(authId(jwt), id), "Ticket cerrado.");
    }
}
