package com.inkaquest.modules.identidad.controller;

import com.inkaquest.modules.identidad.dto.PerfilActualizacionRequest;
import com.inkaquest.modules.identidad.dto.PerfilResponse;
import com.inkaquest.modules.identidad.dto.SolicitudDocenteRequest;
import com.inkaquest.modules.identidad.dto.SolicitudDocenteResponse;
import com.inkaquest.modules.identidad.dto.SolicitudDocenteRevisionRequest;
import com.inkaquest.modules.identidad.service.PerfilService;
import com.inkaquest.modules.identidad.service.SolicitudDocenteService;
import com.inkaquest.shared.response.ApiResponse;
import com.inkaquest.shared.security.RequireRole;
import com.inkaquest.shared.enums.RolUsuario;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.validation.annotation.Validated;

import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Endpoints de identidad del usuario autenticado.
 */
@RestController
@RequestMapping("/api/v1")
@Validated
public class PerfilController {

    private final PerfilService perfilService;
    private final SolicitudDocenteService solicitudService;

    public PerfilController(PerfilService perfilService, SolicitudDocenteService solicitudService) {
        this.perfilService = perfilService;
        this.solicitudService = solicitudService;
    }

    /** GET /api/v1/usuarios/yo — perfil visible al usuario propietario. */
    @GetMapping("/usuarios/yo")
    public ApiResponse<PerfilResponse> yo(@AuthenticationPrincipal Jwt jwt) {
        boolean correoConfirmado = jwt.getClaimAsString("email_confirmed_at") != null
                || jwt.getClaim("emails_confirmed_at") != null;
        return ApiResponse.ok(perfilService.obtenerPerfilDe(authId(jwt), correoConfirmado),
                "Perfil cargado.");
    }

    /** POST /api/v1/usuarios/asegurar — crea el perfil si no existe (idempotente). */
    @PostMapping("/usuarios/asegurar")
    public ApiResponse<PerfilResponse> asegurar(@AuthenticationPrincipal Jwt jwt,
                                                @RequestBody(required = false) Map<String, String> body) {
        String email = jwt.getClaimAsString("email");
        Object meta = jwt.getClaimAsMap("user_metadata");
        String nombre = null;
        if (meta instanceof Map<?, ?> metadata) {
            Object fullName = metadata.get("full_name");
            nombre = fullName != null ? fullName.toString() : null;
        }
        if (body != null && body.get("nombre") != null && !body.get("nombre").isBlank()) {
            nombre = body.get("nombre").trim();
        }
        return ApiResponse.ok(perfilService.asegurarPerfilDe(authId(jwt), email, nombre),
                "Perfil asegurado.");
    }

    /** PUT /api/v1/usuarios/yo — actualiza el perfil del usuario autenticado. */
    @PutMapping("/usuarios/yo")
    public ApiResponse<PerfilResponse> actualizarYo(@AuthenticationPrincipal Jwt jwt,
                                                    @Valid @RequestBody PerfilActualizacionRequest request) {
        return ApiResponse.ok(perfilService.actualizarPerfilDe(authId(jwt), request), "Perfil actualizado.");
    }

    /** POST /api/v1/usuarios/yo/solicitud-docente — solicita cambio a docente. */
    @PostMapping("/usuarios/yo/solicitud-docente")
    public ApiResponse<SolicitudDocenteResponse> solicitarDocente(@AuthenticationPrincipal Jwt jwt,
                                                                   @Valid @RequestBody SolicitudDocenteRequest request) {
        return ApiResponse.ok(solicitudService.crear(authId(jwt), request),
                "Solicitud de docente registrada. Un administrador la revisará pronto.");
    }

    /** GET /api/v1/usuarios/yo/solicitud-docente — mis solicitudes. */
    @GetMapping("/usuarios/yo/solicitud-docente")
    public ApiResponse<List<SolicitudDocenteResponse>> misSolicitudes(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.ok(solicitudService.misSolicitudes(authId(jwt)), "Solicitudes cargadas.");
    }

    /** GET /api/v1/admin/solicitud-docente — solicitudes pendientes (admin). */
    @RequireRole(RolUsuario.administrador)
    @GetMapping("/admin/solicitud-docente")
    public ApiResponse<List<SolicitudDocenteResponse>> solicitudesPendientes(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.ok(solicitudService.listarPendientes(), "Solicitudes pendientes cargadas.");
    }

    /** POST /api/v1/admin/solicitud-docente/{id}/aprobar — aprueba solicitud. */
    @RequireRole(RolUsuario.administrador)
    @PostMapping("/admin/solicitud-docente/{id}/aprobar")
    public ApiResponse<SolicitudDocenteResponse> aprobar(@AuthenticationPrincipal Jwt jwt,
                                                         @PathVariable UUID id,
                                                         @Valid @RequestBody SolicitudDocenteRevisionRequest request) {
        return ApiResponse.ok(solicitudService.aprobar(authId(jwt), id, request),
                "Solicitud aprobada. El usuario ya es docente.");
    }

    /** POST /api/v1/admin/solicitud-docente/{id}/rechazar — rechaza solicitud. */
    @RequireRole(RolUsuario.administrador)
    @PostMapping("/admin/solicitud-docente/{id}/rechazar")
    public ApiResponse<SolicitudDocenteResponse> rechazar(@AuthenticationPrincipal Jwt jwt,
                                                          @PathVariable UUID id,
                                                          @Valid @RequestBody SolicitudDocenteRevisionRequest request) {
        return ApiResponse.ok(solicitudService.rechazar(authId(jwt), id, request),
                "Solicitud rechazada.");
    }

    private static UUID authId(Jwt jwt) {
        try {
            return UUID.fromString(jwt.getClaimAsString("sub"));
        } catch (IllegalArgumentException e) {
            throw new org.springframework.security.authentication.BadCredentialsException(
                    "El token no incluye un sub válido.");
        }
    }
}
