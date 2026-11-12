package com.inkaquest.shared.exception;

import java.util.Map;

/**
 * Excepción de negocio: representa una condición inválida de la petición.
 *
 * <p>Se traduce a una respuesta HTTP 400 mediante el manejador global.
 */
public class BadRequestException extends RuntimeException {

    private final transient Map<String, Object> details;

    public BadRequestException(String message) {
        this(message, Map.of());
    }

    public BadRequestException(String message, Map<String, Object> details) {
        super(message);
        this.details = Map.copyOf(details);
    }

    public Map<String, Object> getDetails() {
        return details;
    }
}
