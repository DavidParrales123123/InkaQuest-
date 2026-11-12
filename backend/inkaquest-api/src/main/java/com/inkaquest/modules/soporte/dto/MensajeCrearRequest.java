package com.inkaquest.modules.soporte.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Envio de un mensaje a otro usuario. */
public record MensajeCrearRequest(
        @NotBlank(message = "El cuerpo del mensaje es obligatorio.")
        @Size(max = 4000, message = "El mensaje no puede superar 4000 caracteres.")
        String cuerpo) {
}
