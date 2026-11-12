package com.inkaquest.modules.evaluaciones.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

/**
 * DTO de solicitud para enviar respuestas de un intento.
 */
public record ResponderIntentoRequest(
        @NotEmpty(message = "Debe proporcionar al menos una respuesta")
        List<RespuestaDto> respuestas
) {}
