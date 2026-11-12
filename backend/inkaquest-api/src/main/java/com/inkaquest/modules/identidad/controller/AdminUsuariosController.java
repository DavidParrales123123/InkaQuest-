package com.inkaquest.modules.identidad.controller;

import com.inkaquest.modules.identidad.dto.PerfilResponse;
import com.inkaquest.modules.identidad.dto.SolicitudDocenteResponse;
import com.inkaquest.modules.identidad.service.AdminUsuariosService;
import com.inkaquest.shared.enums.EstadoSolicitudDocente;
import com.inkaquest.shared.enums.RolUsuario;
import com.inkaquest.shared.response.ApiResponse;
import com.inkaquest.shared.security.RequireRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

/**
 * Endpoints de administracion de usuarios (secciones 11 y 12).
 * Solo administrador.
 */
@RestController
@RequestMapping("/api/v1/admin")
@RequireRole(RolUsuario.administrador)
@Validated
public class AdminUsuariosController {

    private final AdminUsuariosService adminService;

    public AdminUsuariosController(AdminUsuariosService adminService) {
        this.adminService = adminService;
    }

    private static Pageable pagina(int page, int size) {
        int s = Math.max(1, Math.min(100, size));
        return PageRequest.of(Math.max(0, page), s, Sort.by("creadoEn").descending());
    }

    private static UUID authId(Jwt jwt) {
        try {
            return UUID.fromString(jwt.getClaimAsString("sub"));
        } catch (IllegalArgumentException e) {
            throw new org.springframework.security.authentication.BadCredentialsException(
                    "El token no incluye un sub valido.");
        }
    }

    /** GET /api/v1/admin/usuarios?rol=estudiante|docente|administrador&q=&page=&size= */
    @GetMapping("/usuarios")
    public ApiResponse<Page<PerfilResponse>> listar(@AuthenticationPrincipal Jwt jwt,
                                                   @RequestParam RolUsuario rol,
                                                   @RequestParam(defaultValue = "") @Size(max = 200, message = "La busqueda no puede superar 200 caracteres.") String q,
                                                   @RequestParam(defaultValue = "0") @Min(value = 0, message = "La pagina debe ser >= 0.") int page,
                                                   @RequestParam(defaultValue = "20") @Min(value = 1, message = "El tamano debe ser >= 1.") @Max(value = 100, message = "El tamano maximo es 100.") int size) {
        return ApiResponse.ok(adminService.listarPorRol(authId(jwt), rol, q, pagina(page, size)),
                "Usuarios listados.");
    }

    /** GET /api/v1/admin/usuarios/{id} */
    @GetMapping("/usuarios/{id}")
    public ApiResponse<PerfilResponse> detalle(@AuthenticationPrincipal Jwt jwt,
                                               @PathVariable UUID id) {
        return ApiResponse.ok(adminService.detalle(authId(jwt), id), "Usuario cargado.");
    }

    /** POST /api/v1/admin/usuarios/{id}/estado-cuenta?estado=activo|suspendido — cambiar estado. */
    @PostMapping("/usuarios/{id}/estado-cuenta")
    public ApiResponse<PerfilResponse> cambiarEstadoCuenta(@AuthenticationPrincipal Jwt jwt,
                                                           @PathVariable UUID id,
                                                           @RequestParam com.inkaquest.shared.enums.EstadoCuenta estado) {
        return ApiResponse.ok(adminService.cambiarEstadoCuenta(authId(jwt), id, estado),
                "Estado de la cuenta actualizado.");
    }

    /** GET /api/v1/admin/solicitudes-docente?estado=pendiente|en_revision|aprobada|rechazada */
    @GetMapping("/solicitudes-docente")
    public ApiResponse<List<SolicitudDocenteResponse>> solicitudes(@AuthenticationPrincipal Jwt jwt,
                                                                   @RequestParam EstadoSolicitudDocente estado) {
        return ApiResponse.ok(adminService.solicitudesPorEstado(authId(jwt), estado),
                "Solicitudes cargadas.");
    }
}
