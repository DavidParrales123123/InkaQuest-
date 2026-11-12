package com.inkaquest.modules.chatbot.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record EnviarMensajeRequest(UUID conversacionId,
                                   @NotBlank @Size(max = 12000) String contenido) { }
