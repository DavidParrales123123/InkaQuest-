package com.inkaquest.modules.chatbot.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.inkaquest.modules.chatbot.dto.*;
import com.inkaquest.modules.chatbot.entity.ChatbotConversacion;
import com.inkaquest.modules.chatbot.entity.ChatbotMensaje;
import com.inkaquest.modules.chatbot.repository.ChatbotConversacionRepository;
import com.inkaquest.modules.chatbot.repository.ChatbotMensajeRepository;
import com.inkaquest.modules.identidad.entity.Perfil;
import com.inkaquest.modules.identidad.repository.PerfilRepository;
import com.inkaquest.shared.enums.EstadoConversacion;
import com.inkaquest.shared.enums.OrigenMensaje;
import com.inkaquest.shared.enums.RolChatbot;
import com.inkaquest.shared.exception.BadRequestException;
import com.inkaquest.shared.exception.ResourceNotFoundException;
import com.inkaquest.shared.exception.ServiceUnavailableException;
import com.inkaquest.shared.security.RlsExecutor;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.io.IOException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/** Logica del asistente: historial y propiedad siempre se resuelven en servidor. */
@Service
public class ChatbotService {
    private final ChatbotConversacionRepository conversaciones;
    private final ChatbotMensajeRepository mensajes;
    private final PerfilRepository perfiles;
    private final RlsExecutor rls;
    private final RestClient http;
    private final String apiKey;
    private final String apiUrl;
    private final String modelo;
    private final String visionModel;
    private final long maxMensajesDiarios;
    /** true = usar Gemini nativo con herramienta google_search (solo Gemini). */
    private final boolean searchEnabled;

    static final String SYSTEM_PROMPT =
            "Eres el asistente educativo de InkaQuest. Responde en espanol, con claridad y adapta las explicaciones al aprendizaje de programacion. Usa la busqueda web para datos actuales o inciertos y cita las fuentes (URLs) cuando sea posible. No afirmes haber ejecutado codigo ni acceder a datos que no se te hayan proporcionado. No compartas informacion privada de otros usuarios.";

    public ChatbotService(ChatbotConversacionRepository conversaciones,
                          ChatbotMensajeRepository mensajes,
                          PerfilRepository perfiles,
                          RlsExecutor rls,
                          RestClient.Builder builder,
                          @Value("${chatbot.api-key:}") String apiKey,
                          @Value("${chatbot.api-url:https://api.openai.com/v1/chat/completions}") String apiUrl,
                          @Value("${chatbot.model:gpt-4o-mini-search-preview}") String modelo,
                          @Value("${chatbot.vision-model:gpt-4o-mini-search-preview}") String visionModel,
                          @Value("${chatbot.max-mensajes-diarios:60}") long maxMensajesDiarios,
                          @Value("${chatbot.search-enabled:false}") boolean searchEnabled) {
        this.conversaciones = conversaciones;
        this.mensajes = mensajes;
        this.perfiles = perfiles;
        this.rls = rls;
        var factory = new org.springframework.http.client.SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10_000);
        factory.setReadTimeout(90_000);
        this.http = builder.requestFactory(factory).build();
        this.apiKey = apiKey;
        this.apiUrl = apiUrl;
        this.modelo = modelo;
        this.visionModel = visionModel;
        this.maxMensajesDiarios = maxMensajesDiarios;
        this.searchEnabled = searchEnabled;
    }

    public List<ChatbotConversacionResponse> listar(UUID usuarioId) {
        return rls.executeAs(usuarioId, () -> {
            Perfil perfil = perfil(usuarioId);
            return conversaciones.findAllByUsuarioId_IdOrderByActualizadoEnDesc(usuarioId)
                    .stream().filter(c -> c.getUsuarioId().getId().equals(perfil.getId()))
                    .map(ChatbotConversacionResponse::from).toList();
        });
    }

    public List<ChatbotMensajeResponse> listarMensajes(UUID usuarioId, UUID conversacionId) {
        return rls.executeAs(usuarioId, () -> {
            ChatbotConversacion conversacion = conversacionPropia(usuarioId, conversacionId);
            return mensajes.findAllByConversacionId_IdOrderByCreadoEnAsc(conversacion.getId())
                    .stream().filter(m -> !Boolean.TRUE.equals(m.getEsPrivado()))
                    .map(ChatbotMensajeResponse::from).toList();
        });
    }

    public ChatbotConversacionResponse crear(UUID usuarioId, CrearConversacionRequest request) {
        return rls.executeAs(usuarioId, () -> {
            Perfil perfil = perfil(usuarioId);
            ChatbotConversacion c = new ChatbotConversacion();
            c.setUsuarioId(perfil);
            c.setTitulo(request.titulo() == null || request.titulo().isBlank() ? "Nueva conversacion" : request.titulo().trim());
            c.setEstado(EstadoConversacion.abierta);
            c.setRolUsuario(perfil.getRol());
            c.setModelo(modelo);
            c.setTemperatura(new BigDecimal("0.70"));
            c.setMaxTokens(1000);
            c.setTokensTotales(0);
            c.setEscalado(false);
            return ChatbotConversacionResponse.from(conversaciones.save(c));
        });
    }

    public EnviarMensajeResponse enviar(UUID usuarioId, EnviarMensajeRequest request) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new ServiceUnavailableException("El asistente IA no esta configurado. Define CHATBOT_API_KEY en el backend.");
        }
        String contenido = request.contenido() == null ? "" : request.contenido().trim();
        List<AdjuntoRef> adjuntos = request.attachments() == null ? List.of() : request.attachments();
        if (adjuntos.size() > 3) {
            throw new BadRequestException("Máximo 3 adjuntos por mensaje.");
        }
        if (contenido.isEmpty() && adjuntos.isEmpty()) {
            throw new BadRequestException("Escribe un mensaje o adjunta un archivo.");
        }

        // Tope diario anti-abuso (por usuario, ventana de 24 h)
        Instant desde = Instant.now().minus(Duration.ofDays(1));
        if (mensajes.countByAutorId_IdAndCreadoEnAfter(usuarioId, desde) >= maxMensajesDiarios) {
            throw new BadRequestException("Límite diario alcanzado (" + maxMensajesDiarios + " mensajes en 24 h). Inténtalo mañana.");
        }

        UUID conversacionId = request.conversacionId();
        if (conversacionId == null) {
            ChatbotConversacionResponse creada = crear(usuarioId, new CrearConversacionRequest(null));
            conversacionId = creada.id();
        }
        final UUID id = conversacionId;
        ChatbotConversacion conversacion = rls.executeAs(usuarioId, () -> conversacionPropia(usuarioId, id));

        // Persistir mensaje del usuario (contenido + metadatos de adjuntos)
        Map<String, Object> datosAdjuntos = adjuntos.isEmpty()
                ? Map.of()
                : Map.of("adjuntos", adjuntos.stream()
                        .map(a -> Map.<String, Object>of(
                                "ruta", a.ruta() == null ? "" : a.ruta(),
                                "mime", a.mime() == null ? "" : a.mime(),
                                "nombre", a.nombre() == null ? "archivo" : a.nombre(),
                                "tamano", a.tamano() == null ? 0 : a.tamano()))
                        .toList());
        final String contenidoGuardado = contenido.isEmpty() && !adjuntos.isEmpty()
                ? "[adjunto: " + adjuntos.stream().map(a -> a.nombre() == null ? "archivo" : a.nombre()).reduce((a, b) -> a + ", " + b).orElse("archivo") + "]"
                : contenido;
        ChatbotMensaje mensajeUsuario = rls.executeAs(usuarioId, () -> {
            Perfil perfil = perfil(usuarioId);
            ChatbotMensaje m = new ChatbotMensaje();
            m.setConversacionId(conversacion);
            m.setAutorId(perfil);
            m.setRol(RolChatbot.usuario);
            m.setOrigen(OrigenMensaje.usuario);
            m.setContenido(contenidoGuardado);
            m.setTokensEntrada(0);
            m.setTokensSalida(0);
            m.setDatos(datosAdjuntos);
            m.setEsPrivado(false);
            return mensajes.save(m);
        });

        // Analizar adjuntos: extraer texto (PDF/txt) e imágenes en base64
        AdjuntoAnalisis analisis = analizarAdjuntos(adjuntos);
        boolean tieneImagen = !analisis.imagenes().isEmpty();
        String modeloAUsar = tieneImagen ? visionModel : modelo;

        // Construir mensajes para el proveedor (historial + turno actual)
        final List<Map<String, Object>> openaiMessages = construirContextoOpenAI(usuarioId, id, contenido, analisis);

        Instant inicio = Instant.now();
        AiResult aiInicial;
        if (this.searchEnabled && !tieneImagen) {
            try {
                aiInicial = consultarGeminiSearch(construirGeminiMessages(usuarioId, id, contenido, analisis));
            } catch (ServiceUnavailableException ex) {
                // Degradación elegante: si google_search agota cuota/error, el bot responde
                // con el modelo normal (sin search). Nunca se queda mudo para el estudiante.
                aiInicial = consultarProveedor(openaiMessages, modeloAUsar);
            }
        } else {
            aiInicial = consultarProveedor(openaiMessages, modeloAUsar);
        }
        final AiResult aiFinal = aiInicial;
        int latencia = (int) Math.min(Duration.between(inicio, Instant.now()).toMillis(), Integer.MAX_VALUE);
        ChatbotMensaje respuesta = rls.executeAs(usuarioId, () -> {
            ChatbotMensaje m = new ChatbotMensaje();
            m.setConversacionId(conversacion);
            m.setAutorId(null);
            m.setRol(RolChatbot.asistente);
            m.setOrigen(OrigenMensaje.asistente);
            m.setContenido(aiFinal.texto());
            m.setTokensEntrada(aiFinal.tokensEntrada());
            m.setTokensSalida(aiFinal.tokensSalida());
            m.setLatenciaMs(latencia);
            m.setModelo(modeloAUsar);
            m.setDatos(Map.of());
            m.setEsPrivado(false);
            ChatbotMensaje guardado = mensajes.save(m);
            ChatbotConversacion actual = conversacionPropia(usuarioId, id);
            actual.setTokensTotales((actual.getTokensTotales() == null ? 0 : actual.getTokensTotales()) + aiFinal.tokensEntrada() + aiFinal.tokensSalida());
            conversaciones.save(actual);
            return guardado;
        });
        return new EnviarMensajeResponse(
                rls.executeAs(usuarioId, () -> ChatbotConversacionResponse.from(conversacionPropia(usuarioId, id))),
                ChatbotMensajeResponse.from(mensajeUsuario), ChatbotMensajeResponse.from(respuesta));
    }

    /** Construye el array "contents" para generateContent de Gemini. */
    private List<Map<String, Object>> construirGeminiMessages(UUID usuarioId, UUID conversacionId,
                                                            String contenido, AdjuntoAnalisis analisis) {
        List<ChatbotMensaje> historial = rls.executeAs(usuarioId, () ->
                mensajes.findAllByConversacionId_IdOrderByCreadoEnAsc(conversacionId));
        List<Map<String, Object>> contents = new ArrayList<>();
        historial.stream()
                .filter(m -> m.getRol() == RolChatbot.usuario || m.getRol() == RolChatbot.asistente)
                .skip(Math.max(0, historial.size() - 10L))
                .forEach(m -> {
                    List<Map<String, Object>> parts = new ArrayList<>();
                    parts.add(Map.of("text", m.getContenido()));
                    contents.add(Map.of("role", m.getRol() == RolChatbot.usuario ? "user" : "model", "parts", parts));
                });
        StringBuilder texto = new StringBuilder(contenido == null ? "" : contenido);
        if (analisis.documentos() != null && !analisis.documentos().isBlank()) {
            if (texto.length() > 0) texto.append("\n\n");
            texto.append(analisis.documentos());
        }
        List<Map<String, Object>> parts = new ArrayList<>();
        parts.add(Map.of("text", texto.toString().isBlank() ? "Ayudame con este pedido." : texto.toString()));
        for (String url : analisis.imagenes()) {
            int comma = url.indexOf(',');
            if (comma < 0) continue;
            String meta = url.substring(0, comma); // data:image/png;base64
            String mime = meta.startsWith("data:") ? meta.substring(5).split(";")[0] : "image/png";
            parts.add(Map.of("inline_data", Map.of("mime_type", mime, "data", url.substring(comma + 1))));
        }
        contents.add(Map.of("role", "user", "parts", parts));
        return contents;
    }

    /** Llama a {@code generateContent} de Gemini con herramienta google_search. */
    private AiResult consultarGeminiSearch(List<Map<String, Object>> contents) {
        String modelPath = (modelo == null || modelo.isBlank()) ? "models/gemini-2.5-flash"
                : (modelo.startsWith("models/") ? modelo : "models/" + modelo);
        String endpoint = "https://generativelanguage.googleapis.com/v1beta/" + modelPath + ":generateContent?key=" + apiKey;
        Map<String, Object> body = Map.of(
                "contents", contents,
                "systemInstruction", Map.of("parts", List.of(Map.of("text", SYSTEM_PROMPT))),
                "tools", List.of(Map.of("google_search", Map.of())),
                "generationConfig", Map.of("temperature", 0.7, "maxOutputTokens", 900));
        try {
            JsonNode respuesta = http.post().uri(URI.create(endpoint)).contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve().body(JsonNode.class);
            StringBuilder texto = new StringBuilder();
            JsonNode parts = respuesta != null
                    ? respuesta.path("candidates").path(0).path("content").path("parts")
                    : null;
            if (parts != null && parts.isArray()) {
                for (JsonNode p : parts) {
                    String t = p.path("text").asText(null);
                    if (t != null) texto.append(t);
                }
            }
            if (texto.toString().isBlank()) {
                throw new ServiceUnavailableException("El proveedor IA no devolvio una respuesta valida.");
            }
            int tokensIn  = respuesta.path("usageMetadata").path("promptTokenCount").asInt(0);
            int tokensOut = respuesta.path("usageMetadata").path("candidatesTokenCount").asInt(0);
            return new AiResult(texto.toString(), tokensIn, tokensOut);
        } catch (RestClientException ex) {
            throw new ServiceUnavailableException(
                    "Gemini (google_search) no respondio. Detalle: " + extraerErrorProveedor(ex));
        }
    }

    private AiResult consultarProveedor(List<Map<String, Object>> mensajesIA, String modeloAUsar) {
        try {
            JsonNode respuesta = http.post().uri(apiUrl).contentType(MediaType.APPLICATION_JSON)
                    .header("Authorization", "Bearer " + apiKey)
                    .body(Map.of("model", modeloAUsar, "messages", mensajesIA, "temperature", 0.7, "max_tokens", 600))
                    .retrieve().body(JsonNode.class);
            String texto = respuesta == null ? null : respuesta.path("choices").path(0).path("message").path("content").asText(null);
            if (texto == null || texto.isBlank()) throw new ServiceUnavailableException("El proveedor IA no devolvio una respuesta valida.");
            return new AiResult(texto, respuesta.path("usage").path("prompt_tokens").asInt(0),
                    respuesta.path("usage").path("completion_tokens").asInt(0));
        } catch (RestClientException ex) {
            throw new ServiceUnavailableException(
                    "No se pudo contactar al proveedor de inteligencia artificial. Detalle: " + extraerErrorProveedor(ex));
        }
    }

    /** Extrae el código HTTP y cuerpo de la respuesta de error del proveedor para depurar. */
    private String extraerErrorProveedor(RestClientException ex) {
        // 1) Fallback genérico: incluimos el mensaje de Spring (suele traer status code y "Response:" con el body)
        Throwable cause = ex.getCause() != null ? ex.getCause() : ex;
        if (cause instanceof org.springframework.web.client.HttpStatusCodeException hse) {
            return hse.getStatusCode() + " — " + truncate(hse.getResponseBodyAsString(), 400);
        }
        if (cause instanceof org.springframework.web.client.ResourceAccessException rae) {
            return "Error de red/timeout/DNS: " + truncate(rae.getMessage(), 400);
        }
        return cause.getClass().getSimpleName() + ": " + truncate(cause.getMessage(), 300);
    }

    private String truncate(String s, int max) {
        if (s == null) return "";
        String trim = s.replaceAll("\\s+", " ").trim();
        return trim.length() > max ? trim.substring(0, max) + "…" : trim;
    }

    /** Descarga bytes de una URL firmada (signed URL del bucket privado 'chat'). */
    private byte[] httpGet(String url) throws IOException, InterruptedException {
        HttpClient client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();
        HttpRequest req = HttpRequest.newBuilder(URI.create(url))
                .GET()
                .timeout(Duration.ofSeconds(30))
                .build();
        HttpResponse<byte[]> res = client.send(req, HttpResponse.BodyHandlers.ofByteArray());
        if (res.statusCode() / 100 != 2) {
            throw new IOException("HTTP " + res.statusCode());
        }
        if (res.body().length > 26 * 1024 * 1024) {
            throw new IOException("Archivo demasiado grande");
        }
        return res.body();
    }

    /** Analiza los adjuntos: extrae texto (PDF/txt/md/csv) e imágenes (data URL base64). */
    private AdjuntoAnalisis analizarAdjuntos(List<AdjuntoRef> adjuntos) {
        List<String> imagenes = new ArrayList<>();
        StringBuilder docs = new StringBuilder();
        long presupuestoDocs = 14000; // chars máximos de texto extraído
        for (AdjuntoRef a : adjuntos) {
            if (a.url() == null || a.url().isBlank()) continue;
            String mime = a.mime() == null ? "" : a.mime().toLowerCase();
            String nombre = a.nombre() == null ? "archivo" : a.nombre();
            String nombreLower = nombre.toLowerCase();
            try {
                byte[] bytes = httpGet(a.url());
                if (mime.startsWith("image/") || nombreLower.matches(".*\\.(png|jpe?g|gif|webp)$")) {
                    if (bytes.length > 6 * 1024 * 1024) continue; // límite modelo
                    String mimeDetectado = mime.isBlank() ? "image/png" : mime;
                    imagenes.add("data:" + mimeDetectado + ";base64," + Base64.getEncoder().encodeToString(bytes));
                    if (imagenes.size() >= 2) { /* máximo 2 imágenes por mensaje */ }
                } else if (mime.equals("application/pdf") || nombreLower.endsWith(".pdf")) {
                    try (org.apache.pdfbox.pdmodel.PDDocument doc = org.apache.pdfbox.Loader.loadPDF(bytes)) {
                        String texto = new org.apache.pdfbox.text.PDFTextStripper().getText(doc);
                        if (texto != null && !texto.isBlank()) {
                            String recorte = texto.length() > presupuestoDocs ? texto.substring(0, (int) presupuestoDocs) : texto;
                            docs.append("### Archivo «").append(nombre).append("» (PDF)\n").append(recorte).append("\n\n");
                            presupuestoDocs -= recorte.length();
                        }
                    }
                } else if (mime.startsWith("text/") || nombreLower.matches(".*\\.(txt|md|csv|log|json)$")) {
                    String texto = new String(bytes, java.nio.charset.StandardCharsets.UTF_8);
                    String recorte = texto.length() > presupuestoDocs ? texto.substring(0, (int) presupuestoDocs) : texto;
                    docs.append("### Archivo «").append(nombre).append("»\n").append(recorte).append("\n\n");
                    presupuestoDocs -= recorte.length();
                }
                // Otros binarios (docx/xlsx): se omiten del contexto; el modelo verá el nombre en el turno del usuario
            } catch (Exception ex) {
                docs.append("### Archivo «").append(nombre).append("»: no se pudo leer (omitido).\n\n");
            }
            if (presupuestoDocs <= 0) break;
        }
        return new AdjuntoAnalisis(imagenes, docs.toString());
    }

    /** Construye el array de mensajes estilo OpenAI (system + historial + turno actual con adjuntos). */
    private List<Map<String, Object>> construirContextoOpenAI(UUID usuarioId, UUID conversacionId,
                                                              String contenido, AdjuntoAnalisis analisis) {
        List<Map<String, Object>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", SYSTEM_PROMPT));

        List<ChatbotMensaje> historial = rls.executeAs(usuarioId, () ->
                mensajes.findAllByConversacionId_IdOrderByCreadoEnAsc(conversacionId));
        historial.stream()
                .filter(m -> m.getRol() == RolChatbot.usuario || m.getRol() == RolChatbot.asistente)
                .skip(Math.max(0, historial.size() - 10L))
                .forEach(m -> messages.add(Map.of(
                        "role", m.getRol() == RolChatbot.usuario ? "user" : "assistant",
                        "content", m.getContenido())));

        StringBuilder textoTurno = new StringBuilder();
        if (!contenido.isEmpty()) textoTurno.append(contenido);
        if (!analisis.documentos().isBlank()) {
            if (textoTurno.length() > 0) textoTurno.append("\n\n");
            textoTurno.append(analisis.documentos());
        }
        String textoFinal = textoTurno.toString();
        if (analisis.imagenes().isEmpty()) {
            messages.add(Map.of("role", "user", "content", textoFinal.isBlank() ? "Describe lo que ves." : textoFinal));
        } else {
            List<Map<String, Object>> parts = new ArrayList<>();
            parts.add(Map.of("type", "text", "text", textoFinal.isBlank()
                    ? "Analiza esta imagen y responde mi primera pregunta." : textoFinal));
            for (String dataUrl : analisis.imagenes()) {
                parts.add(Map.of("type", "image_url", "image_url", Map.of("url", dataUrl)));
            }
            messages.add(Map.of("role", "user", "content", parts));
        }
        return messages;
    }

    private Perfil perfil(UUID id) {
        return perfiles.findById(id).orElseThrow(() -> new ResourceNotFoundException("Perfil no encontrado."));
    }

    private ChatbotConversacion conversacionPropia(UUID usuarioId, UUID conversacionId) {
        ChatbotConversacion c = conversaciones.findById(conversacionId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversacion no encontrada."));
        if (c.getUsuarioId() == null || !c.getUsuarioId().getId().equals(usuarioId)) {
            throw new ResourceNotFoundException("Conversacion no encontrada.");
        }
        if (c.getEstado() == EstadoConversacion.cerrada) throw new BadRequestException("La conversacion esta cerrada.");
        return c;
    }

    private record AiResult(String texto, int tokensEntrada, int tokensSalida) { }

    private record AdjuntoAnalisis(List<String> imagenes, String documentos) { }
}
