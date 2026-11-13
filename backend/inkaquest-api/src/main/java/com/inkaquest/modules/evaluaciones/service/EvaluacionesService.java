package com.inkaquest.modules.evaluaciones.service;

import com.inkaquest.modules.identidad.repository.PerfilRepository;
import com.inkaquest.modules.evaluaciones.dto.*;
import com.inkaquest.modules.evaluaciones.entity.*;
import com.inkaquest.modules.evaluaciones.repository.*;
import com.inkaquest.modules.matriculas.repository.MatriculaRepository;
import com.inkaquest.shared.enums.*;
import com.inkaquest.shared.exception.*;
import com.inkaquest.shared.security.RlsExecutor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.Objects;

/**
 * Servicio de gestión de evaluaciones/cuestionarios.
 *
 * <p>Responsabilidades:
 * <ul>
 *   <li>Listar evaluaciones disponibles</li>
 *   <li>Iniciar intentos de evaluación</li>
 *   <li>Registrar respuestas</li>
 *   <li>Calificar automáticamente</li>
 *   <li>Mostrar resultados</li>
 * </ul>
 *
 * <p>Seguridad: Todas las operaciones usan RLS y verifican matrícula.</p>
 */
@Service
public class EvaluacionesService {
    
    private static final Logger log = LoggerFactory.getLogger(EvaluacionesService.class);
    
    private final EvaluacionRepository evaluacionRepository;
    private final PreguntaRepository preguntaRepository;
    private final OpcionRepository opcionRepository;
    private final IntentoEvaluacionRepository intentoRepository;
    private final RespuestaEvaluacionRepository respuestaRepository;
    private final MatriculaRepository matriculaRepository;
    private final PerfilRepository perfilRepository;
    private final RlsExecutor rlsExecutor;

    public EvaluacionesService(
            EvaluacionRepository evaluacionRepository,
            PreguntaRepository preguntaRepository,
            OpcionRepository opcionRepository,
            IntentoEvaluacionRepository intentoRepository,
            RespuestaEvaluacionRepository respuestaRepository,
            MatriculaRepository matriculaRepository,
            PerfilRepository perfilRepository,
            RlsExecutor rlsExecutor) {
        this.evaluacionRepository = evaluacionRepository;
        this.preguntaRepository = preguntaRepository;
        this.opcionRepository = opcionRepository;
        this.intentoRepository = intentoRepository;
        this.respuestaRepository = respuestaRepository;
        this.matriculaRepository = matriculaRepository;
        this.perfilRepository = perfilRepository;
        this.rlsExecutor = rlsExecutor;
    }

    /**
     * Lista evaluaciones disponibles para el usuario.
     */
    @Transactional(readOnly = true)
    public List<EvaluacionResponse> listarEvaluaciones(UUID usuarioId, UUID cursoId) {
        return rlsExecutor.executeAs(usuarioId, () -> {
            // TODO: Filtrar por curso si se especifica
            List<Evaluacion> evaluaciones = evaluacionRepository.findAll();
            
            return evaluaciones.stream()
                    .map(e -> toResponse(e, usuarioId))
                    .toList();
        });
    }

    /**
     * Obtiene el detalle de una evaluación.
     */
    @Transactional(readOnly = true)
    public EvaluacionResponse obtenerDetalle(UUID evaluacionId, UUID usuarioId) {
        return rlsExecutor.executeAs(usuarioId, () -> {
            Evaluacion evaluacion = evaluacionRepository.findById(evaluacionId)
                    .orElseThrow(() -> new ResourceNotFoundException("Evaluación no encontrada"));
            
            return toResponse(evaluacion, usuarioId);
        });
    }

    /**
     * Inicia un nuevo intento de evaluación.
     */
    @Transactional
    public IniciarIntentoResponse iniciarIntento(UUID evaluacionId, UUID usuarioId) {
        return rlsExecutor.executeAs(usuarioId, () -> {
            Evaluacion evaluacion = evaluacionRepository.findById(evaluacionId)
                    .orElseThrow(() -> new ResourceNotFoundException("Evaluación no encontrada"));
            
            // Verificar que está matriculado
            UUID cursoId = evaluacion.getActividadId().getCursoId().getId();
            boolean matriculado = matriculaRepository
                    .existsByEstudianteIdIdAndCursoIdIdAndEstado(usuarioId, cursoId, EstadoMatricula.activa);
            
            if (!matriculado) {
                throw new UnauthorizedException("Debes estar matriculado en el curso para realizar la evaluación");
            }
            
            // Verificar intentos disponibles
            int intentosRealizados = intentoRepository
                    .countByEstudianteIdIdAndEvaluacionIdId(usuarioId, evaluacionId);

            // Cargar preguntas de una sola vez: reusar para el máximo y para armar el DTO.
            List<Pregunta> preguntas = preguntaRepository.findByEvaluacionIdIdOrderByOrdenAsc(evaluacionId);
            if (intentosRealizados >= evaluacion.getIntentosPermitidos()) {
                throw new BadRequestException("Has agotado tus intentos permitidos para esta evaluación");
            }

            // Crear nuevo intento
            IntentoEvaluacion intento = new IntentoEvaluacion();
            intento.setEvaluacionId(evaluacion);
            intento.setEstudianteId(perfilRepository.findById(usuarioId)
                    .orElseThrow(() -> new ResourceNotFoundException("Perfil del estudiante no encontrado")));
            intento.setNumero(intentosRealizados + 1);
            intento.setEstado(EstadoIntento.en_curso);
            intento.setPuntaje(BigDecimal.ZERO);
            BigDecimal sumPoints = preguntas.stream()
                    .map(Pregunta::getPuntos)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            intento.setPuntajeMaximo(sumPoints.signum() > 0 ? sumPoints : BigDecimal.ONE);
            intento.setTiempoInicio(Instant.now());
            intento.setCreadoEn(Instant.now());
            intento.setActualizadoEn(Instant.now());
            
            intento = intentoRepository.save(intento);
            
            // Aleatorizar si está configurado
            if (evaluacion.getAleatorizarPreguntas()) {
                Collections.shuffle(preguntas);
            }
            
            // Calcular tiempo límite
            Instant tiempoLimite = null;
            if (evaluacion.getDuracionMinutos() != null) {
                tiempoLimite = intento.getTiempoInicio().plus(Duration.ofMinutes(evaluacion.getDuracionMinutos()));
            }
            
            // Convertir preguntas a DTOs
            List<PreguntaIntentoDto> preguntasDto = preguntas.stream()
                    .map(this::toPreguntaIntentoDto)
                    .toList();
            
            log.info("Intento {} iniciado para evaluación {} por usuario {}", 
                    intento.getId(), evaluacionId, usuarioId);
            
            return new IniciarIntentoResponse(
                    intento.getId(),
                    intento.getNumero(),
                    intento.getTiempoInicio(),
                    tiempoLimite,
                    intento.getPuntajeMaximo(),
                    preguntasDto
            );
        });
    }

    /**
     * Procesa y califica las respuestas de un intento.
     */
    @Transactional
    public ResultadoIntentoResponse responderIntento(UUID intentoId, ResponderIntentoRequest request, UUID usuarioId) {
        return rlsExecutor.executeAs(usuarioId, () -> {
            IntentoEvaluacion intento = intentoRepository.findById(intentoId)
                    .orElseThrow(() -> new ResourceNotFoundException("Intento no encontrado"));
            
            // Verificar que el intento está en progreso
            if (intento.getEstado() != EstadoIntento.en_curso) {
                throw new BadRequestException("Este intento ya fue finalizado");
            }
            
            // Verificar tiempo límite
            Evaluacion evaluacion = intento.getEvaluacionId();
            if (evaluacion.getDuracionMinutos() != null) {
                Instant tiempoLimite = intento.getTiempoInicio().plus(Duration.ofMinutes(evaluacion.getDuracionMinutos()));
                if (Instant.now().isAfter(tiempoLimite)) {
                    throw new BadRequestException("El tiempo límite ha expirado");
                }
            }
            
            // Procesar cada respuesta
            BigDecimal puntajeTotal = BigDecimal.ZERO;
            List<PreguntaResultadoDto> resultados = new ArrayList<>();
            
            for (RespuestaDto respuestaDto : request.respuestas()) {
                Pregunta pregunta = preguntaRepository.findById(respuestaDto.preguntaId())
                        .orElseThrow(() -> new ResourceNotFoundException("Pregunta no encontrada"));
                
                // Calificar según el tipo de pregunta
                BigDecimal puntajeObtenido = calificarRespuesta(pregunta, respuestaDto, intento);
                puntajeTotal = puntajeTotal.add(puntajeObtenido);
                
                // Agregar al resultado si se debe mostrar
                if (evaluacion.getMostrarResultadoInmediato()) {
                    resultados.add(crearResultadoPregunta(pregunta, respuestaDto, puntajeObtenido));
                }
            }
            
            // Actualizar intento
            intento.setPuntaje(puntajeTotal);
            intento.setEstado(EstadoIntento.entregado);
            intento.setTiempoFin(Instant.now());
            intento.setActualizadoEn(Instant.now());
            
            // Calcular porcentaje y si aprobó (basado en la suma de puntos de preguntas).
            BigDecimal puntajeMaximo = intento.getPuntajeMaximo() != null && intento.getPuntajeMaximo().signum() > 0
                    ? intento.getPuntajeMaximo()
                    : BigDecimal.ONE;
            BigDecimal porcentaje = puntajeTotal
                    .divide(puntajeMaximo, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .setScale(2, RoundingMode.HALF_UP);

            boolean aprobado = porcentaje.compareTo(evaluacion.getPorcentajeAprobacion()) >= 0;
            intento.setAprobado(aprobado);

            intentoRepository.save(intento);

            log.info("Intento {} finalizado con puntaje {} de {} ({}%)",
                    intentoId, puntajeTotal, puntajeMaximo, porcentaje);

            return new ResultadoIntentoResponse(
                    intento.getId(),
                    intento.getEstado().name(),
                    puntajeTotal,
                    puntajeMaximo,
                    porcentaje,
                    aprobado,
                    intento.getTiempoInicio(),
                    intento.getTiempoFin(),
                    evaluacion.getMostrarResultadoInmediato() ? resultados : List.of()
            );
        });
    }

    /**
     * Obtiene el resultado de un intento ya finalizado.
     */
    @Transactional(readOnly = true)
    public ResultadoIntentoResponse obtenerResultado(UUID intentoId, UUID usuarioId) {
        return rlsExecutor.executeAs(usuarioId, () -> {
            IntentoEvaluacion intento = intentoRepository.findById(intentoId)
                    .orElseThrow(() -> new ResourceNotFoundException("Intento no encontrado"));
            
            if (intento.getEstado() == EstadoIntento.en_curso) {
                throw new BadRequestException("El intento aún no ha sido finalizado");
            }
            
            Evaluacion evaluacion = intento.getEvaluacionId();
            
            // Obtener respuestas si se permite mostrar resultado
            List<PreguntaResultadoDto> resultados = new ArrayList<>();
            if (evaluacion.getMostrarResultadoInmediato()) {
                List<RespuestaEvaluacion> respuestas = respuestaRepository.findByIntentoIdId(intentoId);
                
                for (RespuestaEvaluacion resp : respuestas) {
                    resultados.add(crearResultadoDesdeRespuesta(resp));
                }
            }
            
            BigDecimal puntajeMaximoObt = intento.getPuntajeMaximo() != null && intento.getPuntajeMaximo().signum() > 0
                    ? intento.getPuntajeMaximo()
                    : BigDecimal.ONE;
            BigDecimal porcentaje = intento.getPuntaje()
                    .divide(puntajeMaximoObt, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .setScale(2, RoundingMode.HALF_UP);
            
            return new ResultadoIntentoResponse(
                    intento.getId(),
                    intento.getEstado().name(),
                    intento.getPuntaje(),
                    intento.getPuntajeMaximo(),
                    porcentaje,
                    intento.getAprobado() != null ? intento.getAprobado() : false,
                    intento.getTiempoInicio(),
                    intento.getTiempoFin(),
                    resultados
            );
        });
    }

    // === MÉTODOS AUXILIARES ===
    
    private BigDecimal calificarRespuesta(Pregunta pregunta, RespuestaDto respuestaDto, IntentoEvaluacion intento) {
        BigDecimal puntaje = BigDecimal.ZERO;
        boolean esCorrecta = false;
        
        if (pregunta.getTipo() == TipoPregunta.opcion_unica
                || pregunta.getTipo() == TipoPregunta.opcion_multiple
                || pregunta.getTipo() == TipoPregunta.verdadero_falso) {
            // Verificar opción seleccionada
            if (respuestaDto.opcionesSeleccionadas() != null && !respuestaDto.opcionesSeleccionadas().isEmpty()) {
                UUID opcionId = respuestaDto.opcionesSeleccionadas().get(0);
                Opcion opcion = opcionRepository.findById(opcionId).orElse(null);
                
                if (opcion != null && opcion.getEsCorrecta()) {
                    esCorrecta = true;
                    puntaje = pregunta.getPuntos();
                }
                
                // Guardar respuesta
                RespuestaEvaluacion respuesta = new RespuestaEvaluacion();
                respuesta.setIntentoId(intento);
                respuesta.setPreguntaId(pregunta);
                respuesta.setOpcionId(opcion);
                respuesta.setEsCorrecta(esCorrecta);
                respuesta.setPuntajeOtorgado(puntaje);
                respuesta.setCreadoEn(Instant.now());
                respuesta.setActualizadoEn(Instant.now());
                respuestaRepository.save(respuesta);
            }
        } else if (pregunta.getTipo() == TipoPregunta.respuesta_libre) {
            // Las preguntas de texto requieren revisión manual
            RespuestaEvaluacion respuesta = new RespuestaEvaluacion();
            respuesta.setIntentoId(intento);
            respuesta.setPreguntaId(pregunta);
            respuesta.setTextoRespuesta(respuestaDto.respuestaTexto());
            respuesta.setPuntajeOtorgado(BigDecimal.ZERO);
            respuesta.setCreadoEn(Instant.now());
            respuesta.setActualizadoEn(Instant.now());
            respuestaRepository.save(respuesta);
        }
        
        return puntaje;
    }
    
    private PreguntaResultadoDto crearResultadoPregunta(Pregunta pregunta, RespuestaDto respuestaDto, BigDecimal puntajeObtenido) {
        boolean correcta = puntajeObtenido.compareTo(BigDecimal.ZERO) > 0;
        String respuestaEstudiante = "";
        String respuestaCorrecta = "";
        
        if (pregunta.getTipo() == TipoPregunta.opcion_unica
                || pregunta.getTipo() == TipoPregunta.opcion_multiple
                || pregunta.getTipo() == TipoPregunta.verdadero_falso) {
            // Obtener texto de la opción seleccionada
            if (respuestaDto.opcionesSeleccionadas() != null && !respuestaDto.opcionesSeleccionadas().isEmpty()) {
                Opcion opcionSel = opcionRepository.findById(respuestaDto.opcionesSeleccionadas().get(0)).orElse(null);
                if (opcionSel != null) {
                    respuestaEstudiante = opcionSel.getTexto();
                }
            }
            
            // Obtener opción correcta
            List<Opcion> opciones = opcionRepository.findByPreguntaIdIdOrderByOrdenAsc(pregunta.getId());
            for (Opcion op : opciones) {
                if (op.getEsCorrecta()) {
                    respuestaCorrecta = op.getTexto();
                    break;
                }
            }
        } else {
            respuestaEstudiante = respuestaDto.respuestaTexto();
            respuestaCorrecta = "Requiere revisión manual";
        }
        
        return new PreguntaResultadoDto(
                pregunta.getId(),
                pregunta.getEnunciado(),
                pregunta.getTipo().name(),
                pregunta.getPuntos(),
                puntajeObtenido,
                correcta,
                respuestaEstudiante,
                respuestaCorrecta,
                pregunta.getRetroalimentacion()
        );
    }
    
    private PreguntaResultadoDto crearResultadoDesdeRespuesta(RespuestaEvaluacion resp) {
        Pregunta pregunta = resp.getPreguntaId();
        String respuestaEstudiante = resp.getOpcionId() != null ? resp.getOpcionId().getTexto() : resp.getTextoRespuesta();
        String respuestaCorrecta = "";
        
        if (pregunta.getTipo() == TipoPregunta.opcion_unica
                || pregunta.getTipo() == TipoPregunta.opcion_multiple
                || pregunta.getTipo() == TipoPregunta.verdadero_falso) {
            List<Opcion> opciones = opcionRepository.findByPreguntaIdIdOrderByOrdenAsc(pregunta.getId());
            for (Opcion op : opciones) {
                if (op.getEsCorrecta()) {
                    respuestaCorrecta = op.getTexto();
                    break;
                }
            }
        } else {
            respuestaCorrecta = "Requiere revisión manual";
        }
        
        return new PreguntaResultadoDto(
                pregunta.getId(),
                pregunta.getEnunciado(),
                pregunta.getTipo().name(),
                pregunta.getPuntos(),
                resp.getPuntajeOtorgado(),
                resp.getEsCorrecta() != null ? resp.getEsCorrecta() : false,
                respuestaEstudiante,
                respuestaCorrecta,
                resp.getRetroalimentacion()
        );
    }

    // === MAPPERS ===
    
    private EvaluacionResponse toResponse(Evaluacion e, UUID usuarioId) {
        long totalPreguntas = preguntaRepository.countByEvaluacionIdId(e.getId());
        int misIntentos = intentoRepository.countByEstudianteIdIdAndEvaluacionIdId(usuarioId, e.getId());
        
        return new EvaluacionResponse(
                e.getId(),
                e.getActividadId().getId(),
                e.getTitulo(),
                e.getDescripcion(),
                e.getNotaMaxima(),
                e.getIntentosPermitidos(),
                e.getDuracionMinutos(),
                e.getAleatorizarPreguntas(),
                e.getMostrarResultadoInmediato(),
                (int) totalPreguntas,
                misIntentos
        );
    }
    
    private PreguntaIntentoDto toPreguntaIntentoDto(Pregunta p) {
        List<Opcion> opciones = opcionRepository.findByPreguntaIdIdOrderByOrdenAsc(p.getId());
        
        // No revelar cuáles son las correctas
        List<OpcionDto> opcionesDto = opciones.stream()
                .map(o -> new OpcionDto(o.getId(), o.getTexto(), o.getOrden()))
                .toList();
        
        return new PreguntaIntentoDto(
                p.getId(),
                p.getOrden(),
                p.getTipo().name(),
                p.getEnunciado(),
                p.getDescripcion(),
                p.getPuntos(),
                opcionesDto
        );
    }
}
