package com.inkaquest.modules.comercio.controller;

import com.inkaquest.modules.comercio.dto.ConfiguracionPagoResponse;
import com.inkaquest.modules.comercio.dto.GuardarTarjetaRequest;
import com.inkaquest.modules.comercio.dto.TarjetaGuardadaResponse;
import com.inkaquest.modules.comercio.service.TarjetasService;
import com.inkaquest.shared.response.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/** Configuración pública y métodos de pago guardados del estudiante. */
@RestController
@RequestMapping("/api/v1/pagos")
public class PagosController {

    private final TarjetasService tarjetas;

    public PagosController(TarjetasService tarjetas) {
        this.tarjetas = tarjetas;
    }

    private static UUID authId(Jwt jwt) {
        try {
            return UUID.fromString(jwt.getClaimAsString("sub"));
        } catch (IllegalArgumentException e) {
            throw new org.springframework.security.authentication.BadCredentialsException(
                    "El token no incluye un sub valido.");
        }
    }

    /** Configuración necesaria para tokenizar con Culqi.js (puede llamarse sin sesión). */
    @GetMapping("/configuracion")
    public ApiResponse<ConfiguracionPagoResponse> configuracion() {
        return ApiResponse.ok(tarjetas.configuracion(), "Configuración de pagos.");
    }

    @GetMapping("/tarjetas")
    public ApiResponse<List<TarjetaGuardadaResponse>> listar(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.ok(tarjetas.listar(authId(jwt)), "Tarjetas guardadas.");
    }

    /** Guarda la tarjeta en el vault de Culqi; solo llega el token, nunca PAN/CVV. */
    @PostMapping("/tarjetas")
    public ApiResponse<TarjetaGuardadaResponse> guardar(@AuthenticationPrincipal Jwt jwt,
                                                        @Valid @RequestBody GuardarTarjetaRequest request) {
        return ApiResponse.ok(tarjetas.guardar(authId(jwt), request), "Tarjeta guardada de forma segura.");
    }

    @DeleteMapping("/tarjetas/{id}")
    public ApiResponse<Void> eliminar(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        tarjetas.eliminar(authId(jwt), id);
        return ApiResponse.ok(null, "Tarjeta eliminada.");
    }
}
