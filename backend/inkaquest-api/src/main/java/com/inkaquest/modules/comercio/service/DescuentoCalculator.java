package com.inkaquest.modules.comercio.service;

import com.inkaquest.modules.comercio.entity.Cupon;
import com.inkaquest.shared.enums.TipoDescuento;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Calculo del descuento aplicado por un cupon. Funcion pura: sin acceso a base de datos.
 */
public final class DescuentoCalculator {

    private DescuentoCalculator() {
    }

    /**
     * Descuento aplicable sobre un subtotal, siempre >= 0 y <= subtotal.
     *
     * @param tipo    porcentaje | monto_fijo | envio_gratis (sin coste de envio en el esquema: 0)
     * @param valor   valor del cupon (p. ej. 20 para 20% o 20.00 para monto fijo)
     * @param subtotal precio antes de descuento
     */
    public static BigDecimal calcular(TipoDescuento tipo, BigDecimal valor, BigDecimal subtotal) {
        if (subtotal == null || subtotal.signum() < 0) {
            throw new IllegalArgumentException("El subtotal no puede ser negativo.");
        }
        if (valor == null) {
            throw new IllegalArgumentException("El valor del cupon es obligatorio.");
        }
        return switch (tipo) {
            case porcentaje -> {
                if (valor.signum() < 0 || valor.compareTo(BigDecimal.valueOf(100)) > 0) {
                    throw new IllegalArgumentException("El porcentaje debe estar entre 0 y 100.");
                }
                yield subtotal.multiply(valor)
                        .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            }
            case monto_fijo -> valor.min(subtotal).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
            case envio_gratis -> BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        };
    }

    /** Total a pagar tras descuento (nunca negativo). */
    public static BigDecimal totalFinal(BigDecimal subtotal, BigDecimal descuento) {
        return subtotal.subtract(descuento).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
    }
}
