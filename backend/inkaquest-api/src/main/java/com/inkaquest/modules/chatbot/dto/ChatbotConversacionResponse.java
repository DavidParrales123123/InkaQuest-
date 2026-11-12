package com.inkaquest.modules.chatbot.dto;

import com.inkaquest.modules.chatbot.entity.ChatbotConversacion;
import java.time.Instant;
import java.util.UUID;

/** Vista segura de una conversacion del usuario autenticado. */
public record ChatbotConversacionResponse(
        UUID id,
        String titulo,
        Instant creado_en,
        Instant actualizado_en) {
    public static ChatbotConversacionResponse from(ChatbotConversacion c) {
        return new ChatbotConversacionResponse(c.getId(), c.getTitulo(), c.getCreadoEn(), c.getActualizadoEn());
    }
}
