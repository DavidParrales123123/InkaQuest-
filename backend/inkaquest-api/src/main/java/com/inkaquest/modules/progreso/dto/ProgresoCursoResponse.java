package com.inkaquest.modules.progreso.dto;

import com.inkaquest.modules.progreso.entity.ProgresoCurso;
import com.inkaquest.shared.enums.EstadoProgreso;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * DTO de progreso de un curso para el estudiante autenticado.
 */
public record ProgresoCursoResponse(
        UUID cursoId,
        String cursoTitulo,
        String cursoSlug,
        EstadoProgreso estado,
        BigDecimal porcentaje,
        Integer leccionesCompletadas,
        Integer minutosEstudio,
        Instant ultimaActividadEn) {

    public static ProgresoCursoResponse from(ProgresoCurso p) {
        return new ProgresoCursoResponse(
                p.getCursoId().getId(),
                p.getCursoId().getTitulo(),
                p.getCursoId().getSlug(),
                p.getEstado(),
                p.getPorcentaje(),
                p.getLeccionesCompletadas(),
                p.getMinutosEstudio(),
                p.getUltimaActividadEn());
    }
}
