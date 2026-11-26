package com.inkaquest.modules.comercio.dto;

import jakarta.validation.constraints.Size;

/** Pago de un pedido ya creado, con token 3DS o tarjeta guardada. */
public record PagarPedidoRequest(
        @Size(max = 100, message = "El token Culqi es inválido.") String culqiToken,
        java.util.UUID metodoPagoId
) {}
