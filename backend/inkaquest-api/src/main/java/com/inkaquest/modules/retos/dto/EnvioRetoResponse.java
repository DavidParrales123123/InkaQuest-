package com.inkaquest.modules.retos.dto;

import com.inkaquest.modules.retos.entity.EnvioReto;
import com.inkaquest.shared.enums.EstadoEnvio;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/** Envio de solucion registrado. */
public record EnvioRetoResponse(
        UUID id,
        UUID retoId,
        UUID lenguajeId,
        EstadoEnvio estado,
        BigDecimal puntaje,
        BigDecimal puntajeMaximo,
        Boolean aprobado,
        String errorMensaje,
        Instant creadoEn) {

    public static EnvioRetoResponse from(EnvioReto e) {
        return new EnvioRetoResponse(
                e.getId(),
                e.getRetoId() != null ? e.getRetoId().getId() : null,
                e.getLenguajeId() != null ? e.getLenguajeId().getId() : null,
                e.getEstado(),
                e.getPuntaje(),
                e.getPuntajeMaximo(),
                e.getAprobado(),
                e.getErrorMensaje(),
                e.getCreadoEn());
    }
}
