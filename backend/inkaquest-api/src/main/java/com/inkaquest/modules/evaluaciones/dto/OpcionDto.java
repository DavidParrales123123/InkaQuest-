package com.inkaquest.modules.evaluaciones.dto;

import java.util.UUID;

/**
 * DTO de una opción de respuesta (sin revelar si es correcta).
 */
public record OpcionDto(
        UUID id,
        String texto,
        int orden
) {}
