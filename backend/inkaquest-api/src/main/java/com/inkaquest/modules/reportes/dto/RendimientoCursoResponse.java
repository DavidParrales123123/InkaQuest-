package com.inkaquest.modules.reportes.dto;

import java.math.BigDecimal;
import java.util.UUID;

/** Rendimiento de un curso para el docente que lo imparte. */
public record RendimientoCursoResponse(
        UUID cursoId,
        String titulo,
        String slug,
        long estudiantesActivos,
        long estudiantesCompletados,
        long estudiantesTotales,
        BigDecimal progresoPromedio) {
}
