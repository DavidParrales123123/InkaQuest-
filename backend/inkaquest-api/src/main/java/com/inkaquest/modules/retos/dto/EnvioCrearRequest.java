package com.inkaquest.modules.retos.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

/** Envio de solucion (seccion reto). El codigo se verifica despues; hoy se registra pendiente. */
public record EnvioCrearRequest(
        @NotBlank(message = "El codigo es obligatorio.")
        @Size(max = 60000, message = "El codigo es demasiado largo.")
        String codigo,

        @NotNull(message = "El lenguaje es obligatorio.")
        UUID lenguajeId,

        @Size(max = 200, message = "La clave de idempotencia es demasiado larga.")
        String claveIdempotencia) {
}
