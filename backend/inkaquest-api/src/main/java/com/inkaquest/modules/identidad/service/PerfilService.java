package com.inkaquest.modules.identidad.service;

import com.inkaquest.modules.identidad.dto.PerfilResponse;
import com.inkaquest.modules.identidad.dto.PerfilActualizacionRequest;
import com.inkaquest.modules.identidad.entity.Perfil;
import com.inkaquest.modules.identidad.repository.PerfilRepository;
import com.inkaquest.shared.exception.ResourceNotFoundException;
import com.inkaquest.shared.security.RlsExecutor;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Servicio de perfiles autenticados.
 *
 * <p>Toda lectura o escritura se ejecuta en una transacción con
 * {@code app.current_user_id} fijado (a través de {@link RlsExecutor}) para que
 * las políticas RLS puedan restringir las filas a su propietario.</p>
 */
@Service
public class PerfilService {

    private final PerfilRepository perfilRepository;
    private final RlsExecutor rlsExecutor;

    public PerfilService(PerfilRepository perfilRepository, RlsExecutor rlsExecutor) {
        this.perfilRepository = perfilRepository;
        this.rlsExecutor = rlsExecutor;
    }

    /**
     * Devuelve el perfil del usuario autenticado.
     *
     * <p>Regla de sincronizacion: si la cuenta sigue pendiente de verificacion
     * en la BD pero el JWT trae el correo confirmado (claim email_confirmed_at),
     * se promueve a activo aqui en el backend y se persiste. El cliente nunca
     * marca cuentas como activas por su cuenta.</p>
     */
    public PerfilResponse obtenerPerfilDe(UUID usuarioId, boolean correoConfirmado) {
        return rlsExecutor.executeAs(usuarioId, () -> {
            Perfil perfil = perfilRepository.findById(usuarioId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "No se encontró un perfil para el usuario autenticado."));
            if (perfil.getEstadoCuenta() == com.inkaquest.shared.enums.EstadoCuenta.pendiente_verificacion
                    && correoConfirmado) {
                perfil.setEstadoCuenta(com.inkaquest.shared.enums.EstadoCuenta.activo);
                perfil = perfilRepository.save(perfil);
            }
            return PerfilResponse.from(perfil);
        });
    }

    /**
     * Devuelve el perfil del usuario autenticado o lo crea si no existe
     * (idempotente). El perfil creado SIEMPRE nace como estudiante:
     * el rol nunca se acepta del cliente.
     */
    public PerfilResponse asegurarPerfilDe(UUID usuarioId, String email, String nombre) {
        return rlsExecutor.executeAs(usuarioId, () ->
                perfilRepository.findById(usuarioId)
                        .map(PerfilResponse::from)
                        .orElseGet(() -> {
                            Perfil nuevo = new Perfil();
                            nuevo.setId(usuarioId);
                            nuevo.setEmail(email == null || email.isBlank()
                                    ? "usuario-" + usuarioId.toString().substring(0, 8) + "@inkaquest.local"
                                    : email.trim().toLowerCase());
                            nuevo.setNombre(nombre == null || nombre.isBlank()
                                    ? "Usuario"
                                    : nombre.trim());
                            nuevo.setRol(com.inkaquest.shared.enums.RolUsuario.estudiante);
                            nuevo.setEstadoCuenta(com.inkaquest.shared.enums.EstadoCuenta.activo);
                            nuevo.setXp(0);
                            nuevo.setNivel(1);
                            nuevo.setRachaDias(0);
                            return PerfilResponse.from(perfilRepository.save(nuevo));
                        }));
    }

    /**
     * Actualiza el perfil del usuario autenticado. Solo modifica los campos
     * provistos; los demás permanecen como estaban.
     *
     * <p>El {@code rol} se preserva siempre: ningún usuario puede cambiar
     * su rol por este endpoint (sería escalación de privilegios).</p>
     */
    public PerfilResponse actualizarPerfilDe(UUID usuarioId, PerfilActualizacionRequest request) {
        return rlsExecutor.executeAs(usuarioId, () -> {
            Perfil perfil = perfilRepository.findById(usuarioId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "No se encontró un perfil para el usuario autenticado."));
            if (request.nombre() != null && !request.nombre().isBlank()) {
                perfil.setNombre(request.nombre().trim());
            }
            if (request.apellido() != null) {
                perfil.setApellido(blankToNull(request.apellido()));
            }
            if (request.documento() != null) {
                perfil.setDocumento(blankToNull(request.documento()));
            }
            if (request.genero() != null) {
                perfil.setGenero(blankToNull(request.genero()));
            }
            if (request.fechaNacimiento() != null) {
                perfil.setFechaNacimiento(request.fechaNacimiento());
            }
            if (request.telefono() != null) {
                perfil.setTelefono(blankToNull(request.telefono()));
            }
            if (request.bio() != null) {
                perfil.setBio(blankToNull(request.bio()));
            }
            if (request.email() != null && !request.email().isBlank()) {
                // El email se sincroniza con Supabase Auth aparte; aquí sólo reflejamos en BD.
                perfil.setEmail(request.email().trim().toLowerCase());
            }
            return PerfilResponse.from(perfilRepository.save(perfil));
        });
    }

    private static String blankToNull(String s) {
        if (s == null || s.isBlank()) {
            return null;
        }
        return s.trim();
    }
}
