package com.inkaquest.modules.matriculas.dto;

import com.inkaquest.modules.academico.dto.CursoResponse;
import com.inkaquest.modules.matriculas.entity.Matricula;
import com.inkaquest.shared.enums.EstadoMatricula;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * DTO de salida para {@code GET /api/v1/matriculas/yo}.
 */
public record MatriculaResponse(
        UUID id,
        CursoResponse curso,
        EstadoMatricula estado,
        BigDecimal precioPagado,
        String moneda,
        BigDecimal porcentajeProgreso,
        Integer xpGanado,
        Instant matriculadoEn,
        Instant completadoEn,
        Instant creadoEn) {

    public static MatriculaResponse from(Matricula m) {
        return new MatriculaResponse(
                m.getId(),
                CursoResponse.from(m.getCursoId()),
                m.getEstado(),
                m.getPrecioPagado(),
                m.getMoneda(),
                m.getPorcentajeProgreso(),
                m.getXpGanado(),
                m.getMatriculadoEn(),
                m.getCompletadoEn(),
                m.getCreadoEn());
    }
}
