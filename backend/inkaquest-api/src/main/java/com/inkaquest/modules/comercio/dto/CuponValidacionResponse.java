package com.inkaquest.modules.comercio.dto;

import com.inkaquest.modules.comercio.entity.Cupon;
import com.inkaquest.shared.enums.TipoDescuento;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/** Cupon visto por el comprador (validacion de compra). */
public record CuponValidacionResponse(
        boolean valido,
        String motivo,
        String tipo,
        BigDecimal valor,
        BigDecimal descuento,
        BigDecimal totalFinal,
        String codigo) {

    public static CuponValidacionResponse invalido(String motivo, String codigo) {
        return new CuponValidacionResponse(false, motivo, null, null, null, null, codigo);
    }

    public static CuponValidacionResponse valido(Cupon c, BigDecimal descuento, BigDecimal totalFinal) {
        return new CuponValidacionResponse(true, null, c.getTipo().getValor(),
                c.getValor(), descuento, totalFinal, c.getCodigo());
    }
}
