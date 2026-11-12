package com.inkaquest.modules.identidad.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

/**
 * DTO de entrada para actualizar el propio perfil.
 * Todos los campos son opcionales: se envia solo lo que cambia.
 */
public record PerfilActualizacionRequest(
        @Size(max = 120, message = "El nombre no puede superar 120 caracteres.") String nombre,
        @Size(max = 120, message = "El apellido no puede superar 120 caracteres.") String apellido,
        @Size(max = 20, message = "El documento no puede superar 20 caracteres.") String documento,
        @Size(max = 20, message = "El género no puede superar 20 caracteres.") String genero,
        @PastOrPresent(message = "Fecha de nacimiento no puede ser futura.") LocalDate fechaNacimiento,
        @Size(max = 40, message = "El teléfono no puede superar 40 caracteres.") String telefono,
        @Size(max = 500, message = "La biografía no puede superar 500 caracteres.") String bio,
        @Email(message = "El correo no tiene un formato válido.")
        @Size(max = 255, message = "El correo no puede superar 255 caracteres.") String email) {
}
