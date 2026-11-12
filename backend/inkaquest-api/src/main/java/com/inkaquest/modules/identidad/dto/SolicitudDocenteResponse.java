package com.inkaquest.modules.identidad.dto;

import com.inkaquest.modules.identidad.entity.SolicitudDocente;
import com.inkaquest.shared.enums.EstadoSolicitudDocente;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Respuesta de una solicitud de docente.
 */
public record SolicitudDocenteResponse(
        UUID id,
        String institucion,
        String especialidad,
        String codigoDocente,
        String motivo,
        Map<String, Object> documentosAdjuntos,
        EstadoSolicitudDocente estado,
        Instant revisadoEn,
        String motivoRevision,
        Instant creadoEn) {

    public static SolicitudDocenteResponse from(SolicitudDocente s) {
        return new SolicitudDocenteResponse(
                s.getId(),
                s.getInstitucion(),
                s.getEspecialidad(),
                s.getCodigoDocente(),
                s.getMotivo(),
                s.getDocumentosAdjuntos(),
                s.getEstado(),
                s.getRevisadoEn(),
                s.getMotivoRevision(),
                s.getCreadoEn());
    }
}
