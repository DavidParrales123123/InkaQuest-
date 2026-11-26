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
        /** Porcentaje interno conservado por compatibilidad; la UI usa nota sobre 20. */
        BigDecimal porcentaje,
        /** Nota final en escala 0 a 20. */
        BigDecimal nota,
        boolean aprobado,
        Instant tiempoInicio,
        Instant tiempoFin,
        List<PreguntaResultadoDto> preguntas
) {}
