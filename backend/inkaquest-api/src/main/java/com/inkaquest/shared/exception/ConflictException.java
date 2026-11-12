package com.inkaquest.shared.exception;

/** 409 — conflicto con el estado actual del recurso. */
public class ConflictException extends RuntimeException {
    public ConflictException(String message) {
        super(message);
    }
}
