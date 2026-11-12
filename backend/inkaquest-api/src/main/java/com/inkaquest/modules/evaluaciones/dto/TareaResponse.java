package com.inkaquest.modules.evaluaciones.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * DTO de respuesta para listado de tareas.
 */
public record TareaResponse(
        UUID id,
        UUID actividadId,
        String titulo,
        String descripcion,
        Instant fechaEntrega,
        boolean permiteEntregaTardia,
        BigDecimal notaMaxima,
        boolean tieneEntrega,
        String estadoEntrega
) {}
