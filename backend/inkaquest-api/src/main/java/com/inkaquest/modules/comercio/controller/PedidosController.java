package com.inkaquest.modules.comercio.controller;

import com.inkaquest.modules.comercio.dto.PedidoIniciarRequest;
import com.inkaquest.modules.comercio.dto.PedidoResponse;
import com.inkaquest.modules.comercio.service.CulqiWebhookService;
import com.inkaquest.modules.comercio.service.PedidosService;
import com.inkaquest.shared.response.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

/**
 * Endpoints de pedidos y webhooks de pago.
 */
@RestController
@RequestMapping("/api/v1")
@Validated
public class PedidosController {

    private final PedidosService pedidosService;
    private final CulqiWebhookService culqiWebhookService;

    public PedidosController(PedidosService pedidosService,
                             CulqiWebhookService culqiWebhookService) {
        this.pedidosService = pedidosService;
        this.culqiWebhookService = culqiWebhookService;
    }

    private static UUID authId(Jwt jwt) {
        try {
            return UUID.fromString(jwt.getClaimAsString("sub"));
        } catch (IllegalArgumentException e) {
            throw new org.springframework.security.authentication.BadCredentialsException(
                    "El token no incluye un sub valido.");
        }
    }

    /** POST /api/v1/pedidos/iniciar — inicia la compra de un curso. */
    @PostMapping("/pedidos/iniciar")
    public ApiResponse<PedidoResponse> iniciarCompra(@AuthenticationPrincipal Jwt jwt,
                                                     @Valid @RequestBody PedidoIniciarRequest request) {
        return ApiResponse.ok(pedidosService.iniciarCompra(authId(jwt), request),
                "Pedido registrado. Completa el pago para confirmar la matricula.");
    }

    /** GET /api/v1/pedidos/yo — mis pedidos. */
    @GetMapping("/pedidos/yo")
    public ApiResponse<List<PedidoResponse>> misPedidos(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.ok(pedidosService.misPedidos(authId(jwt)), "Pedidos cargados.");
    }

    /** GET /api/v1/pedidos/{numero} — detalle de un pedido (propietario o admin). */
    @GetMapping("/pedidos/{numero}")
    public ApiResponse<PedidoResponse> detalle(@AuthenticationPrincipal Jwt jwt,
                                               @PathVariable @Size(min = 6, max = 60) @Pattern(regexp = "^[A-Za-z0-9-]+$", message = "Numero de pedido invalido.") String numero) {
        return ApiResponse.ok(pedidosService.detalle(authId(jwt), numero), "Pedido cargado.");
    }

    /**
     * POST /api/v1/webhooks/culqi — recibe eventos de Culqi.
     * Público: el identificador del evento se verifica contra la API autenticada
     * de Culqi y el cargo se vuelve a consultar antes de confirmar (nunca JWT).
     */
    @PostMapping(value = "/webhooks/culqi", consumes = {MediaType.APPLICATION_JSON_VALUE, MediaType.TEXT_PLAIN_VALUE, MediaType.ALL_VALUE})
    public ResponseEntity<ApiResponse<CulqiWebhookService.WebhookResultado>> webhookCulqi(
            @RequestBody byte[] rawBody) {
        String raw = new String(rawBody, java.nio.charset.StandardCharsets.UTF_8);
        CulqiWebhookService.WebhookResultado resultado = culqiWebhookService.procesar(raw);
        return ResponseEntity.ok(ApiResponse.ok(resultado, "Webhook verificado y procesado."));
    }
}
