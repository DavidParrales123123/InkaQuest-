package com.inkaquest.modules.progreso.dto;

import java.math.BigDecimal;
import java.util.UUID;

/** Resultado de marcar una leccion como completada (seccion 16). */
public record LeccionCompletadaResponse(
        UUID leccionId,
        Integer xpOtorgado,
        Integer leccionesCompletadas,
        Integer totalLeccionesPublicadas,
        BigDecimal porcentajeCurso,
        boolean cursoCompletado) {
}
