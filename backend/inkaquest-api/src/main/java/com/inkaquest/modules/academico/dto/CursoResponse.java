package com.inkaquest.modules.academico.dto;

import com.inkaquest.modules.academico.entity.Curso;
import com.inkaquest.shared.enums.EstadoCurso;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * DTO público de curso. No expone nada del docente ni datos privados.
 */
public record CursoResponse(
        UUID id,
        String titulo,
        String slug,
        String descripcion,
        String portadaUrl,
        EstadoCurso estado,
        BigDecimal precio,
        String moneda,
        Integer xpTotal,
        Integer duracionMinutos,
        Instant publicadoEn) {

    public static CursoResponse from(Curso curso) {
        return new CursoResponse(
                curso.getId(),
                curso.getTitulo(),
                curso.getSlug(),
                curso.getDescripcion(),
                curso.getPortadaUrl(),
                curso.getEstado(),
                curso.getPrecio(),
                curso.getMoneda(),
                curso.getXpTotal(),
                curso.getDuracionMinutos(),
                curso.getPublicadoEn());
    }
}
