package com.inkaquest.modules.comercio.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Token emitido por Culqi.js tras tokenizar (y autenticar 3DS) la tarjeta. */
public record GuardarTarjetaRequest(
        @NotBlank(message = "El token de Culqi es obligatorio")
        @Size(max = 100, message = "El token de Culqi es inválido")
        String tokenId
) {}
