package com.inkaquest.modules.chatbot.dto;

import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;

/**
 * Crea/envía un mensaje al asistente IA. {@code contenido} puede ser texto,
 * texto + adjuntos, o solo adjuntos (ver validación manual en el servicio).
 */
public record EnviarMensajeRequest(UUID conversacionId,
                                   @Size(max = 12000) String contenido,
                                   List<AdjuntoRef> attachments) { }
