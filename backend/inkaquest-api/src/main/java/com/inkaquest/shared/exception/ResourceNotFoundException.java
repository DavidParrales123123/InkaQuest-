package com.inkaquest.shared.exception;

/**
 * Excepción de negocio: el recurso solicitado no existe.
 *
 * <p>Se traduce a una respuesta HTTP 404.
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }

    /** Fábrica con el nombre del recurso y su identificador. */
    public static ResourceNotFoundException of(String resource, Object id) {
        return new ResourceNotFoundException(
                String.format("No se encontró el recurso '%s' con identificador '%s'.", resource, id));
    }
}
