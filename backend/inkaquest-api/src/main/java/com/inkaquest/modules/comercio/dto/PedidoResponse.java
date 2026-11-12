package com.inkaquest.modules.comercio.dto;

import com.inkaquest.shared.enums.EstadoPedido;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Pedido retornado al comprador. */
public record PedidoResponse(
        UUID id,
        String numero,
        EstadoPedido estado,
        String cursoSlug,
        String cursoTitulo,
        BigDecimal subtotal,
        BigDecimal descuento,
        BigDecimal total,
        String moneda,
        String transaccionEstado,
        boolean proveedorConfigurado,
        List<DetalleLinea> detalle,
        Instant creadoEn) {

    public record DetalleLinea(
            UUID cursoId,
            String tituloSnapshot,
            BigDecimal precioUnitario,
            Integer cantidad,
            BigDecimal subtotal) {
    }
}
