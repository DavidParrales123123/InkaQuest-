package com.inkaquest.modules;

import com.inkaquest.modules.comercio.service.DescuentoCalculator;
import com.inkaquest.shared.enums.TipoDescuento;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Pruebas unitarias puras de la logica de descuentos (reglas de negocio
 * criticas de cupones). No tocan base de datos.
 */
class DescuentoCalculatorTest {

    @Test
    @DisplayName("Descuento porcentaje: 20% de 100.00 = 20.00")
    void porcentajeBasico() {
        BigDecimal d = DescuentoCalculator.calcular(TipoDescuento.porcentaje, BigDecimal.valueOf(20), new BigDecimal("100.00"));
        assertThat(d).isEqualByComparingTo("20.00");
    }

    @Test
    @DisplayName("Descuento porcentaje redondea con HALF_UP a 2 decimales")
    void porcentajeRedondeo() {
        BigDecimal d = DescuentoCalculator.calcular(TipoDescuento.porcentaje, new BigDecimal("12.5"), new BigDecimal("33.33"));
        assertThat(d).isEqualByComparingTo("4.17");
    }

    @Test
    @DisplayName("Monto fijo nunca supera el subtotal")
    void montoFijoLimitado() {
        BigDecimal d = DescuentoCalculator.calcular(TipoDescuento.monto_fijo, new BigDecimal("500"), new BigDecimal("100.00"));
        assertThat(d).isEqualByComparingTo("100.00");
    }

    @Test
    @DisplayName("Monto fijo normal")
    void montoFijo() {
        BigDecimal d = DescuentoCalculator.calcular(TipoDescuento.monto_fijo, new BigDecimal("25.00"), new BigDecimal("100.00"));
        assertThat(d).isEqualByComparingTo("25.00");
    }

    @Test
    @DisplayName("Total final nunca es negativo")
    void totalNuncaNegativo() {
        BigDecimal total = DescuentoCalculator.totalFinal(new BigDecimal("100.00"), new BigDecimal("999.99"));
        assertThat(total).isEqualByComparingTo("0.00");
    }

    @Test
    @DisplayName("Porcentaje mayor a 100 es rechazado")
    void porcentajeFueraDeRango() {
        assertThatThrownBy(() -> DescuentoCalculator.calcular(TipoDescuento.porcentaje, new BigDecimal("150"), new BigDecimal("100")))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("Subtotal negativo rechazado")
    void subtotalNegativo() {
        assertThatThrownBy(() -> DescuentoCalculator.calcular(TipoDescuento.porcentaje, BigDecimal.ONE, new BigDecimal("-1")))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
