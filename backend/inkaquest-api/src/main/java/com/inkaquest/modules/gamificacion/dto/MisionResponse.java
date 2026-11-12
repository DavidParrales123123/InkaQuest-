package com.inkaquest.modules.gamificacion.dto;

import com.inkaquest.shared.enums.EstadoMision;
import com.inkaquest.shared.enums.TipoMision;

import java.time.Instant;
import java.util.UUID;

/** Mision activa para el estudiante, junto a su progreso. */
public record MisionResponse(
        UUID id,
        String nombre,
        String descripcion,
        TipoMision tipo,
        String objetivoTipo,
        Integer objetivoCantidad,
        Integer xpRecompensa,
        Integer monedasRecompensa,
        UUID insigniaId,
        Instant fechaInicio,
        Instant fechaFin,
        Integer miProgreso,
        EstadoMision miEstado,
        boolean pendiente) {
}
