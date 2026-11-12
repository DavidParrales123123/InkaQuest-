package com.inkaquest.modules.academico.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

/**
 * Edicion parcial de curso. Todos los campos son opcionales; solo los no
 * nulos se aplican. Solo cursos en {@code borrador}/{@code en_revision} son
 * editables (verificado en el servicio).
 */
public record CursoActualizarRequest(
        @Size(min = 6, max = 200, message = "El titulo debe tener entre 6 y 200 caracteres.")
        String titulo,

        @Size(max = 2000, message = "La descripcion no puede superar 2000 caracteres.")
        String descripcion,

        @Size(max = 60000, message = "El contenido es demasiado largo.")
        String contenido,

        @Size(max = 1000, message = "La URL de portada es demasiado larga.")
        String portadaUrl,

        @Size(max = 500, message = "La categoria slug es demasiado larga.")
        String categoriaSlug,

        @DecimalMin(value = "0.0", message = "El precio no puede ser negativo.")
        @Digits(integer = 8, fraction = 2, message = "El precio tiene demasiados decimales.")
        BigDecimal precio,

        @Size(min = 3, max = 3, message = "La moneda debe ser un codigo ISO-4217 de 3 letras.")
        String moneda,

        @Min(value = 0, message = "El XP total no puede ser negativo.")
        Integer xpTotal,

        @Min(value = 0, message = "La duracion no puede ser negativa.")
        Integer duracionMinutos) {
}
