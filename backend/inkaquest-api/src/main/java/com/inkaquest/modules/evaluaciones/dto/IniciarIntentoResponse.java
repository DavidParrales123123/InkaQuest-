package com.inkaquest.modules.evaluaciones.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * DTO de respuesta al iniciar un intento de evaluación.
 * Contiene las preguntas y datos del intento.
 */
public record IniciarIntentoResponse(
        UUID intentoId,
        int numero,
        Instant tiempoInicio,
        Instant tiempoLimite,
        BigDecimal puntajeMaximo,
        List<PreguntaIntentoDto> preguntas
) {}
