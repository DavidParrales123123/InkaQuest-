package com.inkaquest.modules.evaluaciones.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * DTO de una pregunta dentro de un intento de evaluación.
 */
public record PreguntaIntentoDto(
        UUID id,
        int orden,
        String tipo,
        String enunciado,
        String descripcion,
        BigDecimal puntos,
        List<OpcionDto> opciones
) {}
