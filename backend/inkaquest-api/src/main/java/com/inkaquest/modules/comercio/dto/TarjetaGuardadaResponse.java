package com.inkaquest.modules.comercio.dto;

import java.time.Instant;
import java.util.UUID;

/** Metadata no sensible de una tarjeta guardada en el vault de Culqi. */
public record TarjetaGuardadaResponse(
        UUID id,
        String marca,
        String ultimos4,
        Integer mesExpiracion,
        Integer anioExpiracion,
        boolean activo,
        Instant creadoEn
) {}
