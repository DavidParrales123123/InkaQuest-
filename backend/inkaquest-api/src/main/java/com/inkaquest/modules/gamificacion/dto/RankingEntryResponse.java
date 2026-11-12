package com.inkaquest.modules.gamificacion.dto;

import java.time.Instant;
import java.util.UUID;

/** Fila de la tabla de posiciones de una temporada. */
public record RankingEntryResponse(
        Integer posicion,
        UUID estudianteId,
        String nombre,
        String apellido,
        String avatarUrl,
        Integer puntos) {
}
