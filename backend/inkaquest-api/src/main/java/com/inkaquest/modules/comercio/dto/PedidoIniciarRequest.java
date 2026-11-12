package com.inkaquest.modules.comercio.dto;

import jakarta.validation.constraints.Size;

/**
 * Inicio de compra de un curso (estudiante autenticado).
 * El precio SIEMPRE se calcula en el backend; Angular no puede influirlo.
 */
public record PedidoIniciarRequest(
        @Size(max = 200) String cursoSlug,
        @Size(max = 50) String cuponCodigo,
        @Size(max = 200) String claveIdempotencia,
        @Size(max = 100, message = "El token Culqi es invalido.") String culqiToken) {
}
