package com.inkaquest.modules.gamificacion.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/** Insignia del catalogo con el estado del estudiante. */
public record InsigniaCatalogoResponse(
        UUID id,
        String codigo,
        String nombre,
        String descripcion,
        String icono,
        String rareza,
        Integer xpOtorgado,
        BigDecimal progreso,
        Instant obtenidaEn,
        boolean obtenida) {
}
