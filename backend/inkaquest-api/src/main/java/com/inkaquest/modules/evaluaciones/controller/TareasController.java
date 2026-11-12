package com.inkaquest.modules.evaluaciones.controller;

import com.inkaquest.modules.evaluaciones.dto.*;
import com.inkaquest.modules.evaluaciones.service.TareasService;
import com.inkaquest.shared.response.ApiResponse;
import com.inkaquest.shared.security.AuthenticatedUser;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

/**
 * Controlador REST para gestión de tareas y entregas.
 *
 * <p>Endpoints:
 * <ul>
 *   <li>GET /api/tareas - Listar tareas del usuario</li>
 *   <li>GET /api/tareas/{id} - Obtener detalle de tarea</li>
 *   <li>POST /api/tareas - Crear nueva tarea (docente)</li>
 *   <li>PUT /api/tareas/{id} - Actualizar tarea (docente)</li>
 *   <li>GET /api/tareas/{id}/entregas - Listar entregas (docente)</li>
 *   <li>GET /api/tareas/{id}/mi-entrega - Obtener mi entrega (estudiante)</li>
 *   <li>POST /api/tareas/{id}/entregar - Entregar tarea (estudiante)</li>
 *   <li>POST /api/entregas/{id}/calificar - Calificar entrega (docente)</li>
 * </ul>
 *
 * <p>Seguridad:
 * <ul>
 *   <li>Autenticación JWT requerida en todos los endpoints</li>
 *   <li>Autorización basada en roles (estudiante/docente)</li>
 *   <li>Validación de entrada con Bean Validation</li>
 * </ul>
 */
@RestController
@RequestMapping("/api")
public class TareasController {

    private final TareasService tareasService;

    public TareasController(TareasService tareasService) {
        this.tareasService = tareasService;
    }

    /**
     * Lista las tareas accesibles para el usuario autenticado.
     * 
     * @param cursoId Filtro opcional por curso
     * @param estado Filtro opcional por estado de entrega
     * @param user Usuario autenticado
     * @return Lista de tareas
     */
    @GetMapping("/tareas")
    @PreAuthorize("hasAnyRole('estudiante', 'docente', 'admin')")
    public ResponseEntity<ApiResponse<List<TareaResponse>>> listarTareas(
            @RequestParam(required = false) UUID cursoId,
            @RequestParam(required = false) String estado,
            @AuthenticatedUser UUID user) {
        
        List<TareaResponse> tareas = tareasService.listarTareasUsuario(user, cursoId, estado);
        return ResponseEntity.ok(ApiResponse.success(tareas));
    }

    /**
     * Obtiene el detalle completo de una tarea.
     * 
     * @param id ID de la tarea
     * @param user Usuario autenticado
     * @return Detalle de la tarea incluyendo mi entrega si existe
     */
    @GetMapping("/tareas/{id}")
    @PreAuthorize("hasAnyRole('estudiante', 'docente', 'admin')")
    public ResponseEntity<ApiResponse<TareaDetalleResponse>> obtenerDetalle(
            @PathVariable UUID id,
            @AuthenticatedUser UUID user) {
        
        TareaDetalleResponse tarea = tareasService.obtenerDetalle(id, user);
        return ResponseEntity.ok(ApiResponse.success(tarea));
    }

    /**
     * Crea una nueva tarea (solo docentes).
     * 
     * @param request Datos de la tarea
     * @param archivos Archivos adjuntos opcionales
     * @param user Usuario autenticado (docente)
     * @return Tarea creada
     */
    @PostMapping("/tareas")
    @PreAuthorize("hasAnyRole('docente', 'admin')")
    public ResponseEntity<ApiResponse<TareaResponse>> crear(
            @Valid @RequestBody TareaCrearRequest request,
            @RequestParam(required = false) List<MultipartFile> archivos,
            @AuthenticatedUser UUID user) {
        
        TareaResponse tarea = tareasService.crear(request, archivos, user);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(tarea, "Tarea creada exitosamente"));
    }

    /**
     * Actualiza una tarea existente (solo docente propietario).
     * 
     * @param id ID de la tarea
     * @param request Campos a actualizar
     * @param user Usuario autenticado (docente)
     * @return Tarea actualizada
     */
    @PutMapping("/tareas/{id}")
    @PreAuthorize("hasAnyRole('docente', 'admin')")
    public ResponseEntity<ApiResponse<TareaResponse>> actualizar(
            @PathVariable UUID id,
            @Valid @RequestBody TareaActualizarRequest request,
            @AuthenticatedUser UUID user) {
        
        TareaResponse tarea = tareasService.actualizar(id, request, user);
        return ResponseEntity.ok(ApiResponse.success(tarea, "Tarea actualizada exitosamente"));
    }

    /**
     * Lista todas las entregas de una tarea (solo docentes).
     * 
     * @param id ID de la tarea
     * @param estado Filtro opcional por estado
     * @param user Usuario autenticado (docente)
     * @return Lista de entregas
     */
    @GetMapping("/tareas/{id}/entregas")
    @PreAuthorize("hasAnyRole('docente', 'admin')")
    public ResponseEntity<ApiResponse<List<EntregaResponse>>> listarEntregas(
            @PathVariable UUID id,
            @RequestParam(required = false) String estado,
            @AuthenticatedUser UUID user) {
        
        List<EntregaResponse> entregas = tareasService.listarEntregas(id, estado, user);
        return ResponseEntity.ok(ApiResponse.success(entregas));
    }

    /**
     * Obtiene la entrega del estudiante autenticado para una tarea.
     * 
     * @param id ID de la tarea
     * @param user Usuario autenticado (estudiante)
     * @return Mi entrega o estructura vacía si no existe
     */
    @GetMapping("/tareas/{id}/mi-entrega")
    @PreAuthorize("hasAnyRole('estudiante', 'docente', 'admin')")
    public ResponseEntity<ApiResponse<EntregaDetalleResponse>> obtenerMiEntrega(
            @PathVariable UUID id,
            @AuthenticatedUser UUID user) {
        
        EntregaDetalleResponse entrega = tareasService.obtenerMiEntrega(id, user);
        return ResponseEntity.ok(ApiResponse.success(entrega));
    }

    /**
     * Entrega o actualiza la entrega de una tarea (estudiantes).
     * 
     * @param id ID de la tarea
     * @param request Contenido de la entrega
     * @param archivos Archivos adjuntos opcionales
     * @param user Usuario autenticado (estudiante)
     * @return Entrega creada/actualizada
     */
    @PostMapping("/tareas/{id}/entregar")
    @PreAuthorize("hasAnyRole('estudiante', 'docente', 'admin')")
    public ResponseEntity<ApiResponse<EntregaResponse>> entregar(
            @PathVariable UUID id,
            @Valid @RequestBody EntregarRequest request,
            @RequestParam(required = false) List<MultipartFile> archivos,
            @AuthenticatedUser UUID user) {
        
        EntregaResponse entrega = tareasService.entregar(id, request, archivos, user);
        return ResponseEntity.ok(ApiResponse.success(entrega, "Entrega enviada exitosamente"));
    }

    /**
     * Califica una entrega (solo docentes).
     * 
     * @param id ID de la entrega
     * @param request Nota y comentario
     * @param user Usuario autenticado (docente)
     * @return Entrega calificada
     */
    @PostMapping("/entregas/{id}/calificar")
    @PreAuthorize("hasAnyRole('docente', 'admin')")
    public ResponseEntity<ApiResponse<EntregaResponse>> calificar(
            @PathVariable UUID id,
            @Valid @RequestBody CalificarEntregaRequest request,
            @AuthenticatedUser UUID user) {
        
        EntregaResponse entrega = tareasService.calificar(id, request, user);
        return ResponseEntity.ok(ApiResponse.success(entrega, "Entrega calificada exitosamente"));
    }
}
