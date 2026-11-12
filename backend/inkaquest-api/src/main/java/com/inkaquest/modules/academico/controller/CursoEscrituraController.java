package com.inkaquest.modules.academico.controller;

import com.inkaquest.modules.academico.dto.*;
import com.inkaquest.modules.academico.service.CursoAdminService;
import com.inkaquest.modules.academico.service.EstructuraService;
import com.inkaquest.modules.matriculas.service.MatriculaService;
import com.inkaquest.shared.enums.EstadoCurso;
import com.inkaquest.shared.enums.RolUsuario;
import com.inkaquest.shared.response.ApiResponse;
import com.inkaquest.shared.security.RequireRole;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.validation.annotation.Validated;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Endpoints de escritura de cursos y de estructura curricular
 * (secciones 13 y 14).
 */
@RestController
@RequestMapping("/api/v1")
@Validated
public class CursoEscrituraController {

    private final CursoAdminService cursoAdminService;
    private final EstructuraService estructuraService;
    private final MatriculaService matriculaService;

    public CursoEscrituraController(CursoAdminService cursoAdminService,
                                    EstructuraService estructuraService,
                                    MatriculaService matriculaService) {
        this.cursoAdminService = cursoAdminService;
        this.estructuraService = estructuraService;
        this.matriculaService = matriculaService;
    }

    private static UUID authId(Jwt jwt) {
        try {
            return UUID.fromString(jwt.getClaimAsString("sub"));
        } catch (IllegalArgumentException e) {
            throw new org.springframework.security.authentication.BadCredentialsException(
                    "El token no incluye un sub valido.");
        }
    }

    // ---------- Seccion 13: gestion del curso ----------

    /** POST /api/v1/cursos — crear curso (docente/admin). */
    @RequireRole({RolUsuario.docente, RolUsuario.administrador})
    @PostMapping("/cursos")
    public ApiResponse<CursoResponse> crear(@AuthenticationPrincipal Jwt jwt,
                                           @Valid @RequestBody CursoCrearRequest request) {
        return ApiResponse.ok(cursoAdminService.crear(authId(jwt), request),
                "Curso creado en borrador.");
    }

    /** PUT /api/v1/cursos/{slug} — editar descripcion/titulo/precio (creador/admin). */
    @PutMapping("/cursos/{slug}")
    public ApiResponse<CursoResponse> actualizar(@AuthenticationPrincipal Jwt jwt,
                                                 @PathVariable @Size(min = 1, max = 200) @Pattern(regexp = "^[a-z0-9]+(-[a-z0-9]+)*$", message = "Slug de curso invalido.") String slug,
                                                 @Valid @RequestBody CursoActualizarRequest request) {
        return ApiResponse.ok(cursoAdminService.actualizar(authId(jwt), slug, request),
                "Curso actualizado.");
    }

    /** POST /api/v1/cursos/{slug}/enviar-revision — borrador -> en_revision. */
    @PostMapping("/cursos/{slug}/enviar-revision")
    public ApiResponse<CursoResponse> enviarRevision(@AuthenticationPrincipal Jwt jwt,
                                                     @PathVariable @Size(min = 1, max = 200) @Pattern(regexp = "^[a-z0-9]+(-[a-z0-9]+)*$", message = "Slug de curso invalido.") String slug) {
        return ApiResponse.ok(cursoAdminService.enviarRevision(authId(jwt), slug),
                "Curso enviado a revision.");
    }

    /** POST /api/v1/admin/cursos/{slug}/publicar — en_revision -> publicado (admin). */
    @RequireRole(RolUsuario.administrador)
    @PostMapping("/admin/cursos/{slug}/publicar")
    public ApiResponse<CursoResponse> publicar(@AuthenticationPrincipal Jwt jwt,
                                              @PathVariable @Size(min = 1, max = 200) @Pattern(regexp = "^[a-z0-9]+(-[a-z0-9]+)*$", message = "Slug de curso invalido.") String slug) {
        return ApiResponse.ok(cursoAdminService.publicar(authId(jwt), slug),
                "Curso publicado.");
    }

    /** POST /api/v1/admin/cursos/{slug}/archivar — publicado -> archivado (admin). */
    @RequireRole(RolUsuario.administrador)
    @PostMapping("/admin/cursos/{slug}/archivar")
    public ApiResponse<CursoResponse> archivar(@AuthenticationPrincipal Jwt jwt,
                                              @PathVariable @Size(min = 1, max = 200) @Pattern(regexp = "^[a-z0-9]+(-[a-z0-9]+)*$", message = "Slug de curso invalido.") String slug) {
        return ApiResponse.ok(cursoAdminService.archivar(authId(jwt), slug),
                "Curso archivado.");
    }

    /** GET /api/v1/docente/cursos — mis cursos (docente/admin). */
    @RequireRole({RolUsuario.docente, RolUsuario.administrador})
    @GetMapping("/docente/cursos")
    public ApiResponse<List<CursoResponse>> misCursos(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.ok(cursoAdminService.misCursosDocente(authId(jwt)),
                "Cursos del docente cargados.");
    }

    /** GET /api/v1/docente/cursos/{slug}/estudiantes — alumnos matriculados (creador/asignado/admin). */
    @RequireRole({RolUsuario.docente, RolUsuario.administrador})
    @GetMapping("/docente/cursos/{slug}/estudiantes")
    public ApiResponse<List<com.inkaquest.modules.matriculas.dto.EstudianteEnCursoResponse>>
            estudiantesDeCurso(@AuthenticationPrincipal Jwt jwt, @PathVariable @Size(min = 1, max = 200) @Pattern(regexp = "^[a-z0-9]+(-[a-z0-9]+)*$", message = "Slug de curso invalido.") String slug) {
        return ApiResponse.ok(matriculaService.estudiantesDelCurso(authId(jwt), slug),
                "Estudiantes del curso cargados.");
    }

    /** GET /api/v1/admin/cursos?estado=&page=&size= — listado administrativo de cursos. */
    @RequireRole(RolUsuario.administrador)
    @GetMapping("/admin/cursos")
    public ApiResponse<Page<CursoResponse>> adminListar(@AuthenticationPrincipal Jwt jwt,
                                                       @RequestParam EstadoCurso estado,
                                                       @RequestParam(defaultValue = "0") @Min(0) int page,
                                                       @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        authId(jwt); // fuerza presencia de sub (JWT ya verificado por el filtro)
        Pageable pageable = PageRequest.of(Math.max(0, page),
                Math.max(1, Math.min(100, size)), Sort.by("creadoEn").descending());
        return ApiResponse.ok(cursoAdminService.listarPorEstado(authId(jwt), estado, pageable),
                "Cursos listados.");
    }

    // ---------- Seccion 13 y 14: estructura curricular ----------

    /** GET /api/v1/cursos/{slug}/estructura — arbol completo (requiere ver todo o curso publicado). */
    @GetMapping("/cursos/{slug}/estructura")
    public ApiResponse<EstructuraCursoResponse> estructura(@AuthenticationPrincipal Jwt jwt,
                                                          @PathVariable @Size(min = 1, max = 200) @Pattern(regexp = "^[a-z0-9]+(-[a-z0-9]+)*$", message = "Slug de curso invalido.") String slug) {
        return ApiResponse.ok(estructuraService.estructura(slug, authId(jwt)),
                "Estructura cargada.");
    }

    /** POST /api/v1/cursos/{slug}/unidades — crea unidad (creador/asignado/admin). */
    @PostMapping("/cursos/{slug}/unidades")
    public ApiResponse<UUID> crearUnidad(@AuthenticationPrincipal Jwt jwt,
                                         @PathVariable @Size(min = 1, max = 200) @Pattern(regexp = "^[a-z0-9]+(-[a-z0-9]+)*$", message = "Slug de curso invalido.") String slug,
                                         @Valid @RequestBody UnidadCrearRequest request) {
        return ApiResponse.ok(estructuraService.crearUnidad(slug, authId(jwt), request),
                "Unidad creada.");
    }

    /** PUT /api/v1/unidades/{id} — editar unidad. */
    @PutMapping("/unidades/{id}")
    public ApiResponse<Void> actualizarUnidad(@AuthenticationPrincipal Jwt jwt,
                                              @PathVariable UUID id,
                                              @Valid @RequestBody UnidadActualizarRequest request) {
        estructuraService.actualizarUnidad(authId(jwt), id, request);
        return ApiResponse.ok("Unidad actualizada.");
    }

    /** DELETE /api/v1/unidades/{id} — eliminar unidad (rechaza si tiene modulos). */
    @DeleteMapping("/unidades/{id}")
    public ApiResponse<Void> eliminarUnidad(@AuthenticationPrincipal Jwt jwt,
                                           @PathVariable UUID id) {
        estructuraService.eliminarUnidad(authId(jwt), id);
        return ApiResponse.ok("Unidad eliminada.");
    }

    /** POST /api/v1/unidades/{unidadId}/modulos — crea modulo. */
    @PostMapping("/unidades/{unidadId}/modulos")
    public ApiResponse<UUID> crearModulo(@AuthenticationPrincipal Jwt jwt,
                                        @PathVariable UUID unidadId,
                                        @Valid @RequestBody ModuloCrearRequest request) {
        return ApiResponse.ok(estructuraService.crearModulo(authId(jwt), unidadId, request),
                "Modulo creado.");
    }

    /** PUT /api/v1/modulos/{id} — editar modulo. */
    @PutMapping("/modulos/{id}")
    public ApiResponse<Void> actualizarModulo(@AuthenticationPrincipal Jwt jwt,
                                              @PathVariable UUID id,
                                              @Valid @RequestBody ModuloActualizarRequest request) {
        estructuraService.actualizarModulo(authId(jwt), id, request);
        return ApiResponse.ok("Modulo actualizado.");
    }

    /** DELETE /api/v1/modulos/{id} — eliminar modulo (rechaza si tiene lecciones). */
    @DeleteMapping("/modulos/{id}")
    public ApiResponse<Void> eliminarModulo(@AuthenticationPrincipal Jwt jwt,
                                           @PathVariable UUID id) {
        estructuraService.eliminarModulo(authId(jwt), id);
        return ApiResponse.ok("Modulo eliminado.");
    }

    /** POST /api/v1/modulos/{moduloId}/lecciones — crea leccion. */
    @PostMapping("/modulos/{moduloId}/lecciones")
    public ApiResponse<UUID> crearLeccion(@AuthenticationPrincipal Jwt jwt,
                                          @PathVariable UUID moduloId,
                                          @Valid @RequestBody LeccionCrearRequest request) {
        return ApiResponse.ok(estructuraService.crearLeccion(authId(jwt), moduloId, request),
                "Leccion creada.");
    }

    /** PUT /api/v1/lecciones/{id} — editar leccion. */
    @PutMapping("/lecciones/{id}")
    public ApiResponse<Void> actualizarLeccion(@AuthenticationPrincipal Jwt jwt,
                                               @PathVariable UUID id,
                                               @Valid @RequestBody LeccionActualizarRequest request) {
        estructuraService.actualizarLeccion(authId(jwt), id, request);
        return ApiResponse.ok("Leccion actualizada.");
    }

    /** DELETE /api/v1/lecciones/{id} — eliminar leccion (rechaza si tiene progreso). */
    @DeleteMapping("/lecciones/{id}")
    public ApiResponse<Void> eliminarLeccion(@AuthenticationPrincipal Jwt jwt,
                                            @PathVariable UUID id) {
        estructuraService.eliminarLeccion(authId(jwt), id);
        return ApiResponse.ok("Leccion eliminada.");
    }
}
