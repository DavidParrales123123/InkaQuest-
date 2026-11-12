package com.inkaquest.modules.evaluaciones.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * DTO de respuesta detallada de una entrega.
 */
public record EntregaDetalleResponse(
        UUID id,
        UUID tareaId,
        String estado,
        String contenido,
        List<String> archivos,
        BigDecimal nota,
        String comentarioDocente,
        Instant enviadaEn,
        Instant revisadaEn
) {}
