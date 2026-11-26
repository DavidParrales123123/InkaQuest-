package com.inkaquest.modules.comercio.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;

/**
 * Cliente HTTP del proveedor Culqi (api.culqi.com).
 *
 * <p><b>Estado.</b> Si no hay {@code culqi.api-key} configurada, el metodo
 * {@link #crearCobro} nunca se ejecuta (el flujo de orden lo evita). Si si,
 * llama a la API real de Culqi v2 con el token que genera Culqi.js en el
 * frontend. El resultado SOLO mueve estado cuando llega el webhook: la
 * confirmacion nunca depende de la respuesta visual del navegador.</p>
 *
 * <p>Este cliente no contiene PAN ni CVV: solo recibe el token emitido por
 * el cliente (Culqi Checkout) y lo canjea por un cargo.</p>
 */
@Service
public class CulqiClient {

    private static final Duration TIMEOUT = Duration.ofSeconds(15);

    private final CulqiConfig config;
    private final ObjectMapper objectMapper;
    private final HttpClient http;

    public CulqiClient(CulqiConfig config) {
        this.config = config;
        this.objectMapper = new ObjectMapper();
        this.http = HttpClient.newBuilder().connectTimeout(TIMEOUT).build();
    }

    /** Estado de la configuracion (para exponer al frontend). */
    public boolean configurado() {
        return config.configurado();
    }

    /**
     * Crea un cargo Culqi con el token emitido por Culqi.js.
     *
     * @param montoCentavos total en centavos (unidad mas pequeña)
     * @param monedaCodigo  alfa-3, p. ej. "PEN"
     * @param email         email del comprador
     * @param numeroPedido  metadata para correlacionar pedido con cargo
     * @param token         token emitido por Culqi.js
     * @return id del cargo devuelto por Culqi
     * @throws CulqiException si la API responde error
     */
    public String crearCobro(long montoCentavos, String monedaCodigo, String email,
                             String numeroPedido, String token) {
        if (!config.configurado()) {
            throw new IllegalStateException("Culqi no esta configurado en el servidor.");
        }
        Map<String, Object> body = Map.of(
                "amount", montoCentavos,
                "currency_code", monedaCodigo,
                "email", email,
                "capture", true,
                "source_id", token,
                "metadata", Map.of("numero_pedido", numeroPedido));
        JsonNode json;
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(config.getApiBase() + "/charges"))
                    .timeout(TIMEOUT)
                    .header("Authorization", "Bearer " + config.getApiKey())
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                    .build();
            HttpResponse<InputStream> response = http.send(request,
                    HttpResponse.BodyHandlers.ofInputStream());
            byte[] raw = response.body().readAllBytes();
            json = objectMapper.readTree(raw);
            if (response.statusCode() / 100 != 2) {
                String detalle = json.path("user_message").asText(json.path("merchant_message").asText(""));
                throw new CulqiException("Culqi rechazo el cobro (HTTP " + response.statusCode()
                        + "): " + detalle);
            }
            String id = json.path("id").asText(null);
            if (id == null || id.isBlank()) {
                throw new CulqiException("Culqi no devolvio un id de cargo.");
            }
            return id;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new CulqiException("Interrumpido al contactar con Culqi.");
        } catch (IOException e) {
            throw new CulqiException("No se pudo contactar con Culqi: " + e.getMessage());
        }
    }

    /**
     * Consulta un evento directamente en Culqi. Se utiliza para autenticar
     * webhooks: el ID recibido se contrasta con la API oficial mediante la
     * llave privada del comercio (la documentación pública no define un
     * header HMAC estándar para las notificaciones).
     */
    public JsonNode consultarEvento(String eventoId) {
        return consultarRecurso("/events/" + segmentoSeguro(eventoId));
    }

    /** Consulta un cargo para comprobar estado, importe, moneda y metadata. */
    public JsonNode consultarCargo(String cargoId) {
        return consultarRecurso("/charges/" + segmentoSeguro(cargoId));
    }

    private JsonNode consultarRecurso(String ruta) {
        if (!config.configurado()) {
            throw new IllegalStateException("Culqi no está configurado en el servidor.");
        }
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(config.getApiBase() + ruta))
                    .timeout(TIMEOUT)
                    .header("Authorization", "Bearer " + config.getApiKey())
                    .header("Accept", "application/json")
                    .GET()
                    .build();
            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
            JsonNode json = objectMapper.readTree(response.body());
            if (response.statusCode() / 100 != 2) {
                throw new CulqiException("No se pudo verificar el recurso en Culqi (HTTP "
                        + response.statusCode() + ").");
            }
            return json;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new CulqiException("Se interrumpió la verificación del evento en Culqi.");
        } catch (IOException e) {
            throw new CulqiException("No se pudo verificar el evento en Culqi.");
        }
    }

    private String segmentoSeguro(String valor) {
        if (valor == null || !valor.matches("^[A-Za-z0-9_-]{8,80}$")) {
            throw new CulqiException("Identificador de Culqi inválido.");
        }
        return valor;
    }

    /**
     * Crea un cliente (customer) en el vault de Culqi. El id se guarda en el
     * perfil; NUNCA se guardan datos de tarjeta en nuestra base de datos.
     */
    public String crearCustomer(String nombre, String apellido, String email, String telefono) {
        if (!config.configurado()) throw new IllegalStateException("Culqi no esta configurado.");
        String nombreLimpio = nombre == null || nombre.isBlank() ? "Cliente" : nombre.trim();
        String apellidoLimpio = apellido == null || apellido.isBlank() ? "InkaQuest" : apellido.trim();
        String telefonoLimpio = telefono == null || !telefono.matches("[0-9]{7,15}")
                ? "999999999" : telefono.trim();
        Map<String, Object> body = Map.of(
                "first_name", nombreLimpio,
                "last_name", apellidoLimpio,
                "email", email == null || email.isBlank() ? "cliente@inkaquest.local" : email.trim(),
                "address", "Lima",
                "address_city", "Lima",
                "country_code", "PE",
                "phone_number", telefonoLimpio);
        JsonNode json = post(config.getApiBase() + "/customers", config.getApiKey(), body, "crear cliente");
        String id = json.path("id").asText(null);
        if (id == null || id.isBlank()) throw new CulqiException("Culqi no devolvio id de cliente.");
        return id;
    }

    /** Asocia un token ya autenticado al customer y devuelve la tarjeta guardada. */
    public JsonNode crearTarjeta(String customerId, String tokenId) {
        if (!config.configurado()) throw new IllegalStateException("Culqi no esta configurado.");
        Map<String, Object> body = Map.of(
                "customer_id", segmentoSeguro(customerId),
                "token_id", segmentoSeguro(tokenId));
        return post(config.getApiBase() + "/cards", config.getApiKey(), body, "guardar tarjeta");
    }

    /** Elimina una tarjeta del vault de Culqi. */
    public void eliminarTarjeta(String cardId) {
        if (!config.configurado()) throw new IllegalStateException("Culqi no esta configurado.");
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(config.getApiBase() + "/cards/" + segmentoSeguro(cardId)))
                    .timeout(TIMEOUT)
                    .header("Authorization", "Bearer " + config.getApiKey())
                    .DELETE().build();
            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() / 100 != 2) {
                throw new CulqiException("Culqi rechazo la eliminacion (HTTP " + response.statusCode() + ").");
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new CulqiException("Interrumpido al eliminar la tarjeta.");
        } catch (IOException e) {
            throw new CulqiException("No se pudo eliminar la tarjeta: " + e.getMessage());
        }
    }

    /**
     * Confirma un cargo autenticado con 3DS en el host seguro (llave pública).
     * Se usa cuando el desafío 3DS se resolvió fuera del flujo de Culqi.js.
     */
    public JsonNode confirmar3DS(String tokenId, String usermail) {
        if (!config.configuradoPublica()) {
            throw new IllegalStateException("Culqi no tiene llave pública configurada.");
        }
        Map<String, Object> body = new java.util.HashMap<>();
        body.put("token_id", segmentoSeguro(tokenId));
        if (usermail != null && !usermail.isBlank()) body.put("usermail", usermail.trim());
        return post(config.getSecureBase() + "/confirm", config.getPublicKey(), body, "confirmar 3DS");
    }

    private JsonNode post(String url, String apiKey, Map<String, Object> body, String accion) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(TIMEOUT)
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                    .build();
            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
            JsonNode json = objectMapper.readTree(response.body());
            if (response.statusCode() / 100 != 2) {
                String detalle = json.path("user_message").asText(json.path("merchant_message").asText(""));
                throw new CulqiException("Culqi rechazo " + accion + " (HTTP " + response.statusCode()
                        + "): " + detalle);
            }
            return json;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new CulqiException("Interrumpido al " + accion + ".");
        } catch (IOException e) {
            throw new CulqiException("No se pudo " + accion + ": " + e.getMessage());
        }
    }

    /** Solicita un reembolso de un cargo ya capturado. */
    public String reembolso(String cargoId, long montoCentavos, String motivo) {
        if (!config.configurado()) {
            throw new IllegalStateException("Culqi no esta configurado en el servidor.");
        }
        String razon = motivo == null ? "solicitud_comprador" : motivo.trim().toLowerCase(java.util.Locale.ROOT);
        if (!java.util.Set.of("duplicado", "fraudulento", "solicitud_comprador").contains(razon)) {
            razon = "solicitud_comprador";
        }
        Map<String, Object> body = Map.of(
                "charge_id", segmentoSeguro(cargoId),
                "amount", montoCentavos,
                "reason", razon);
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(config.getApiBase() + "/refunds"))
                    .timeout(TIMEOUT)
                    .header("Authorization", "Bearer " + config.getApiKey())
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                    .build();
            HttpResponse<InputStream> response = http.send(request,
                    HttpResponse.BodyHandlers.ofInputStream());
            byte[] raw = response.body().readAllBytes();
            JsonNode json = objectMapper.readTree(raw);
            if (response.statusCode() / 100 != 2) {
                throw new CulqiException("Culqi rechazo el reembolso (HTTP " + response.statusCode() + ").");
            }
            return json.path("id").asText("");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new CulqiException("Interrumpido al contactar con Culqi.");
        } catch (IOException e) {
            throw new CulqiException("No se pudo contactar con Culqi: " + e.getMessage());
        }
    }

    /** Excepcion de comunicacion con Culqi (detalle nunca se filtra al frontend). */
    public static class CulqiException extends RuntimeException {
        public CulqiException(String mensaje) {
            super(mensaje);
        }
    }
}
