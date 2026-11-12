package com.inkaquest.shared.exception;

/** 503 — servicio o proveedor externo no disponible/habilitado. */
public class ServiceUnavailableException extends RuntimeException {
    public ServiceUnavailableException(String message) {
        super(message);
    }
}
