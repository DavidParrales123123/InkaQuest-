package com.inkaquest.modules.certificados.controller;

import com.inkaquest.modules.certificados.dto.CertificadoResponse;
import com.inkaquest.modules.certificados.service.CertificadosService;
import com.inkaquest.shared.response.ApiResponse;
import jakarta.validation.constraints.Size;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

/**
 * Endpoints de certificados.
 */
@RestController
@RequestMapping("/api/v1/certificados")
@Validated
public class CertificadosController {

    private final CertificadosService certificadosService;

    public CertificadosController(CertificadosService certificadosService) {
        this.certificadosService = certificadosService;
    }

    private static UUID authId(Jwt jwt) {
        try {
            return UUID.fromString(jwt.getClaimAsString("sub"));
        } catch (IllegalArgumentException e) {
            throw new org.springframework.security.authentication.BadCredentialsException(
                    "El token no incluye un sub valido.");
        }
    }

    /** POST /api/v1/certificados/cursos/{cursoSlug}/emitir — emite el certificado (curso completado). */
    @PostMapping("/cursos/{cursoSlug}/emitir")
    public ApiResponse<CertificadoResponse> emitir(@AuthenticationPrincipal Jwt jwt,
                                                   @PathVariable @Size(min = 1, max = 200) @Pattern(regexp = "^[a-z0-9]+(-[a-z0-9]+)*$", message = "Slug de curso invalido.") String cursoSlug) {
        return ApiResponse.ok(certificadosService.emitirParaCurso(authId(jwt), cursoSlug),
                "Certificado emitido.");
    }

    /** GET /api/v1/certificados/yo — mis certificados. */
    @GetMapping("/yo")
    public ApiResponse<List<CertificadoResponse>> yo(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.ok(certificadosService.misCertificados(authId(jwt)), "Certificados cargados.");
    }

    /**
     * GET /api/v1/certificados/verificar/{codigo} — verificacion PUBLICA.
     * Publico (sin JWT): revela solo datos suficientes para autenticar autenticidad.
     */
    @GetMapping("/verificar/{codigo}")
    public ApiResponse<CertificadoResponse> verificar(@PathVariable @NotBlank(message = "El codigo es obligatorio.") @Size(max = 64, message = "El codigo no puede superar 64 caracteres.") String codigo) {
        return ApiResponse.ok(certificadosService.verificar(codigo), "Certificado verificado.");
    }
}
