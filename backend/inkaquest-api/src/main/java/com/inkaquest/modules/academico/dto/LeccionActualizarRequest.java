package com.inkaquest.modules.academico.dto;

import com.inkaquest.shared.enums.TipoContenido;
import jakarta.validation.constraints.*;

/** Edicion parcial de leccion. */
public record LeccionActualizarRequest(
        @Size(min = 1, max = 200, message = "El titulo no puede superar 200 caracteres.")
        String titulo,

        @Size(max = 2000, message = "La descripcion no puede superar 2000 caracteres.")
        String descripcion,

        @Min(value = 1, message = "El numero de leccion debe ser >= 1.")
        Integer numero,

        TipoContenido tipoContenido,

        @Min(value = 0, message = "La duracion no puede ser negativa.")
        Integer duracionMinutos,

        @Min(value = 0, message = "El XP no puede ser negativo.")
        Integer xpOtorgado,

        Boolean requeridoAprobacion,

        Boolean publicado) {
}
