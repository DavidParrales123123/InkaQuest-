package com.inkaquest.modules.evaluaciones.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * DTO de solicitud para entregar una tarea.
 */
public record EntregarRequest(
        @NotBlank(message = "El contenido de la entrega es obligatorio")
        String contenido
) {}
