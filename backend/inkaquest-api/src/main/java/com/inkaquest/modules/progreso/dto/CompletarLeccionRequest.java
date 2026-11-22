package com.inkaquest.modules.progreso.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

/**
 * Datos opcionales al completar una leccion.
 *
 * <p>{@code minutosEstudiados} es el tiempo real que el estudiante estuvo en
 * la leccion, medido por el cliente. Se limita para evitar valores absurdos
 * (pagina abierta toda la noche) y se usa solo como estimacion de estudio.</p>
 */
public record CompletarLeccionRequest(
        @Min(1) @Max(480) Integer minutosEstudiados
) {
}
