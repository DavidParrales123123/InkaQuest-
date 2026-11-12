package com.inkaquest.modules.academico.dto;

import com.inkaquest.shared.enums.TipoContenido;
import jakarta.validation.constraints.*;

/** Alta de leccion dentro de un modulo (seccion 14). */
public record LeccionCrearRequest(
        @NotBlank(message = "El titulo de la leccion es obligatorio.")
        @Size(max = 200, message = "El titulo no puede superar 200 caracteres.")
        String titulo,

        @Size(max = 2000, message = "La descripcion no puede superar 2000 caracteres.")
        String descripcion,

        @NotNull(message = "El tipo de contenido es obligatorio.")
        TipoContenido tipoContenido,

        @Min(value = 0, message = "La duracion no puede ser negativa.")
        Integer duracionMinutos,

        @Min(value = 0, message = "El XP no puede ser negativo.")
        Integer xpOtorgado,

        Boolean requeridoAprobacion,

        Boolean publicado) {
}
