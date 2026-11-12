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
import java.util.List;
import java.util.Map;
import java.util.UUID;
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

    public ChatbotService(ChatbotConversacionRepository conversaciones,
                          ChatbotMensajeRepository mensajes,
                          PerfilRepository perfiles,
                          RlsExecutor rls,
                          RestClient.Builder builder,
                          @Value("${chatbot.api-key:}") String apiKey,
                          @Value("${chatbot.api-url:https://api.openai.com/v1/chat/completions}") String apiUrl,
                          @Value("${chatbot.model:gpt-4o-mini}") String modelo) {
        this.conversaciones = conversaciones;
        this.mensajes = mensajes;
        this.perfiles = perfiles;
        this.rls = rls;
        this.http = builder.build();
        this.apiKey = apiKey;
        this.apiUrl = apiUrl;
        this.modelo = modelo;
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
        UUID conversacionId = request.conversacionId();
        if (conversacionId == null) {
            ChatbotConversacionResponse creada = crear(usuarioId, new CrearConversacionRequest(null));
            conversacionId = creada.id();
        }
        final UUID id = conversacionId;
        ChatbotConversacion conversacion = rls.executeAs(usuarioId, () -> conversacionPropia(usuarioId, id));
        ChatbotMensaje mensajeUsuario = rls.executeAs(usuarioId, () -> {
            Perfil perfil = perfil(usuarioId);
            ChatbotMensaje m = new ChatbotMensaje();
            m.setConversacionId(conversacion);
            m.setAutorId(perfil);
            m.setRol(RolChatbot.usuario);
            m.setOrigen(OrigenMensaje.usuario);
            m.setContenido(request.contenido().trim());
            m.setTokensEntrada(0);
            m.setTokensSalida(0);
            m.setDatos(Map.of());
            m.setEsPrivado(false);
            return mensajes.save(m);
        });

        Instant inicio = Instant.now();
        AiResult ai = consultarProveedor(usuarioId, id);
        int latencia = (int) Math.min(Duration.between(inicio, Instant.now()).toMillis(), Integer.MAX_VALUE);
        ChatbotMensaje respuesta = rls.executeAs(usuarioId, () -> {
            ChatbotMensaje m = new ChatbotMensaje();
            m.setConversacionId(conversacion);
            m.setAutorId(null);
            m.setRol(RolChatbot.asistente);
            m.setOrigen(OrigenMensaje.asistente);
            m.setContenido(ai.texto());
            m.setTokensEntrada(ai.tokensEntrada());
            m.setTokensSalida(ai.tokensSalida());
            m.setLatenciaMs(latencia);
            m.setModelo(modelo);
            m.setDatos(Map.of());
            m.setEsPrivado(false);
            ChatbotMensaje guardado = mensajes.save(m);
            ChatbotConversacion actual = conversacionPropia(usuarioId, id);
            actual.setTokensTotales((actual.getTokensTotales() == null ? 0 : actual.getTokensTotales()) + ai.tokensEntrada() + ai.tokensSalida());
            conversaciones.save(actual);
            return guardado;
        });
        return new EnviarMensajeResponse(
                rls.executeAs(usuarioId, () -> ChatbotConversacionResponse.from(conversacionPropia(usuarioId, id))),
                ChatbotMensajeResponse.from(mensajeUsuario), ChatbotMensajeResponse.from(respuesta));
    }

    private AiResult consultarProveedor(UUID usuarioId, UUID conversacionId) {
        List<ChatbotMensaje> historial = rls.executeAs(usuarioId, () ->
                mensajes.findAllByConversacionId_IdOrderByCreadoEnAsc(conversacionId));
        List<Map<String, String>> contexto = new ArrayList<>();
        contexto.add(Map.of("role", "system", "content",
                "Eres el asistente educativo de InkaQuest. Responde en espanol, con claridad y adapta las explicaciones al aprendizaje de programacion. No afirmes haber ejecutado codigo ni acceder a datos que no se te hayan proporcionado."));
        historial.stream().filter(m -> m.getRol() == RolChatbot.usuario || m.getRol() == RolChatbot.asistente)
                .skip(Math.max(0, historial.size() - 20L)).forEach(m -> contexto.add(Map.of(
                        "role", m.getRol() == RolChatbot.usuario ? "user" : "assistant", "content", m.getContenido())));
        // El mensaje del usuario ya esta persistido en el historial.
        try {
            JsonNode respuesta = http.post().uri(apiUrl).contentType(MediaType.APPLICATION_JSON)
                    .header("Authorization", "Bearer " + apiKey)
                    .body(Map.of("model", modelo, "messages", contexto, "temperature", 0.7, "max_tokens", 1000))
                    .retrieve().body(JsonNode.class);
            String texto = respuesta == null ? null : respuesta.path("choices").path(0).path("message").path("content").asText(null);
            if (texto == null || texto.isBlank()) throw new ServiceUnavailableException("El proveedor IA no devolvio una respuesta valida.");
            return new AiResult(texto, respuesta.path("usage").path("prompt_tokens").asInt(0),
                    respuesta.path("usage").path("completion_tokens").asInt(0));
        } catch (RestClientException ex) {
            throw new ServiceUnavailableException("No se pudo contactar al proveedor de inteligencia artificial.");
        }
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
}
