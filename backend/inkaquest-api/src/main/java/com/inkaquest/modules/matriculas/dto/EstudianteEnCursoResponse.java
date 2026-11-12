package com.inkaquest.modules.matriculas.dto;

import com.inkaquest.modules.matriculas.entity.Matricula;
import com.inkaquest.shared.enums.EstadoMatricula;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/** Fila para el listado de alumnos de un curso (docente/admin). */
public record EstudianteEnCursoResponse(
        UUID matriculaId,
        UUID estudianteId,
        String nombre,
        String apellido,
        String email,
        EstadoMatricula estado,
        BigDecimal porcentajeProgreso,
        Integer xpGanado,
        Instant matriculadoEn,
        Instant completadoEn) {

    public static EstudianteEnCursoResponse from(Matricula m) {
        var estudiante = m.getEstudianteId();
        return new EstudianteEnCursoResponse(
                m.getId(),
                estudiante != null ? estudiante.getId() : null,
                estudiante != null ? estudiante.getNombre() : null,
                estudiante != null ? estudiante.getApellido() : null,
                estudiante != null ? estudiante.getEmail() : null,
                m.getEstado(),
                m.getPorcentajeProgreso(),
                m.getXpGanado(),
                m.getMatriculadoEn(),
                m.getCompletadoEn());
    }
}
