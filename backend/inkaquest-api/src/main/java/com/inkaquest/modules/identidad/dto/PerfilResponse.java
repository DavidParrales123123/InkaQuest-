package com.inkaquest.modules.identidad.dto;

import com.inkaquest.modules.identidad.entity.Perfil;
import com.inkaquest.shared.enums.EstadoCuenta;
import com.inkaquest.shared.enums.RolUsuario;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * DTO de salida para {@link Perfil}.
 *
 * <p>Contiene todos los campos visibles para el propietario de la sesion
 * (el frontend consume esta respuesta como su unico contrato). Todo lo
 * sensible (credenciales) queda fuera.</p>
 */
public record PerfilResponse(
        UUID id,
        String email,
        String nombre,
        String apellido,
        String documento,
        String genero,
        LocalDate fechaNacimiento,
        String telefono,
        String avatarUrl,
        String bio,
        RolUsuario rol,
        EstadoCuenta estadoCuenta,
        Integer xp,
        Integer nivel,
        Integer rachaDias,
        Instant ultimaConexion,
        Instant creadoEn,
        Instant actualizadoEn) {

    public static PerfilResponse from(Perfil perfil) {
        return new PerfilResponse(
                perfil.getId(),
                perfil.getEmail(),
                perfil.getNombre(),
                perfil.getApellido(),
                perfil.getDocumento(),
                perfil.getGenero(),
                perfil.getFechaNacimiento(),
                perfil.getTelefono(),
                perfil.getAvatarUrl(),
                perfil.getBio(),
                perfil.getRol(),
                perfil.getEstadoCuenta(),
                perfil.getXp(),
                perfil.getNivel(),
                perfil.getRachaDias(),
                perfil.getUltimaConexion(),
                perfil.getCreadoEn(),
                perfil.getActualizadoEn());
    }
}
