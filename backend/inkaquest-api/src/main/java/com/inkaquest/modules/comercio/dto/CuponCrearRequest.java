package com.inkaquest.modules.comercio.dto;

import com.inkaquest.modules.comercio.entity.Cupon;
import com.inkaquest.shared.enums.TipoDescuento;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/** Alta o edicion de cupon (admin). */
public record CuponCrearRequest(
        @NotBlank(message = "El codigo del cupon es obligatorio.")
        @Size(min = 2, max = 50)
        @Pattern(regexp = "^[A-Za-z0-9_-]+$", message = "El codigo solo admite letras, numeros, guion y guion bajo.")
        String codigo,

        @Size(max = 200)
        String descripcion,

        @NotNull(message = "El tipo de descuento es obligatorio.")
        TipoDescuento tipo,

        @NotNull(message = "El valor es obligatorio.")
        @DecimalMin(value = "0.0", message = "El valor no puede ser negativo.")
        BigDecimal valor,

        @Min(value = 0, message = "Los usos maximos no pueden ser negativos (usa 0 para ilimitado).")
        Integer usosMaximos,

        @Min(value = 0, message = "El limite por usuario no puede ser negativo (usa 0 para ilimitado).")
        Integer limitePorUsuario,

        @FutureOrPresent(message = "El cupon no puede nacer ya vencido.")
        Instant validoDesde,

        @Future(message = "La fecha de expiracion debe estar en el futuro.")
        Instant validoHasta) {

    public record CuponResponse(
            UUID id, String codigo, String descripcion, TipoDescuento tipo,
            BigDecimal valor, Integer usosMaximos, Integer usosActuales,
            Integer limitePorUsuario, Instant validoDesde, Instant validoHasta,
            Boolean activo, Instant creadoEn) {

        public static CuponResponse from(Cupon c) {
            return new CuponResponse(c.getId(), c.getCodigo(), c.getDescripcion(),
                    c.getTipo(), c.getValor(), c.getUsosMaximos(), c.getUsosActuales(),
                    c.getLimitePorUsuario(), c.getValidoDesde(), c.getValidoHasta(),
                    c.getActivo(), c.getCreadoEn());
        }
    }
}
