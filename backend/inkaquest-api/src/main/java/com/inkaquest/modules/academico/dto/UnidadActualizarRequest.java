package com.inkaquest.modules.academico.dto;

import jakarta.validation.constraints.*;

/** Edicion parcial de unidad (todos los campos opcionales). */
public record UnidadActualizarRequest(
        @Size(min = 1, max = 200, message = "El titulo no puede superar 200 caracteres.")
        String titulo,

        @Size(max = 2000, message = "La descripcion no puede superar 2000 caracteres.")
        String descripcion,

        @Min(value = 1, message = "El numero de unidad debe ser >= 1.")
        Integer numero,

        @Min(value = 0, message = "El XP no puede ser negativo.")
        Integer xpOtorgado,

        Boolean publicado) {
}
