package com.inkaquest.modules.soporte.dto;

import java.time.Instant;
import java.util.UUID;

/** Resumen de un hilo de conversacion del usuario autenticado. */
public record HiloResumenResponse(
        UUID otroId,
        String nombre,
        String email,
        String ultimoMensaje,
        Instant ultimoEn,
        long noLeidos) {
}
