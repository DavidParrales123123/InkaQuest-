package com.inkaquest.modules.auditoria.controller;

import com.inkaquest.modules.auditoria.dto.AuditoriaResponse;
import com.inkaquest.modules.auditoria.repository.RegistroAccionRepository;
import com.inkaquest.shared.enums.RolUsuario;
import com.inkaquest.shared.enums.TipoAccion;
import com.inkaquest.shared.response.ApiResponse;
import com.inkaquest.shared.security.RequireRole;
import com.inkaquest.shared.security.RlsExecutor;
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

import java.util.UUID;

/**
 * Consulta del registro de auditoria (solo administrador).
 * La escritura solo puede hacerse con {@code AuditoriaService} desde el backend.
 */
@RestController
@RequestMapping("/api/v1/admin/auditoria")
@RequireRole(RolUsuario.administrador)
@Validated
public class AdminAuditoriaController {

    private final RegistroAccionRepository registroAccionRepository;
    private final RlsExecutor rlsExecutor;

    public AdminAuditoriaController(RegistroAccionRepository registroAccionRepository,
                                    RlsExecutor rlsExecutor) {
        this.registroAccionRepository = registroAccionRepository;
        this.rlsExecutor = rlsExecutor;
    }

    private static UUID authId(Jwt jwt) {
        try {
            return UUID.fromString(jwt.getClaimAsString("sub"));
        } catch (IllegalArgumentException e) {
            throw new org.springframework.security.authentication.BadCredentialsException(
                    "El token no incluye un sub valido.");
        }
    }

    /** GET /api/v1/admin/auditoria?entidad=&accion=&page=&size= */
    @GetMapping
    public ApiResponse<Page<AuditoriaResponse>> lista(@AuthenticationPrincipal Jwt jwt,
                                                      @RequestParam(required = false) @Size(max = 60, message = "El tipo de entidad no puede superar 60 caracteres.") String entidad,
                                                      @RequestParam(required = false) TipoAccion accion,
                                                      @RequestParam(defaultValue = "0") @Min(value = 0, message = "La pagina debe ser >= 0.") int page,
                                                      @RequestParam(defaultValue = "20") @Min(value = 1, message = "El tamano debe ser >= 1.") @Max(value = 100, message = "El tamano maximo es 100.") int size) {
        UUID actorId = authId(jwt);
        Pageable pageable = PageRequest.of(Math.max(0, page),
                Math.max(1, Math.min(100, size)), Sort.by("creadoEn").descending());
        Page<AuditoriaResponse> resultado = rlsExecutor.executeAsSystem(() ->
                registroAccionRepository.buscar(
                        (entidad == null || entidad.isBlank()) ? null : entidad.trim(),
                        accion, pageable).map(AuditoriaResponse::from));
        return ApiResponse.ok(resultado, "Auditoría cargada.");
    }
}
