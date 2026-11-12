package com.inkaquest.shared.exception;

/** 422 — la peticion es sintacticamente valida pero el contenido no es procesable. */
public class UnprocessableEntityException extends RuntimeException {
    public UnprocessableEntityException(String message) {
        super(message);
    }
}
