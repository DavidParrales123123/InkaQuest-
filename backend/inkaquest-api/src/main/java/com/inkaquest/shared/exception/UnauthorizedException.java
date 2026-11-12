package com.inkaquest.shared.exception;

/**
 * Excepción de negocio: la petición no cumple los requisitos de autorización.
 *
 * <p>Se traduce a una respuesta HTTP 401 o 403 según el caso.
 */
public class UnauthorizedException extends RuntimeException {

    public UnauthorizedException(String message) {
        super(message);
    }
}
