package com.inkaquest.modules.evaluaciones.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * DTO de respuesta para listado de entregas.
 */
public record EntregaResponse(
        UUID id,
        UUID tareaId,
        UUID estudianteId,
        String estado,
        String contenido,
        BigDecimal nota,
        Instant enviadaEn,
        Instant revisadaEn
) {}
