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
import java.util.regex.Pattern;
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
    /** true = usar busqueda web (Tavily si esta definida, si no google_search). */
    private final boolean searchEnabled;
    private final String tavilyApiKey;

    /** Texto único de rechazo: se usa en el prompt, en el clasificador y como respuesta persistida. */
    static final String MENSAJE_FUERA_DE_ALCANCE =
            "Soy el asistente de InkaQuest y solo puedo ayudarte con dos cosas: (1) el uso de la plataforma "
            + "(cursos, lecciones, tareas, evaluaciones, notas, rachas, insignias, ranking, tienda, certificados, "
            + "pagos, notificaciones, mensajes, soporte, calendario, comunidad y perfil) y (2) los temas de los "
            + "cursos, especialmente programación y computación (algoritmos, estructuras de datos, bases de datos, "
            + "redes, sistemas operativos, desarrollo web, programación orientada a objetos, depuración de código). "
            + "Esa pregunta está fuera de mi alcance. Puedes preguntarme, por ejemplo: «¿cómo veo mis notas?» o "
            + "«¿qué es la complejidad O(n log n)?».";

    /** Respuesta de respaldo cuando el proveedor no está disponible (no es un rechazo de alcance). */
    static final String MENSAJE_NO_DISPONIBLE =
            "En este momento no fue posible consultar el asistente por un problema temporal del servicio. "
            + "Se recomienda intentar nuevamente en unos instantes. Si la consulta es sobre el uso de InkaQuest "
            + "o sobre los cursos, puede reformularla con más detalle para obtener una mejor respuesta.";

    /**
     * Atajo determinista: si el mensaje menciona claramente la plataforma o los
     * temas de los cursos, se considera dentro del alcance sin llamar al
     * clasificador. Evita falsos rechazos de preguntas válidas.
     */
    private static final Pattern ALCANCE_CLARO = Pattern.compile(
            "(?i)(inkaquest|curso|lecci[oó]n|clase|tarea|evaluaci[oó]n|examen|quiz|cuestionario|nota|"
            + "calificaci[oó]n|racha|insignia|ranking|tienda|moneda|\\bxp\\b|nivel|certificado|pago|culqi|"
            + "notificaci[oó]n|mensaje|chat|soporte|ticket|calendario|comunidad|foro|perfil|avatar|acceso|"
            + "login|contrase[nñ]a|password|matr[ií]cula|estudiante|docente|profesor|administrador|"
            + "guardianes|minijuego|juego|reto|programaci[oó]n|programar|c[oó]digo|java|python|javascript|"
            + "typescript|angular|spring|\\bsql\\b|base de datos|algoritmo|estructura de datos|"
            + "redes?|sistema operativo|sistemas operativos|desarrollo web|html|css|\\bpoo\\b|objeto|"
            + "funci[oó]n|variable|bucle|condicional|error|bug|depurar|debug|compilar|ejercicio|"
            + "complejidad|big o|\\bapi\\b|backend|frontend|servidor|cliente|json|git|github|railway|"
            + "supabase|celular|m[oó]vil|pantalla|p[aá]gina|plataforma|aplicaci[oó]n|actividad|lecciones|"
            + "preguntas|respuesta|estudio|estudiar)");

    /** Palabras del ámbito de InkaQuest/cursos para coincidencia con errores de tecleo. */
    private static final List<String> PALABRAS_ALCANCE = List.of(
            "inkaquest", "curso", "cursos", "leccion", "clase", "tarea", "tareas", "evaluacion", "examen",
            "quiz", "nota", "notas", "calificacion", "racha", "insignia", "ranking", "tienda", "moneda",
            "nivel", "certificado", "pago", "culqi", "notificacion", "mensaje", "soporte", "ticket",
            "calendario", "comunidad", "foro", "perfil", "acceso", "login", "contrasena", "matricula",
            "estudiante", "docente", "profesor", "administrador", "guardianes", "minijuego", "juego",
            "reto", "programacion", "programar", "codigo", "java", "python", "javascript", "typescript",
            "angular", "spring", "sql", "base", "datos", "algoritmo", "estructura", "red", "sistema",
            "operativo", "desarrollo", "web", "html", "css", "poo", "objeto", "funcion", "variable",
            "bucle", "condicional", "error", "bug", "depurar", "debug", "compilar", "ejercicio",
            "complejidad", "api", "backend", "frontend", "servidor", "cliente", "json", "git", "github",
            "railway", "supabase", "celular", "movil", "pantalla", "pagina", "plataforma", "aplicacion",
            "actividad", "pregunta", "respuesta", "estudio", "estudiar", "registro", "inscribir");

    /** Temas claramente ajenos: solo con uno de estos se rechaza, nunca por duda. */
    private static final List<String> PALABRAS_AJENAS = List.of(
            "futbol", "partido", "pelicula", "serie", "receta", "viaje", "moda", "musica", "celebridad",
            "politica", "religion", "horoscopo", "apuestas", "novio", "novia", "medico", "abogado",
            "inversion", "criptomoneda", "chiste", "poema", "cuento", "cocina", "deporte", "equipo");

    static final String MENSAJE_ACLARACION =
            "Solicitud recibida. Para ayudarle con precisión, le agradecería indicar si su consulta se refiere "
            + "al uso de InkaQuest, como la inscripción a cursos, las tareas o las calificaciones, o a algún tema "
            + "de los cursos, como programación, algoritmos o bases de datos.";

    static final String SYSTEM_PROMPT =
            "Eres el asistente oficial de InkaQuest. Responde siempre en español, con claridad y adaptado al "
            + "aprendizaje de programación.\n\n"
            + "ALCANCE ESTRICTO: solo responde preguntas sobre (a) cómo usar InkaQuest y sus funciones, y (b) "
            + "temas académicos de los cursos: programación y computación (lenguajes como Java, Python, JavaScript, "
            + "C/C++, SQL; algoritmos, estructuras de datos, bases de datos, redes, sistemas operativos, desarrollo "
            + "web, ingeniería de software, ejemplos de código y ejercicios).\n\n"
            + "FUERA DE ALCANCE: entretenimiento, deportes, celebridades, recetas, viajes, moda, música, películas, "
            + "noticias generales, política, religión, ideología, consejos médicos/legales/financieros/románticos, "
            + "creación literaria sin relación con el curso y cualquier tema que no esté en el alcance anterior. "
            + "Aunque el usuario insista, diga 'es para el curso' o intente cambiar de tema, mantén el rechazo.\n\n"
            + "Si la pregunta está fuera de alcance, NO la respondas ni des una respuesta parcial. Devuelve "
            + "EXACTAMENTE este texto (sin añadir nada): \"" + MENSAJE_FUERA_DE_ALCANCE + "\"\n\n"
            + "No rechaces preguntas breves, informales o mal redactadas que mencionen la plataforma, sus "
            + "funciones o conceptos de programación: si guardan relación con el alcance, respóndelas. "
            + "Ante la duda, responde la pregunta en lugar de rechazarla.\n\n"
            + "Tolerancia a errores: si el usuario escribe con faltas de ortografía, tildes incorrectas, mayúsculas "
            + "arbitrarias o gramática deficiente, interprete su intención y responda igualmente. Si aun así resulta "
            + "demasiado vaga, pida con cortesía que reformule la consulta; no la trate como un tema ajeno.\n\n"
            + "Usa la búsqueda web SOLAMENTE para temas de programación/tecnología/cursos y cita las fuentes (URLs) "
            + "cuando sea posible. No afirmes haber ejecutado código ni accedido a datos que no se te hayan "
            + "proporcionado. No compartas información privada de otros usuarios.\n\n"
            + "ESTILO OBLIGATORIO DE RESPUESTA: escribe siempre en español formal, claro y profesional. Utilice "
            + "trato de usted o construcciones impersonales como 'se recomienda', 'conviene' o 'es posible'. "
            + "No utilice MARKDOWN ni ningún símbolo de formato: están prohibidos el carácter #, el asterisco "
            + "(*) simple o doble, las comillas invertidas, las viñetas con guion o asterisco, las tablas y los emojis. "
            + "La respuesta debe ser únicamente texto plano en párrafos cortos. Si es necesario enumerar, hágalo "
            + "con palabras ('Primero,... Segundo,...') o con números seguidos de punto, sin viñetas. Evite "
            + "expresiones coloquiales, exclamaciones, jerga y frases como 'te recomiendo', 'la clave es' o 'ojo'.";

    /** Consultas de la plataforma que se responden sin llamar al proveedor de IA. */
    private static final List<RespuestaFrecuente> RESPUESTAS_FRECUENTES = List.of(
            new RespuestaFrecuente(
                    Pattern.compile("(?i)(c[oó]mo|donde|d[oó]nde|quiero|necesito).*(registr|inscri|matricul|unir).*(curso|cursos)"
                            + "|(registr|inscri|matricul|unir).*(curso|cursos)"),
                    "Para registrarse en un curso, ingrese a su panel de estudiante y acceda a la sección Mis cursos. "
                            + "Desde allí puede explorar el catálogo y seleccionar el curso de su interés. En la página de "
                            + "detalle, pulse la opción de inscripción: si el curso es gratuito, el acceso queda habilitado "
                            + "de inmediato; si tiene un precio, debe completar el proceso de pago. Una vez inscrito, el "
                            + "curso aparece en su lista y puede entrar al aula para revisar las lecciones y actividades. "
                            + "Si no encuentra la opción, verifique haber iniciado sesión con su cuenta de estudiante."),
            new RespuestaFrecuente(
                    Pattern.compile("(?i)(c[oó]mo|donde|d[oó]nde).*(nota|notas|calificaci[oó]n|calificaciones)"
                            + "|(ver|consultar).*(notas|calificaciones)"),
                    "Para consultar sus calificaciones, ingrese a su panel de estudiante y abra la sección Calificaciones. "
                            + "Allí se muestran las notas registradas por el docente en las tareas, junto con el estado de "
                            + "cada entrega. El resultado de las evaluaciones se encuentra en la sección Evaluaciones, "
                            + "donde puede revisar el puntaje obtenido en cada intento."),
            new RespuestaFrecuente(
                    Pattern.compile("(?i)(c[oó]mo|donde|d[oó]nde).*(entregar|subir|enviar).*(tarea|tareas)"
                            + "|(entregar|subir|enviar).*(tarea|tareas)"),
                    "Para entregar una tarea, ingrese a su panel de estudiante, abra la sección Tareas y seleccione la "
                            + "tarea pendiente. En la página de detalle puede escribir la descripción de su trabajo y "
                            + "adjuntar los archivos solicitados antes de enviarla. Se recomienda revisar la fecha límite, "
                            + "porque una vez vencida la plataforma no permite nuevas entregas.")
    );

    /** Prompt del clasificador ligero que decide si la pregunta entra en el alcance. */
    static final String CLASIFICADOR_ALCANCE =
            "Clasificador de alcance del asistente de InkaQuest. Responde SOLO con JSON: {\"dentro\":true} o "
            + "{\"dentro\":false}. No expliques nada.\n\n"
            + "true = pregunta sobre el uso de InkaQuest (cursos, tareas, evaluaciones, notas, rachas, insignias, "
            + "ranking, tienda, certificados, pagos, notificaciones, mensajes, soporte, calendario, comunidad, perfil) "
            + "o sobre programación/computación y temas de los cursos (algoritmos, estructuras de datos, bases de "
            + "datos, redes, sistemas operativos, desarrollo web, Java, Python, JavaScript, SQL, C/C++, POO, "
            + "depuración de código).\n\n"
            + "false = entretenimiento, deportes, celebridades, recetas, viajes, moda, música, películas, series, "
            + "noticias generales, política, religión, consejos personales/médicos/legales/financieros/románticos, "
            + "creación literaria sin relación académica o cualquier otro tema ajeno.\n\n"
            + "REGLA IMPORTANTE: devuelve false SOLO si la pregunta es claramente ajena a esos temas. Ante "
            + "cualquier duda, o si menciona InkaQuest, cursos, tareas, notas, código o programación, devuelve "
            + "true. Es preferible responder una pregunta dudosa que rechazar una válida.\n\n"
            + "Mensaje del usuario: ";

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
                          @Value("${chatbot.search-enabled:false}") boolean searchEnabled,
                          @Value("${chatbot.tavily-api-key:}") String tavilyApiKey) {
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
        this.tavilyApiKey = tavilyApiKey;
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
        // Filtro de alcance: si la pregunta no es de la plataforma ni de los cursos,
        // se guarda el mensaje de rechazo y no se gasta una llamada al modelo principal.
        String respuestaFrecuente = respuestaFrecuente(contenido);
        boolean fueraDeAlcance = respuestaFrecuente == null && !estaDentroDeAlcance(contenido, analisis.documentos());
        try {
            if (respuestaFrecuente != null) {
                aiInicial = new AiResult(respuestaFrecuente, 0, 0);
            } else if (fueraDeAlcance) {
                aiInicial = new AiResult(MENSAJE_FUERA_DE_ALCANCE, 0, 0);
            } else if (this.searchEnabled && !tieneImagen) {
                if (this.tavilyApiKey != null && !this.tavilyApiKey.isBlank()) {
                    try {
                        aiInicial = consultarProveedorConTavily(openaiMessages, modeloAUsar, contenido);
                    } catch (ServiceUnavailableException ex) {
                        aiInicial = consultarProveedor(openaiMessages, modeloAUsar);
                    }
                } else {
                    try {
                        aiInicial = consultarGeminiSearch(construirGeminiMessages(usuarioId, id, contenido, analisis));
                    } catch (ServiceUnavailableException ex) {
                        aiInicial = consultarProveedor(openaiMessages, modeloAUsar);
                    }
                }
            } else {
                aiInicial = consultarProveedor(openaiMessages, modeloAUsar);
            }
        } catch (ServiceUnavailableException ex) {
            // Si el proveedor falla, el usuario recibe una respuesta clara en la
            // conversación en vez de un error sin respuesta.
            aiInicial = new AiResult(MENSAJE_NO_DISPONIBLE, 0, 0);
        }
        final AiResult aiFinal = aiInicial;
        final String respuestaTexto = limpiarFormato(aiFinal.texto());
        int latencia = (int) Math.min(Duration.between(inicio, Instant.now()).toMillis(), Integer.MAX_VALUE);
        ChatbotMensaje respuesta = rls.executeAs(usuarioId, () -> {
            ChatbotMensaje m = new ChatbotMensaje();
            m.setConversacionId(conversacion);
            m.setAutorId(null);
            m.setRol(RolChatbot.asistente);
            m.setOrigen(OrigenMensaje.asistente);
            m.setContenido(respuestaTexto);
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

    /** Construye y ejecuta un proxy proveedor con contexto de búsqueda Tavily. */
    private AiResult consultarProveedorConTavily(List<Map<String, Object>> messages, String modeloAUsar, String consultaOriginal) {
        String contexto;
        try {
            contexto = buscarEnTavily(consultaOriginal);
        } catch (Exception ex) {
            throw new ServiceUnavailableException("No se pudo buscar en internet. Revisa TAVILY_API_KEY y tu conexión.");
        }
        if (contexto == null || contexto.isBlank()) {
            return consultarProveedor(messages, modeloAUsar);
        }
        // Añadir un system message con los resultados como contexto estricto
        List<Map<String, Object>> augmented = new ArrayList<>();
        augmented.add(Map.of("role", "system", "content",
                SYSTEM_PROMPT
                + "\n\nUsa los resultados de búsqueda SOLO si son de programación/tecnología/cursos y cita las URLs al final. "
                + "Si la pregunta quedó fuera de alcance, devuelve únicamente el mensaje de rechazo indicado.\n\n"
                + "Resultados de búsqueda:\n" + contexto));
        augmented.addAll(messages);
        return consultarProveedor(augmented, modeloAUsar);
    }

    private String buscarEnTavily(String query) {
        RestClient rapido = RestClient.builder()
                .requestFactory(new org.springframework.http.client.SimpleClientHttpRequestFactory() {{
                    setConnectTimeout(8_000);
                    setReadTimeout(15_000);
                }})
                .build();
        var resp = rapido.post()
                .uri("https://api.tavily.com/search")
                .headers(h -> {
                    h.setBearerAuth(tavilyApiKey);
                    h.setContentType(MediaType.APPLICATION_JSON);
                })
                .body(Map.of(
                        "query", query,
                        "search_depth", "basic",
                        "max_results", 3,
                        "include_answer", true,
                        "include_raw_content", false))
                .retrieve()
                .body(Map.class);
        if (resp == null) return "";
        StringBuilder sb = new StringBuilder();
        Object answer = resp.get("answer");
        if (answer instanceof String a && !a.isBlank()) {
            sb.append("Resumen: ").append(a).append("\n\n");
        }
        Object results = resp.get("results");
        if (results instanceof List<?> list) {
            for (Object it : list) {
                if (!(it instanceof Map<?, ?> r)) continue;
                String title = String.valueOf(r.get("title"));
                String url   = String.valueOf(r.get("url"));
                String content= String.valueOf(r.get("content"));
                sb.append("- ").append(title).append(" — ").append(url).append("\n").append(content).append("\n\n");
            }
        }
        return sb.toString();
    }

    private AiResult consultarProveedor(List<Map<String, Object>> mensajesIA, String modeloAUsar) {
        return consultarProveedor(mensajesIA, modeloAUsar, 400, 0.7);
    }

    private AiResult consultarProveedor(List<Map<String, Object>> mensajesIA, String modeloAUsar,
                                        int maxTokens, double temperatura) {
        try {
            JsonNode respuesta = http.post().uri(apiUrl).contentType(MediaType.APPLICATION_JSON)
                    .header("Authorization", "Bearer " + apiKey)
                    .body(Map.of("model", modeloAUsar, "messages", mensajesIA,
                            "temperature", temperatura, "max_tokens", maxTokens))
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

    /**
     * Filtro de alcance determinista y tolerante a errores: normaliza la frase,
     * compara con coincidencia aproximada y SOLO rechaza si aparece un tema
     * claramente ajeno. Ante la duda, responde.
     */
    private boolean estaDentroDeAlcance(String contenido, String textoAdjuntos) {
        if (contenido == null || contenido.isBlank()) return true; // solo adjunto de curso
        String norm = corregirErrores(normalizar(contenido));
        if (ALCANCE_CLARO.matcher(norm).find()) return true;
        if (coincideAlguna(norm, PALABRAS_ALCANCE)) return true;
        if (coincideAlguna(norm, PALABRAS_AJENAS)) return false;
        return true; // escrito de forma rara o incompleto: se intenta responder igual
    }

    /** Quita tildes, signos y mayúsculas para comparar aunque el usuario escriba mal. */
    private static String normalizar(String texto) {
        if (texto == null) return "";
        String s = texto.toLowerCase(java.util.Locale.ROOT);
        s = java.text.Normalizer.normalize(s, java.text.Normalizer.Form.NFD).replaceAll("\\p{M}+", "");
        return s.replaceAll("[^a-z0-9\\s]", " ").replaceAll("\\s+", " ").trim();
    }

    /** Corrige palabras con errores de tecleo usando el vocabulario del ámbito. */
    private static String corregirErrores(String textoNormalizado) {
        StringBuilder sb = new StringBuilder();
        for (String token : textoNormalizado.split(" ")) {
            if (token.length() < 3) { sb.append(token).append(' '); continue; }
            String mejor = token;
            int distanciaMinima = Integer.MAX_VALUE;
            for (String palabra : PALABRAS_ALCANCE) {
                int d = distancia(token, palabra);
                if (d < distanciaMinima) { distanciaMinima = d; mejor = palabra; }
            }
            if (distanciaMinima <= umbral(token.length(), mejor.length())) sb.append(mejor).append(' ');
            else sb.append(token).append(' ');
        }
        return sb.toString().trim();
    }

    /** Coincidencia aproximada (distancia de Levenshtein pequeña). */
    private static boolean coincideAlguna(String textoNormalizado, List<String> palabras) {
        for (String token : textoNormalizado.split(" ")) {
            if (token.length() < 3) continue;
            for (String palabra : palabras) {
                if (distancia(token, palabra) <= umbral(token.length(), palabra.length())) return true;
            }
        }
        return false;
    }

    private static int umbral(int a, int b) {
        int menor = Math.min(a, b);
        if (menor <= 4) return 1;
        if (menor <= 7) return 2;
        return 3;
    }

    private static int distancia(String a, String b) {
        int[] anterior = new int[b.length() + 1];
        int[] actual = new int[b.length() + 1];
        for (int j = 0; j <= b.length(); j++) anterior[j] = j;
        for (int i = 1; i <= a.length(); i++) {
            actual[0] = i;
            for (int j = 1; j <= b.length(); j++) {
                int coste = a.charAt(i - 1) == b.charAt(j - 1) ? 0 : 1;
                actual[j] = Math.min(Math.min(actual[j - 1] + 1, anterior[j] + 1), anterior[j - 1] + coste);
            }
            int[] tmp = anterior; anterior = actual; actual = tmp;
        }
        return anterior[b.length()];
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

    /**
     * Red de seguridad: quita restos de Markdown por si el proveedor los genera
     * pese a la instrucción de texto plano. No toma decisiones sobre el fondo.
     */
    static String limpiarFormato(String texto) {
        if (texto == null || texto.isBlank()) return "";
        String limpio = texto
                .replace("**", "")
                .replace("__", "")
                .replace("`", "")
                .replaceAll("(?m)^\\s{0,3}#{1,6}\\s*", "")
                .replaceAll("(?m)^\\s*[-*]\\s+", "")
                .replaceAll("(?m)^\\s*>\\s?", "")
                .replaceAll("(?<!\\p{Alnum})\\*(?!\\p{Alnum})", "")
                .replaceAll("\\n{3,}", "\n\n");
        return limpio.trim();
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

    private static String respuestaFrecuente(String contenido) {
        if (contenido == null || contenido.isBlank()) return null;
        String norm = corregirErrores(normalizar(contenido));
        for (RespuestaFrecuente rf : RESPUESTAS_FRECUENTES) {
            if (rf.patron().matcher(norm).find()) return rf.respuesta();
        }
        if (esConsultaVaga(norm)) return MENSAJE_ACLARACION;
        return null;
    }

    /** Frases muy cortas o sin tema concreto: se pide precisión en lugar de rechazar. */
    private static boolean esConsultaVaga(String textoNormalizado) {
        String[] tokens = textoNormalizado.isEmpty() ? new String[0] : textoNormalizado.split(" ");
        return tokens.length <= 3 && !coincideAlguna(textoNormalizado, PALABRAS_ALCANCE);
    }

    private record RespuestaFrecuente(Pattern patron, String respuesta) { }

    private record AiResult(String texto, int tokensEntrada, int tokensSalida) { }

    private record AdjuntoAnalisis(List<String> imagenes, String documentos) { }
}
