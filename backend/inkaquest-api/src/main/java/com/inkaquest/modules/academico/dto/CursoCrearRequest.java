package com.inkaquest.modules.academico.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

/**
 * Alta de curso a partir de seccion 13. El estado inicial siempre es
 * {@code borrador}; nunca se acepta un estado desde el cliente.
 */
public record CursoCrearRequest(
        @NotBlank(message = "El titulo es obligatorio.")
        @Size(min = 6, max = 200, message = "El titulo debe tener entre 6 y 200 caracteres.")
        String titulo,

        @NotBlank(message = "El slug es obligatorio.")
        @Pattern(regexp = "^[a-z0-9]+(-[a-z0-9]+)*$",
                message = "El slug solo admite minusculas, numeros y guiones.")
        @Size(min = 3, max = 120, message = "El slug debe tener entre 3 y 120 caracteres.")
        String slug,

        @Size(max = 2000, message = "La descripcion no puede superar 2000 caracteres.")
        String descripcion,

        @Size(max = 60000, message = "El contenido es demasiado largo.")
        String contenido,

        @Size(max = 1000, message = "La URL de portada es demasiado larga.")
        String portadaUrl,

        @Size(max = 500, message = "La categoria slug es demasiado larga.")
        String categoriaSlug,

        @NotNull(message = "El precio es obligatorio (usa 0 para gratuito).")
        @DecimalMin(value = "0.0", message = "El precio no puede ser negativo.")
        @Digits(integer = 8, fraction = 2, message = "El precio tiene demasiados decimales.")
        BigDecimal precio,

        @NotBlank(message = "La moneda es obligatoria.")
        @Size(min = 3, max = 3, message = "La moneda debe ser un codigo ISO-4217 de 3 letras.")
        String moneda,

        @NotNull(message = "El XP total es obligatorio.")
        @Min(value = 0, message = "El XP total no puede ser negativo.")
        Integer xpTotal,

        @NotNull(message = "La duracion total es obligatoria (min).")
        @Min(value = 0, message = "La duracion no puede ser negativa.")
        Integer duracionMinutos) {
}
