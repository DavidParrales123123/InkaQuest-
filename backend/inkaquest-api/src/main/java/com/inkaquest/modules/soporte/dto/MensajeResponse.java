package com.inkaquest.modules.soporte.dto;

import com.inkaquest.modules.soporte.entity.Mensaje;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/** Vista de un mensaje, con los campos que el cliente necesita. */
public record MensajeResponse(
        UUID id,
        UUID emisorId,
        UUID destinatarioId,
        UUID hiloId,
        String cuerpo,
        Map<String, Object> adjuntos,
        Instant leidoEn,
        Boolean borradoPorEmisor,
        Boolean borradoPorDestinatario,
        Instant creadoEn) {

    public static MensajeResponse from(Mensaje m) {
        return new MensajeResponse(
                m.getId(),
                m.getEmisorId() != null ? m.getEmisorId().getId() : null,
                m.getDestinatarioId() != null ? m.getDestinatarioId().getId() : null,
                m.getHiloId(),
                m.getCuerpo(),
                m.getAdjuntos(),
                m.getLeidoEn(),
                m.getBorradoPorEmisor(),
                m.getBorradoPorDestinatario(),
                m.getCreadoEn());
    }
}
