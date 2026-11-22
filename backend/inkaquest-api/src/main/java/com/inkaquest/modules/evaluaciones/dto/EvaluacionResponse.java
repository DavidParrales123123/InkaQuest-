package com.inkaquest.modules.evaluaciones.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * DTO de respuesta para listado de evaluaciones/cuestionarios.
 */
public record EvaluacionResponse(
        UUID id,
        UUID actividadId,
        String titulo,
        String descripcion,
        BigDecimal notaMaxima,
        Integer intentosPermitidos,
        Integer duracionMinutos,
        Instant fechaInicio,
        Instant fechaLimiteAcceso,
        boolean aleatorizarPreguntas,
        boolean mostrarResultadoInmediato,
        int totalPreguntas,
        Integer misIntentos
) {}
