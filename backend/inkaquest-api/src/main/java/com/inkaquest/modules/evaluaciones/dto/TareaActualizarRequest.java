package com.inkaquest.modules.evaluaciones.dto;

import jakarta.validation.constraints.Min;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Request para actualizar una tarea existente.
 * Todos los campos son opcionales (solo se actualizan los no nulos).
 */
public record TareaActualizarRequest(
        Instant fechaApertura,
        Instant fechaEntrega,
        Boolean permiteEntregaTardia,
        @Min(value = 0, message = "La penalización no puede ser negativa") Integer penalizacionTardia,
        BigDecimal notaMaxima
) {}
