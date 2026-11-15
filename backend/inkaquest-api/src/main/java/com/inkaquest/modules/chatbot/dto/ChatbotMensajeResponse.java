package com.inkaquest.modules.chatbot.dto;

import com.inkaquest.modules.chatbot.entity.ChatbotMensaje;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/** Mensaje sin exponer metadatos internos ni informacion de otros usuarios. */
public record ChatbotMensajeResponse(UUID id, String rol, String contenido, Instant creado_en, Map<String, Object> datos) {
    public static ChatbotMensajeResponse from(ChatbotMensaje m) {
        return new ChatbotMensajeResponse(
                m.getId(), m.getRol().getValor(), m.getContenido(), m.getCreadoEn(),
                m.getDatos() == null ? Map.of() : m.getDatos());
    }
}
