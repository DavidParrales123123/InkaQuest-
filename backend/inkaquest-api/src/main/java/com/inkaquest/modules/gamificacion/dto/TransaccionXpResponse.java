package com.inkaquest.modules.gamificacion.dto;

import com.inkaquest.shared.enums.ConceptoXp;

import java.time.Instant;
import java.util.UUID;

/** Transaccion del historial de XP del estudiante. */
public record TransaccionXpResponse(
        UUID id,
        Integer xp,
        ConceptoXp concepto,
        String referenciaTipo,
        UUID referenciaId,
        String descripcion,
        Instant creadoEn) {
}
