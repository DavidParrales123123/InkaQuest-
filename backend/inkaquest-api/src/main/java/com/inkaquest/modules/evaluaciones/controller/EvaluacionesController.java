package com.inkaquest.modules.evaluaciones.controller;

import com.inkaquest.modules.evaluaciones.dto.*;
import com.inkaquest.modules.evaluaciones.service.EvaluacionesService;
import com.inkaquest.shared.response.ApiResponse;
import com.inkaquest.shared.security.AuthenticatedUser;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Controlador REST para evaluaciones/cuestionarios.
 *
 * <p>Endpoints:
 * <ul>
 *   <li>GET /api/evaluaciones - Listar evaluaciones disponibles</li>
 *   <li>GET /api/evaluaciones/{id} - Obtener detalle de evaluación</li>
 *   <li>POST /api/evaluaciones/{id}/iniciar - Iniciar nuevo intento</li>
 *   <li>POST /api/intentos/{id}/responder - Enviar respuestas y calificar</li>
 *   <li>GET /api/intentos/{id}/resultado - Ver resultado de intento</li>
 * </ul>
 *
 * <p>Seguridad:
 * <ul>
 *   <li>Autenticación JWT requerida</li>
 *   <li>Validación de matrícula en curso</li>
 *   <li>Validación de intentos permitidos</li>
 *   <li>Validación de tiempo límite</li>
 * </ul>
 */
@RestController
@RequestMapping("/api")
public class EvaluacionesController {

    private final EvaluacionesService evaluacionesService;

    public EvaluacionesController(EvaluacionesService evaluacionesService) {
        this.evaluacionesService = evaluacionesService;
    }

    /**
     * Lista las evaluaciones/cuestionarios disponibles.
     * 
     * @param cursoId Filtro opcional por curso
     * @param user Usuario autenticado
     * @return Lista de evaluaciones con información de intentos
     */
    @GetMapping("/evaluaciones")
    @PreAuthorize("hasAnyRole('estudiante', 'docente', 'admin')")
    public ResponseEntity<ApiResponse<List<EvaluacionResponse>>> listarEvaluaciones(
            @RequestParam(required = false) UUID cursoId,
            @AuthenticatedUser UUID user) {
        
        List<EvaluacionResponse> evaluaciones = evaluacionesService.listarEvaluaciones(user, cursoId);
        return ResponseEntity.ok(ApiResponse.success(evaluaciones));
    }

    /**
     * Obtiene el detalle de una evaluación.
     * 
     * @param id ID de la evaluación
     * @param user Usuario autenticado
     * @return Detalle de la evaluación
     */
    @GetMapping("/evaluaciones/{id}")
    @PreAuthorize("hasAnyRole('estudiante', 'docente', 'admin')")
    public ResponseEntity<ApiResponse<EvaluacionResponse>> obtenerDetalle(
            @PathVariable UUID id,
            @AuthenticatedUser UUID user) {
        
        EvaluacionResponse evaluacion = evaluacionesService.obtenerDetalle(id, user);
        return ResponseEntity.ok(ApiResponse.success(evaluacion));
    }

    /**
     * Inicia un nuevo intento de evaluación.
     * 
     * <p>Validaciones:
     * <ul>
     *   <li>Estudiante matriculado en el curso</li>
     *   <li>No ha agotado intentos permitidos</li>
     *   <li>Evaluación disponible</li>
     * </ul>
     * 
     * @param id ID de la evaluación
     * @param user Usuario autenticado (estudiante)
     * @return Intento iniciado con las preguntas
     */
    @PostMapping("/evaluaciones/{id}/iniciar")
    @PreAuthorize("hasAnyRole('estudiante', 'docente', 'admin')")
    public ResponseEntity<ApiResponse<IniciarIntentoResponse>> iniciarIntento(
            @PathVariable UUID id,
            @AuthenticatedUser UUID user) {
        
        IniciarIntentoResponse intento = evaluacionesService.iniciarIntento(id, user);
        return ResponseEntity.ok(ApiResponse.success(intento, "Intento iniciado exitosamente"));
    }

    /**
     * Envía las respuestas de un intento y obtiene el resultado.
     * 
     * <p>El sistema:
     * <ul>
     *   <li>Califica automáticamente preguntas de opción múltiple</li>
     *   <li>Marca para revisión manual las preguntas abiertas</li>
     *   <li>Calcula puntaje total y porcentaje</li>
     *   <li>Determina si aprobó según porcentaje mínimo</li>
     * </ul>
     * 
     * @param id ID del intento
     * @param request Respuestas del estudiante
     * @param user Usuario autenticado
     * @return Resultado con puntaje y respuestas correctas (si aplica)
     */
    @PostMapping("/intentos/{id}/responder")
    @PreAuthorize("hasAnyRole('estudiante', 'docente', 'admin')")
    public ResponseEntity<ApiResponse<ResultadoIntentoResponse>> responderIntento(
            @PathVariable UUID id,
            @Valid @RequestBody ResponderIntentoRequest request,
            @AuthenticatedUser UUID user) {
        
        ResultadoIntentoResponse resultado = evaluacionesService.responderIntento(id, request, user);
        return ResponseEntity.ok(ApiResponse.success(resultado, "Evaluación enviada y calificada"));
    }

    /**
     * Obtiene el resultado de un intento ya finalizado.
     * 
     * @param id ID del intento
     * @param user Usuario autenticado
     * @return Resultado con puntaje y detalles
     */
    @GetMapping("/intentos/{id}/resultado")
    @PreAuthorize("hasAnyRole('estudiante', 'docente', 'admin')")
    public ResponseEntity<ApiResponse<ResultadoIntentoResponse>> obtenerResultado(
            @PathVariable UUID id,
            @AuthenticatedUser UUID user) {
        
        ResultadoIntentoResponse resultado = evaluacionesService.obtenerResultado(id, user);
        return ResponseEntity.ok(ApiResponse.success(resultado));
    }
}
