package com.inkaquest.modules.evaluaciones.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * DTO de respuesta con el resultado del intento.
 */
public record ResultadoIntentoResponse(
        UUID intentoId,
        String estado,
        BigDecimal puntaje,
        BigDecimal puntajeMaximo,
        BigDecimal porcentaje,
        boolean aprobado,
        Instant tiempoInicio,
        Instant tiempoFin,
        List<PreguntaResultadoDto> preguntas
) {}
