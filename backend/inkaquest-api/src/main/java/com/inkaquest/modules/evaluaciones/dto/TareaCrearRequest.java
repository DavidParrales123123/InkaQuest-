package com.inkaquest.modules.evaluaciones.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * DTO de solicitud para crear una tarea.
 */
public record TareaCrearRequest(
        @NotNull(message = "El ID de actividad es obligatorio")
        UUID actividadId,
        
        Instant fechaApertura,
        
        Instant fechaEntrega,
        
        boolean permiteEntregaTardia,
        
        @Min(value = 0, message = "La penalización debe ser mayor o igual a 0")
        Integer penalizacionTardia,
        
        @NotNull(message = "La nota máxima es obligatoria")
        @Min(value = 0, message = "La nota máxima debe ser mayor a 0")
        BigDecimal notaMaxima
) {}
