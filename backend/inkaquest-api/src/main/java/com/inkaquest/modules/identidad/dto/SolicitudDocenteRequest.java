package com.inkaquest.modules.identidad.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.Map;

/**
 * DTO para crear una solicitud de docente.
 */
public record SolicitudDocenteRequest(
        @NotBlank(message = "La institución es obligatoria.")
        @Size(max = 200, message = "La institución no puede superar 200 caracteres.") String institucion,

        @Size(max = 200, message = "La especialidad no puede superar 200 caracteres.") String especialidad,

        @Size(max = 60, message = "El código docente no puede superar 60 caracteres.") String codigoDocente,

        @NotBlank(message = "El motivo es obligatorio.")
        @Size(min = 20, max = 2000, message = "El motivo debe tener entre 20 y 2000 caracteres.") String motivo,

        Map<String, Object> documentosAdjuntos) {
}
