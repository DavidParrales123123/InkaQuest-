package com.inkaquest.modules.auditoria.dto;

import com.inkaquest.modules.auditoria.entity.RegistroAccion;
import com.inkaquest.shared.enums.TipoAccion;

import java.time.Instant;
import java.util.UUID;

/** Fila del registro de auditoria visible para el administrador. */
public record AuditoriaResponse(
        UUID id,
        TipoAccion accion,
        UUID actorId,
        UUID objetivoId,
        String entidadTipo,
        UUID entidadId,
        boolean exito,
        String mensajeError,
        Instant creadoEn) {

    public static AuditoriaResponse from(RegistroAccion r) {
        return new AuditoriaResponse(
                r.getId(),
                r.getAccion(),
                r.getActorId() != null ? r.getActorId().getId() : null,
                r.getUsuarioObjetivoId() != null ? r.getUsuarioObjetivoId().getId() : null,
                r.getEntidadTipo(),
                r.getEntidadId(),
                Boolean.TRUE.equals(r.getExito()),
                r.getMensajeError(),
                r.getCreadoEn());
    }
}
