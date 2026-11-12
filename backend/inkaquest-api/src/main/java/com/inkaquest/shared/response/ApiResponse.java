package com.inkaquest.shared.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import java.util.Map;

/** Contrato unico para respuestas exitosas y errores de la API. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiResponse<T>(boolean success, String message, T data, String error,
                             Instant timestamp, String path, Map<String, String> errors) {
    
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, null, data, null, Instant.now(), null, null);
    }
    
    public static <T> ApiResponse<T> success(T data, String message) {
        return new ApiResponse<>(true, message, data, null, Instant.now(), null, null);
    }
    
    public static <T> ApiResponse<T> error(String message) {
        return new ApiResponse<>(false, message, null, message, Instant.now(), null, null);
    }
    
    public static <T> ApiResponse<T> ok(T data, String message) {
        return new ApiResponse<>(true, message, data, null, Instant.now(), null, null);
    }
    public static ApiResponse<Void> ok(String message) {
        return new ApiResponse<>(true, message, null, null, Instant.now(), null, null);
    }
    public static <T> ApiResponse<T> error(String message, String error) {
        return new ApiResponse<>(false, message, null, error, Instant.now(), null, null);
    }
    public static <T> ApiResponse<T> error(String message, String error, String path) {
        return new ApiResponse<>(false, message, null, error, Instant.now(), path, null);
    }
    public static <T> ApiResponse<T> validationError(String message, String error,
                                                       String path, Map<String, String> errors) {
        return new ApiResponse<>(false, message, null, error, Instant.now(), path, errors);
    }
}
