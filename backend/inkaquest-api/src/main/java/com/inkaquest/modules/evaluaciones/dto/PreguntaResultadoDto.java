package com.inkaquest.modules.evaluaciones.dto;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * DTO de resultado de una pregunta (con respuesta correcta e incorrecta).
 */
public record PreguntaResultadoDto(
        UUID id,
        String enunciado,
        String tipo,
        BigDecimal puntos,
        BigDecimal puntosObtenidos,
        boolean correcta,
        String respuestaEstudiante,
        String respuestaCorrecta,
        String retroalimentacion
) {}
