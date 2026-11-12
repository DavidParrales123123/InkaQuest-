package com.inkaquest.modules.chatbot.controller;

import com.inkaquest.modules.chatbot.dto.*;
import com.inkaquest.modules.chatbot.service.ChatbotService;
import com.inkaquest.shared.response.ApiResponse;
import java.util.List;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

/** API del chatbot. El identificador del usuario procede exclusivamente del JWT verificado. */
@RestController
@RequestMapping("/api/v1/chatbot")
@Validated
public class ChatbotController {
    private final ChatbotService service;

    public ChatbotController(ChatbotService service) { this.service = service; }

    @GetMapping("/conversaciones")
    public ApiResponse<List<ChatbotConversacionResponse>> listar(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.ok(service.listar(usuarioId(jwt)), "Conversaciones cargadas.");
    }

    @GetMapping("/conversaciones/{id}/mensajes")
    public ApiResponse<List<ChatbotMensajeResponse>> mensajes(@AuthenticationPrincipal Jwt jwt,
                                                               @PathVariable UUID id) {
        return ApiResponse.ok(service.listarMensajes(usuarioId(jwt), id), "Mensajes cargados.");
    }

    @PostMapping("/conversaciones")
    public ApiResponse<ChatbotConversacionResponse> crear(@AuthenticationPrincipal Jwt jwt,
                                                           @Valid @RequestBody CrearConversacionRequest request) {
        return ApiResponse.ok(service.crear(usuarioId(jwt), request), "Conversacion creada.");
    }

    @PostMapping("/mensajes")
    public ApiResponse<EnviarMensajeResponse> enviar(@AuthenticationPrincipal Jwt jwt,
                                                     @Valid @RequestBody EnviarMensajeRequest request) {
        return ApiResponse.ok(service.enviar(usuarioId(jwt), request), "Mensaje procesado.");
    }

    private UUID usuarioId(Jwt jwt) {
        if (jwt == null || jwt.getSubject() == null) {
            throw new org.springframework.security.authentication.BadCredentialsException("Autenticacion requerida.");
        }
        try { return UUID.fromString(jwt.getSubject()); }
        catch (IllegalArgumentException ex) {
            throw new org.springframework.security.authentication.BadCredentialsException("Token de usuario invalido.");
        }
    }
}
