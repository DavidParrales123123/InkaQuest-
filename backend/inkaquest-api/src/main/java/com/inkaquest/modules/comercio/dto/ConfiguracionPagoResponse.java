package com.inkaquest.modules.comercio.dto;

/** Configuración pública necesaria para tokenizar en el navegador. */
public record ConfiguracionPagoResponse(
        String publicKey,
        String moneda,
        boolean habilitado
) {}
