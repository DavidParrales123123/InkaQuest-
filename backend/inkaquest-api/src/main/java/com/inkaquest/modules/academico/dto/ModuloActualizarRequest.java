package com.inkaquest.modules.academico.dto;

import jakarta.validation.constraints.*;

/** Edicion parcial de modulo. */
public record ModuloActualizarRequest(
        @Size(min = 1, max = 200, message = "El titulo no puede superar 200 caracteres.")
        String titulo,

        @Size(max = 2000, message = "La descripcion no puede superar 2000 caracteres.")
        String descripcion,

        @Min(value = 1, message = "El numero de modulo debe ser >= 1.")
        Integer numero,

        @Min(value = 0, message = "El XP no puede ser negativo.")
        Integer xpOtorgado,

        Boolean publicado) {
}
