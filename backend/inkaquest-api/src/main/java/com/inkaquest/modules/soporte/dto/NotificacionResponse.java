package com.inkaquest.modules.soporte.dto;

import com.inkaquest.modules.soporte.entity.NotificacionDestinatario;
import com.inkaquest.shared.enums.CanalNotificacion;
import com.inkaquest.shared.enums.EstadoNotificacion;

import java.time.Instant;
import java.util.UUID;

/** Notificacion vista por su destinatario. */
public record NotificacionResponse(
        UUID id,
        UUID notificacionId,
        String titulo,
        String mensaje,
        CanalNotificacion canal,
        EstadoNotificacion estado,
        Instant enviadaEn,
        Instant leidaEn,
        Instant creadoEn) {

    public static NotificacionResponse from(NotificacionDestinatario nd) {
        var n = nd.getNotificacionId();
        return new NotificacionResponse(
                nd.getId(),
                nd.getNotificacionId().getId(),
                n != null ? n.getTitulo() : null,
                n != null ? n.getMensaje() : null,
                nd.getCanal(),
                nd.getEstado(),
                nd.getEnviadaEn() != null ? nd.getEnviadaEn() : (n != null ? n.getEnviadaEn() : null),
                nd.getLeidaEn(),
                nd.getCreadoEn());
    }
}
