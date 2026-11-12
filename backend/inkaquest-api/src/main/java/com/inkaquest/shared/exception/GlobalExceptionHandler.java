package com.inkaquest.shared.exception;

import com.inkaquest.shared.response.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Manejador global de excepciones.
 *
 * <p>Centraliza la traduccion de excepciones a respuestas HTTP con el contrato
 * {@link ApiResponse}. Nunca se exponen detalles internos (stack traces,
 * SQL, clases) al cliente: los logs internos las conservan y el cliente
 * recibe un codigo y un mensaje seguro.</p>
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ApiResponse<Void>> handleBadRequest(BadRequestException ex, HttpServletRequest req) {
        log.debug("Peticion invalida: {}", ex.getMessage());
        return error(HttpStatus.BAD_REQUEST, ex.getMessage(), "BAD_REQUEST", req);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotFound(ResourceNotFoundException ex, HttpServletRequest req) {
        log.debug("Recurso no encontrado: {}", ex.getMessage());
        return error(HttpStatus.NOT_FOUND, ex.getMessage(), "NOT_FOUND", req);
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ApiResponse<Void>> handleUnauthorized(UnauthorizedException ex, HttpServletRequest req) {
        log.debug("Acceso no autorizado: {}", ex.getMessage());
        return error(HttpStatus.FORBIDDEN, ex.getMessage(), "FORBIDDEN", req);
    }

    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ApiResponse<Void>> handleConflict(ConflictException ex, HttpServletRequest req) {
        log.debug("Conflicto: {}", ex.getMessage());
        return error(HttpStatus.CONFLICT, ex.getMessage(), "CONFLICT", req);
    }

    @ExceptionHandler(UnprocessableEntityException.class)
    public ResponseEntity<ApiResponse<Void>> handleUnprocessable(UnprocessableEntityException ex, HttpServletRequest req) {
        log.debug("No procesable: {}", ex.getMessage());
        return error(HttpStatus.UNPROCESSABLE_ENTITY, ex.getMessage(), "UNPROCESSABLE_ENTITY", req);
    }

    @ExceptionHandler(TooManyRequestsException.class)
    public ResponseEntity<ApiResponse<Void>> handleTooMany(TooManyRequestsException ex, HttpServletRequest req) {
        log.debug("Rate limit excedido: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .header("Retry-After", String.valueOf(ex.getRetryAfterSeconds()))
                .body(ApiResponse.error(ex.getMessage(), "TOO_MANY_REQUESTS", req.getRequestURI()));
    }

    @ExceptionHandler(ServiceUnavailableException.class)
    public ResponseEntity<ApiResponse<Void>> handleUnavailable(ServiceUnavailableException ex, HttpServletRequest req) {
        log.warn("Servicio no disponible: {}", ex.getMessage());
        return error(HttpStatus.SERVICE_UNAVAILABLE, ex.getMessage(), "SERVICE_UNAVAILABLE", req);
    }

    /** Excepciones de Spring ligadas a un status (aspectos, security). */
    @ExceptionHandler(org.springframework.web.server.ResponseStatusException.class)
    public ResponseEntity<ApiResponse<Void>> handleResponseStatus(
            org.springframework.web.server.ResponseStatusException ex, HttpServletRequest req) {
        log.debug("Error de status {}: {}", ex.getStatusCode(), ex.getReason());
        return ResponseEntity.status(ex.getStatusCode())
                .body(ApiResponse.error(
                        ex.getReason() != null ? ex.getReason() : "Error de autorizacion.",
                        ex.getStatusCode().toString(), req.getRequestURI()));
    }

    /** Acceso denegado por la cadena de seguridad. */
    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDenied(
            org.springframework.security.access.AccessDeniedException ex, HttpServletRequest req) {
        log.debug("Acceso denegado: {}", ex.getMessage());
        return error(HttpStatus.FORBIDDEN, "No tienes permisos para acceder a este recurso.", "FORBIDDEN", req);
    }

    /** Errores de validacion de beans (@Min, @Pattern, @Size en query/path). */
    @ExceptionHandler(jakarta.validation.ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleConstraintViolation(
            jakarta.validation.ConstraintViolationException ex, HttpServletRequest req) {
        Map<String, String> fields = new LinkedHashMap<>();
        ex.getConstraintViolations().forEach(v -> {
            String nombre = v.getPropertyPath().toString();
            int idx = nombre.lastIndexOf('.');
            if (idx >= 0) nombre = nombre.substring(idx + 1);
            fields.put(nombre, v.getMessage());
        });
        return ResponseEntity.badRequest().body(ApiResponse.validationError(
                "Los datos enviados no son validos.", "VALIDATION_ERROR", req.getRequestURI(), fields));
    }

    /** Errores de validacion de Bean Validation sobre el cuerpo de la peticion. */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest req) {
        Map<String, String> fields = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(error -> fields.put(error.getField(), error.getDefaultMessage()));
        return ResponseEntity.badRequest().body(ApiResponse.validationError(
                "Los datos enviados no son validos.", "VALIDATION_ERROR", req.getRequestURI(), fields));
    }

    /** Parametro requerido ausente. */
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ApiResponse<Void>> handleMissingParam(MissingServletRequestParameterException ex, HttpServletRequest req) {
        log.debug("Parametro ausente: {}", ex.getParameterName());
        return error(HttpStatus.BAD_REQUEST,
                "Falta el parametro obligatorio: " + ex.getParameterName(), "BAD_REQUEST", req);
    }

    /** Tipo de dato incorrecto en parametro o path. */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiResponse<Void>> handleTypeMismatch(MethodArgumentTypeMismatchException ex, HttpServletRequest req) {
        log.debug("Tipo incorrecto para {}: {}", ex.getName(), ex.getValue());
        return error(HttpStatus.BAD_REQUEST,
                "El parametro '" + ex.getName() + "' tiene un formato invalido.", "BAD_REQUEST", req);
    }

    /** Subida de archivo demasiado grande. */
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiResponse<Void>> handleUploadTooLarge(MaxUploadSizeExceededException ex, HttpServletRequest req) {
        log.debug("Archivo demasiado grande: {}", ex.getMessage());
        return error(HttpStatus.PAYLOAD_TOO_LARGE,
                "El archivo supera el tamano maximo permitido.", "PAYLOAD_TOO_LARGE", req);
    }

    /** Recurso/ruta inexistente (incluido Actuator no expuesto y docs deshabilitados). */
    @ExceptionHandler(org.springframework.web.servlet.resource.NoResourceFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNoResource(
            org.springframework.web.servlet.resource.NoResourceFoundException ex, HttpServletRequest req) {
        log.debug("Recurso inexistente: {}", ex.getResourcePath());
        return error(HttpStatus.NOT_FOUND, "El recurso no existe.", "NOT_FOUND", req);
    }

    /** Cualquier otra excepcion no controlada. */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleUnexpected(Exception ex, HttpServletRequest req) {
        log.error("Error no controlado", ex);
        return error(HttpStatus.INTERNAL_SERVER_ERROR,
                "Ocurrio un error interno inesperado.", "INTERNAL_ERROR", req);
    }

    private static ResponseEntity<ApiResponse<Void>> error(
            HttpStatus status, String message, String code, HttpServletRequest req) {
        return ResponseEntity.status(status)
                .body(ApiResponse.error(message, code, req.getRequestURI()));
    }
}
