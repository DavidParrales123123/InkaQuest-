package com.inkaquest.modules.comercio.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.inkaquest.modules.academico.entity.Curso;
import com.inkaquest.modules.comercio.entity.*;
import com.inkaquest.modules.comercio.repository.*;
import com.inkaquest.modules.identidad.entity.Perfil;
import com.inkaquest.modules.matriculas.entity.Matricula;
import com.inkaquest.modules.matriculas.repository.MatriculaRepository;
import com.inkaquest.shared.enums.*;
import com.inkaquest.shared.exception.BadRequestException;
import com.inkaquest.shared.exception.ResourceNotFoundException;
import com.inkaquest.shared.exception.ServiceUnavailableException;
import com.inkaquest.shared.security.RlsExecutor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Procesa notificaciones Culqi de forma idempotente.
 *
 * La documentación pública de Culqi describe el webhook como un evento con
 * ID y tipo, pero no define un header HMAC estándar. Por ello no se inventa
 * una firma: el servidor verifica el ID consultando /events/{id} con la llave
 * privada del comercio y luego consulta el cargo en /charges/{id}. Solo se
 * confirma si coinciden pedido, importe, moneda y estado de captura.
 */
@Service
public class CulqiWebhookService {
    private static final Logger log = LoggerFactory.getLogger(CulqiWebhookService.class);
    private static final String EVENTO_EXITO = "charge.creation.succeeded";

    private final CulqiClient culqiClient;
    private final WebhookPagoRepository webhookPagoRepository;
    private final PedidoRepository pedidoRepository;
    private final DetallePedidoRepository detallePedidoRepository;
    private final TransaccionRepository transaccionRepository;
    private final CuponRepository cuponRepository;
    private final MatriculaRepository matriculaRepository;
    private final RlsExecutor rlsExecutor;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public CulqiWebhookService(CulqiClient culqiClient,
                               WebhookPagoRepository webhookPagoRepository,
                               PedidoRepository pedidoRepository,
                               DetallePedidoRepository detallePedidoRepository,
                               TransaccionRepository transaccionRepository,
                               CuponRepository cuponRepository,
                               MatriculaRepository matriculaRepository,
                               RlsExecutor rlsExecutor) {
        this.culqiClient = culqiClient;
        this.webhookPagoRepository = webhookPagoRepository;
        this.pedidoRepository = pedidoRepository;
        this.detallePedidoRepository = detallePedidoRepository;
        this.transaccionRepository = transaccionRepository;
        this.cuponRepository = cuponRepository;
        this.matriculaRepository = matriculaRepository;
        this.rlsExecutor = rlsExecutor;
    }

    public record WebhookResultado(boolean duplicado, boolean procesado, String detalle) { }

    public WebhookResultado procesar(String rawBody) {
        if (!culqiClient.configurado()) {
            throw new ServiceUnavailableException("La verificación de webhooks de Culqi no está configurada.");
        }

        JsonNode payload;
        try {
            payload = objectMapper.readTree(rawBody);
        } catch (Exception ex) {
            throw new BadRequestException("El webhook no contiene JSON válido.");
        }

        String eventoId = payload.path("id").asText(null);
        String tipoEvento = payload.path("type").asText(null);
        if (eventoId == null || !eventoId.matches("^[A-Za-z0-9_-]{8,80}$") ||
                tipoEvento == null || tipoEvento.isBlank()) {
            throw new BadRequestException("El webhook no contiene un identificador y tipo de evento válidos.");
        }

        Optional<WebhookPago> existente = rlsExecutor.executeAsSystem(() -> webhookPagoRepository.findByEventoId(eventoId));
        if (existente.isPresent() && Boolean.TRUE.equals(existente.get().getProcesado())) {
            return new WebhookResultado(true, true, "Evento ya procesado anteriormente.");
        }

        // Verificación de autenticidad con la API oficial autenticada de Culqi.
        JsonNode eventoOficial;
        try {
            eventoOficial = culqiClient.consultarEvento(eventoId);
        } catch (RuntimeException ex) {
            throw new ServiceUnavailableException("No se pudo verificar el evento directamente con Culqi.");
        }
        if (!eventoId.equals(eventoOficial.path("id").asText(null)) ||
                !tipoEvento.equals(eventoOficial.path("type").asText(null))) {
            throw new BadRequestException("El evento recibido no coincide con el evento registrado en Culqi.");
        }

        JsonNode data = nodoData(eventoOficial.path("data"));
        if (!EVENTO_EXITO.equals(tipoEvento)) {
            guardarEvento(eventoId, tipoEvento, rawBody, true,
                    "Evento válido de Culqi, sin acción de confirmación.");
            return new WebhookResultado(false, true, "Evento registrado; no requiere confirmar una compra.");
        }

        String cargoId = data.path("id").asText(null);
        String numeroPedido = data.path("metadata").path("numero_pedido").asText(null);
        if (cargoId == null || numeroPedido == null || numeroPedido.isBlank()) {
            throw new BadRequestException("El evento de cargo no contiene el identificador o número de pedido.");
        }

        JsonNode cargo;
        try {
            cargo = culqiClient.consultarCargo(cargoId);
        } catch (RuntimeException ex) {
            throw new ServiceUnavailableException("No se pudo verificar el cargo directamente con Culqi.");
        }
        if (!cargoId.equals(cargo.path("id").asText(null)) ||
                !numeroPedido.equals(cargo.path("metadata").path("numero_pedido").asText(null)) ||
                !cargo.path("capture").asBoolean(false)) {
            throw new BadRequestException("El cargo no coincide con el pedido o todavía no está capturado.");
        }

        final String eventoIdFinal = eventoId;
        final String tipoEventoFinal = tipoEvento;
        final String cargoIdFinal = cargoId;
        final String numeroPedidoFinal = numeroPedido;
        rlsExecutor.executeAsSystem(() -> {
            Pedido pedido = pedidoRepository.findByNumero(numeroPedidoFinal)
                    .orElseThrow(() -> new ResourceNotFoundException("Pedido no encontrado."));
            long montoEsperado = pedido.getTotal().multiply(BigDecimal.valueOf(100))
                    .setScale(0, java.math.RoundingMode.HALF_UP).longValueExact();
            if (cargo.path("amount").asLong(-1) != montoEsperado ||
                    !pedido.getMoneda().equalsIgnoreCase(cargo.path("currency_code").asText(""))) {
                throw new BadRequestException("El importe o moneda del cargo no coincide con el pedido.");
            }

            WebhookPago webhook = obtenerOGuardarEvento(eventoIdFinal, tipoEventoFinal, rawBody);
            if (pedido.getEstado() == EstadoPedido.pagado) {
                webhook.setProcesado(true);
                webhook.setProcesadoEn(Instant.now());
                webhookPagoRepository.save(webhook);
                return null;
            }

            Transaccion transaccion = transaccionRepository.findDePedido(pedido.getId())
                    .stream().findFirst()
                    .orElseThrow(() -> new ResourceNotFoundException("Transacción del pedido no encontrada."));
            transaccion.setEstado(EstadoPago.capturado);
            transaccion.setReferencia(cargoIdFinal);
            transaccion.setCapturadoEn(Instant.now());
            transaccionRepository.save(transaccion);

            pedido.setEstado(EstadoPedido.pagado);
            pedidoRepository.save(pedido);
            if (pedido.getCuponId() != null) {
                cuponRepository.incrementarUso(pedido.getCuponId().getId());
            }
            activarMatricula(pedido);

            webhook.setTransaccionId(transaccion);
            webhook.setProcesado(true);
            webhook.setProcesadoEn(Instant.now());
            webhook.setError(null);
            webhookPagoRepository.save(webhook);
            return null;
        });

        return new WebhookResultado(false, true, "Pago confirmado. Pedido " + numeroPedido + " marcado como pagado.");
    }

    private JsonNode nodoData(JsonNode data) {
        if (data == null || data.isMissingNode() || data.isNull()) {
            throw new BadRequestException("El evento no contiene el objeto data.");
        }
        if (data.isTextual()) {
            try {
                return objectMapper.readTree(data.asText());
            } catch (Exception ex) {
                throw new BadRequestException("El campo data del evento no contiene JSON válido.");
            }
        }
        return data;
    }

    private WebhookPago obtenerOGuardarEvento(String eventoId, String tipo, String rawBody) {
        return webhookPagoRepository.findByEventoId(eventoId).orElseGet(() -> {
            WebhookPago nuevo = new WebhookPago();
            nuevo.setEventoId(eventoId);
            nuevo.setTipoEvento(tipo);
            nuevo.setProveedor("culqi");
            try {
                nuevo.setPayload(objectMapper.readValue(rawBody, Map.class));
            } catch (Exception ex) {
                nuevo.setPayload(Map.of("payload", "no-disponible"));
            }
            nuevo.setRecibidoEn(Instant.now());
            nuevo.setProcesado(false);
            return webhookPagoRepository.save(nuevo);
        });
    }

    private void guardarEvento(String eventoId, String tipo, String rawBody,
                               boolean procesado, String detalle) {
        rlsExecutor.executeAsSystem(() -> {
            WebhookPago webhook = obtenerOGuardarEvento(eventoId, tipo, rawBody);
            webhook.setProcesado(procesado);
            webhook.setProcesadoEn(procesado ? Instant.now() : null);
            webhook.setError(detalle);
            webhookPagoRepository.save(webhook);
            return null;
        });
    }

    // ---------- interno ----------

    private void activarMatricula(Pedido pedido) {
        List<DetallePedido> lineas = detallePedidoRepository.findDePedido(pedido.getId());
        if (lineas.isEmpty()) {
            return;
        }
        Perfil estudiante = pedido.getUsuarioId();
        Curso curso = lineas.get(0).getCursoId();
        if (estudiante == null || curso == null) {
            return;
        }
        Matricula matricula = matriculaRepository.findByEstudianteIdAndCursoId(estudiante, curso)
                .orElse(null);
        Instant ahora = Instant.now();
        if (matricula == null) {
            matricula = new Matricula();
            matricula.setEstudianteId(estudiante);
            matricula.setCursoId(curso);
            matricula.setEstado(EstadoMatricula.activa);
            matricula.setPrecioPagado(pedido.getTotal());
            matricula.setMoneda(pedido.getMoneda());
            matricula.setPorcentajeProgreso(java.math.BigDecimal.ZERO);
            matricula.setXpGanado(0);
            matricula.setMatriculadoEn(ahora);
            matriculaRepository.save(matricula);
            log.info("Matricula creada para {} en curso {} tras pago {}", estudiante.getId(), curso.getId(), pedido.getNumero());
            return;
        }
        matricula.setEstado(EstadoMatricula.activa);
        matricula.setPrecioPagado(pedido.getTotal());
        matricula.setMoneda(pedido.getMoneda());
        matricula.setMatriculadoEn(ahora);
        matricula.setCanceladoEn(null);
        matricula.setCompletadoEn(null);
        matriculaRepository.save(matricula);
        log.info("Matricula {} reactivada tras pago {}", matricula.getId(), pedido.getNumero());
    }

}
