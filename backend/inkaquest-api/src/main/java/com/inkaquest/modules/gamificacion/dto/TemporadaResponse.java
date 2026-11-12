package com.inkaquest.modules.gamificacion.dto;

import com.inkaquest.shared.enums.EstadoTemporada;

import java.time.LocalDate;
import java.util.UUID;

/** Temporada (ranking estacional). */
public record TemporadaResponse(
        UUID id,
        String nombre,
        String descripcion,
        EstadoTemporada estado,
        LocalDate fechaInicio,
        LocalDate fechaFin) {
}
