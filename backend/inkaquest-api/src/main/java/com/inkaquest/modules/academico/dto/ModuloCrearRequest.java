package com.inkaquest.modules.academico.dto;

import jakarta.validation.constraints.*;

/** Alta de modulo dentro de una unidad (seccion 14). */
public record ModuloCrearRequest(
        @NotBlank(message = "El titulo del modulo es obligatorio.")
        @Size(max = 200, message = "El titulo no puede superar 200 caracteres.")
        String titulo,

        @Size(max = 2000, message = "La descripcion no puede superar 2000 caracteres.")
        String descripcion,

        @Min(value = 0, message = "El XP no puede ser negativo.")
        Integer xpOtorgado,

        Boolean publicado) {
}
