package com.inkaquest.modules.evaluaciones.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * DTO de respuesta detallada de una tarea.
 */
public record TareaDetalleResponse(
        UUID id,
        UUID actividadId,
        String titulo,
        String descripcion,
        String instrucciones,
        Instant fechaApertura,
        Instant fechaEntrega,
        boolean permiteEntregaTardia,
        int penalizacionTardia,
        BigDecimal notaMaxima,
        List<String> archivosAdjuntos,
        EntregaDetalleResponse miEntrega
) {}
