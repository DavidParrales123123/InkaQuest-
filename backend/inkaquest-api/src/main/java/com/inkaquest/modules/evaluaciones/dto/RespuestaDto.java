package com.inkaquest.modules.evaluaciones.dto;

import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

/**
 * DTO de una respuesta a una pregunta.
 */
public record RespuestaDto(
        @NotNull(message = "El ID de pregunta es obligatorio")
        UUID preguntaId,
        
        List<UUID> opcionesSeleccionadas,
        String respuestaTexto
) {}
