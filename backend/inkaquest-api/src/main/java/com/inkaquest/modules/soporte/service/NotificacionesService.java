package com.inkaquest.modules.soporte.service;

import com.inkaquest.modules.soporte.dto.NotificacionResponse;
import com.inkaquest.modules.soporte.entity.NotificacionDestinatario;
import com.inkaquest.modules.soporte.repository.NotificacionDestinatarioRepository;
import com.inkaquest.shared.enums.EstadoNotificacion;
import com.inkaquest.shared.exception.ResourceNotFoundException;
import com.inkaquest.shared.exception.UnauthorizedException;
import com.inkaquest.shared.security.RlsExecutor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

/**
 * Servicio de notificaciones del usuario autenticado.
 * Solo lectura/marcar leidas; la CREACION la dispara el resto del backend
 * (pago, mision, certificado, solicitud) segun evoluciona cada modulo.
 */
@Service
public class NotificacionesService {

    private final NotificacionDestinatarioRepository destinatarioRepository;
    private final RlsExecutor rlsExecutor;

    public NotificacionesService(NotificacionDestinatarioRepository destinatarioRepository,
                                 RlsExecutor rlsExecutor) {
        this.destinatarioRepository = destinatarioRepository;
        this.rlsExecutor = rlsExecutor;
    }

    /** Lista paginada de mis notificaciones (no leidas primero). */
    @Transactional
    public Page<NotificacionResponse> misNotificaciones(UUID usuarioId, Pageable pageable) {
        return rlsExecutor.executeAs(usuarioId, () ->
                destinatarioRepository.findDeUsuario(usuarioId, pageable)
                        .map(NotificacionResponse::from));
    }

    /** Cantidad de no leidas. */
    @Transactional
    public long contarNoLeidas(UUID usuarioId) {
        return rlsExecutor.executeAs(usuarioId, () -> destinatarioRepository.countNoLeidas(usuarioId));
    }

    /** Marca UNA notificacion como leida (verificando propiedad). */
    @Transactional
    public NotificacionResponse marcarLeida(UUID usuarioId, UUID notificacionDestinatarioId) {
        return rlsExecutor.executeAs(usuarioId, () -> {
            NotificacionDestinatario nd = destinatarioRepository.findById(notificacionDestinatarioId)
                    .orElseThrow(() -> new ResourceNotFoundException("Notificacion no encontrada."));
            if (!usuarioId.equals(nd.getUsuarioId().getId())) {
                throw new UnauthorizedException("No puedes modificar una notificacion ajena.");
            }
            nd.setLeidaEn(Instant.now());
            nd.setEstado(EstadoNotificacion.leida);
            return NotificacionResponse.from(destinatarioRepository.save(nd));
        });
    }

    /** Marca TODAS como leidas. Devuelve cuantas se marcaron. */
    @Transactional
    public int marcarTodasLeidas(UUID usuarioId) {
        return rlsExecutor.executeAs(usuarioId, () ->
                destinatarioRepository.marcarTodasLeidas(usuarioId, EstadoNotificacion.leida));
    }
}
