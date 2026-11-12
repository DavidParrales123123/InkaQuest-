package com.inkaquest.modules.comercio.controller;

import com.inkaquest.modules.comercio.dto.CuponCrearRequest;
import com.inkaquest.modules.comercio.dto.CuponValidacionResponse;
import com.inkaquest.modules.comercio.service.CuponesService;
import com.inkaquest.shared.enums.RolUsuario;
import com.inkaquest.shared.response.ApiResponse;
import com.inkaquest.shared.security.RequireRole;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Endpoints de cupones y promociones (seccion cupones).
 */
@RestController
@RequestMapping("/api/v1")
@Validated
public class CuponesController {

    private final CuponesService cuponesService;

    public CuponesController(CuponesService cuponesService) {
        this.cuponesService = cuponesService;
    }

    private static UUID authId(Jwt jwt) {
        try {
            return UUID.fromString(jwt.getClaimAsString("sub"));
        } catch (IllegalArgumentException e) {
            throw new org.springframework.security.authentication.BadCredentialsException(
                    "El token no incluye un sub valido.");
        }
    }

    /** GET /api/v1/cupones/validar?codigo=&subtotal= — valida cupon y calcula descuento. */
    @GetMapping("/cupones/validar")
    public ApiResponse<CuponValidacionResponse> validar(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam @NotBlank(message = "El codigo es obligatorio.") @Size(min = 2, max = 50, message = "El codigo debe tener entre 2 y 50 caracteres.") @Pattern(regexp = "^[A-Za-z0-9_-]+$", message = "El codigo solo admite letras, numeros, guion y guion bajo.") String codigo,
            @RequestParam @NotNull @DecimalMin("0.0") BigDecimal subtotal) {
        return ApiResponse.ok(cuponesService.validar(authId(jwt), codigo, subtotal),
                "Cupon validado.");
    }

    /** GET /api/v1/admin/cupones — lista administrativa. */
    @RequireRole(RolUsuario.administrador)
    @GetMapping("/admin/cupones")
    public ApiResponse<List<CuponCrearRequest.CuponResponse>> listar(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.ok(cuponesService.listar(authId(jwt)), "Cupones cargados.");
    }

    /** POST /api/v1/admin/cupones — crea cupon. */
    @RequireRole(RolUsuario.administrador)
    @PostMapping("/admin/cupones")
    public ApiResponse<CuponCrearRequest.CuponResponse> crear(@AuthenticationPrincipal Jwt jwt,
                                                               @Valid @RequestBody CuponCrearRequest request) {
        return ApiResponse.ok(cuponesService.crear(authId(jwt), request), "Cupon creado.");
    }

    /** POST /api/v1/admin/cupones/{id}/estado?activo= — activa/desactiva. */
    @RequireRole(RolUsuario.administrador)
    @PostMapping("/admin/cupones/{id}/estado")
    public ApiResponse<CuponCrearRequest.CuponResponse> cambiarEstado(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id,
            @RequestParam boolean activo) {
        return ApiResponse.ok(cuponesService.cambiarEstado(authId(jwt), id, activo),
                activo ? "Cupon activado." : "Cupon desactivado.");
    }
}
