package com.inkaquest.modules.matriculas.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO de entrada para inscribirse en un curso. Sólo identifica el curso; el precio se deriva del lado servidor.
 */
public record MatriculaRequest(
        @NotBlank(message = "El slug del curso es obligatorio.")
        @Size(max = 200, message = "El slug no puede superar 200 caracteres.") String cursoSlug) {
}
