package com.inkaquest.modules.academico.controller;

import com.inkaquest.modules.academico.dto.CursoResponse;
import com.inkaquest.modules.academico.service.CursoService;
import com.inkaquest.shared.response.ApiResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Endpoints REST de cursos.
 *
 * <p>El contexto de seguridad (UUID del usuario) proviene siempre del JWT
 * verificado: nunca se acepta un id de usuario por parámetro.</p>
 */
@RestController
@RequestMapping("/api/v1/cursos")
@Validated
public class CursoController {

    private final CursoService cursoService;

    public CursoController(CursoService cursoService) {
        this.cursoService = cursoService;
    }

    /** Listado público paginado. */
    @GetMapping
    public ApiResponse<Page<CursoResponse>> listar(@AuthenticationPrincipal Jwt jwt,
                                                  @RequestParam(defaultValue = "") @Size(max = 200, message = "La busqueda no puede superar 200 caracteres.") String q,
                                                  @RequestParam(defaultValue = "0") @Min(value = 0, message = "La pagina debe ser >= 0.") int page,
                                                  @RequestParam(defaultValue = "20") @Min(value = 1, message = "El tamano debe ser >= 1.") @Max(value = 100, message = "El tamano maximo es 100.") int size) {
        if (jwt == null) {
            throw new org.springframework.security.authentication.BadCredentialsException(
                    "Autenticación requerida.");
        }
        UUID estudianteId = parseUserId(jwt);
        int sizeClamped = Math.max(1, Math.min(100, size));
        Pageable pageable = PageRequest.of(Math.max(0, page), sizeClamped,
                Sort.by("publicadoEn").descending());
        return ApiResponse.ok(cursoService.listarPublicados(estudianteId, q, pageable),
                "Cursos listados.");
    }

    /** Detalle por slug. Solo cursos publicados. */
    @GetMapping("/{slug}")
    public ApiResponse<CursoResponse> detalle(@AuthenticationPrincipal Jwt jwt,
                                              @PathVariable @Size(min = 1, max = 200) @Pattern(regexp = "^[a-z0-9]+(-[a-z0-9]+)*$", message = "Slug de curso invalido.") String slug) {
        if (jwt == null) {
            throw new org.springframework.security.authentication.BadCredentialsException(
                    "Autenticación requerida.");
        }
        return ApiResponse.ok(cursoService.detallePorSlug(parseUserId(jwt), slug), "Curso cargado.");
    }

    private UUID parseUserId(Jwt jwt) {
        try {
            return UUID.fromString(jwt.getClaimAsString("sub"));
        } catch (IllegalArgumentException e) {
            throw new org.springframework.security.authentication.BadCredentialsException(
                    "El token no incluye un identificador de usuario válido.");
        }
    }
}
