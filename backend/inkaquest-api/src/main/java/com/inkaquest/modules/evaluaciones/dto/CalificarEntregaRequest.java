package com.inkaquest.modules.evaluaciones.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

/**
 * DTO de solicitud para calificar una entrega.
 */
public record CalificarEntregaRequest(
        @NotNull(message = "La nota es obligatoria")
        @Min(value = 0, message = "La nota debe ser mayor o igual a 0")
        BigDecimal nota,
        
        String comentario
) {}
