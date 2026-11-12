package com.inkaquest.modules.identidad.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO para revisar (aprobar o rechazar) una solicitud de docente.
 */
public record SolicitudDocenteRevisionRequest(
        @NotBlank(message = "El motivo de revisión es obligatorio.")
        @Size(min = 10, max = 2000, message = "El motivo de revisión debe tener entre 10 y 2000 caracteres.")
        String motivoRevision) {
}
