package com.inkaquest.modules.identidad.service;

import com.inkaquest.modules.identidad.dto.SolicitudDocenteRequest;
import com.inkaquest.modules.identidad.dto.SolicitudDocenteResponse;
import com.inkaquest.modules.identidad.dto.SolicitudDocenteRevisionRequest;
import com.inkaquest.modules.identidad.entity.SolicitudDocente;
import com.inkaquest.modules.identidad.entity.Perfil;
import com.inkaquest.modules.identidad.repository.PerfilRepository;
import com.inkaquest.modules.identidad.repository.SolicitudDocenteRepository;
import com.inkaquest.modules.soporte.entity.Notificacion;
import com.inkaquest.modules.soporte.entity.NotificacionDestinatario;
import com.inkaquest.modules.soporte.repository.NotificacionDestinatarioRepository;
import com.inkaquest.modules.soporte.repository.NotificacionRepository;
import com.inkaquest.shared.enums.CanalNotificacion;
import com.inkaquest.shared.enums.EstadoNotificacion;
import com.inkaquest.shared.enums.EstadoSolicitudDocente;
import com.inkaquest.shared.enums.RolUsuario;
import com.inkaquest.shared.exception.BadRequestException;
import com.inkaquest.shared.exception.ResourceNotFoundException;
import com.inkaquest.shared.security.RlsExecutor;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Service;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Servicio del flujo de solicitud de docente.
 *
 * <p>RLS restringe acceso a filas según rol y relación propiedad/curso.</p>
 */
@Service
public class SolicitudDocenteService {

    private static final Logger LOG = Logger.getLogger(SolicitudDocenteService.class.getName());

    private final SolicitudDocenteRepository solicitudDocenteRepository;
    private final PerfilRepository perfilRepository;
    private final com.inkaquest.modules.auditoria.service.AuditoriaService auditoriaService;
    private final RlsExecutor rlsExecutor;
    @PersistenceContext
    private EntityManager entityManager;
    private final NotificacionRepository notificacionRepository;
    private final NotificacionDestinatarioRepository notificacionDestinatarioRepository;

    public SolicitudDocenteService(SolicitudDocenteRepository solicitudDocenteRepository,
                                   PerfilRepository perfilRepository,
                                   com.inkaquest.modules.auditoria.service.AuditoriaService auditoriaService,
                                   RlsExecutor rlsExecutor,
                                   NotificacionRepository notificacionRepository,
                                   NotificacionDestinatarioRepository notificacionDestinatarioRepository) {
        this.solicitudDocenteRepository = solicitudDocenteRepository;
        this.perfilRepository = perfilRepository;
        this.auditoriaService = auditoriaService;
        this.rlsExecutor = rlsExecutor;
        this.notificacionRepository = notificacionRepository;
        this.notificacionDestinatarioRepository = notificacionDestinatarioRepository;
    }

    /** Crea una nueva solicitud de docente para el usuario autenticado. */
    public SolicitudDocenteResponse crear(UUID usuarioId, SolicitudDocenteRequest request) {
        return rlsExecutor.executeAs(usuarioId, () -> {
            com.inkaquest.modules.identidad.entity.Perfil perfil = perfilRepository.findById(usuarioId)
                    .orElseThrow(() -> new ResourceNotFoundException("Perfil no encontrado."));

            // Sólo estudiantes o docentes pueden solicitar cambio/promoción.
            RolUsuario rol = perfil.getRol();
            if (rol != RolUsuario.estudiante && rol != RolUsuario.docente) {
                throw new BadRequestException("Solo estudiantes o docentes pueden solicitar un cambio de rol.");
            }

            List<SolicitudDocente> previas =
                    solicitudDocenteRepository.findByUsuarioId_IdOrderByCreadoEnDesc(usuarioId);
            boolean pendiente = previas.stream()
                    .anyMatch(s -> s.getEstado() == EstadoSolicitudDocente.pendiente);
            if (pendiente) {
                throw new BadRequestException(
                        "Ya tienes una solicitud de docente pendiente de revisión.");
            }

            SolicitudDocente s = new SolicitudDocente();
            s.setUsuarioId(perfil);
            s.setEstado(EstadoSolicitudDocente.pendiente);
            s.setInstitucion(request.institucion().trim());
            s.setEspecialidad(blankToNull(request.especialidad()));
            s.setCodigoDocente(blankToNull(request.codigoDocente()));
            s.setMotivo(request.motivo().trim());
            Map<String, Object> adj = request.documentosAdjuntos();
            s.setDocumentosAdjuntos(adj == null ? Map.of() : adj);

            try {
                return SolicitudDocenteResponse.from(solicitudDocenteRepository.saveAndFlush(s));
            } catch (org.springframework.dao.DataIntegrityViolationException ex) {
                // Índice parcial solicitud_docente_unica_pendiente: carrera ganada
                // a otro intento del mismo usuario (doble envío).
                String detalle = ex.getMostSpecificCause() != null ? ex.getMostSpecificCause().getMessage() : "";
                if (detalle != null && detalle.contains("solicitud_docente_unica_pendiente")) {
                    throw new BadRequestException("Ya tienes una solicitud de docente pendiente de revisión.");
                }
                throw ex;
            }
        });
    }

    /** Devuelve las solicitudes del usuario autenticado. */
    public List<SolicitudDocenteResponse> misSolicitudes(UUID usuarioId) {
        return rlsExecutor.executeAs(usuarioId, () -> solicitudDocenteRepository
                .findByUsuarioId_IdOrderByCreadoEnDesc(usuarioId)
                .stream()
                .map(SolicitudDocenteResponse::from)
                .toList());
    }

    /** Lista las solicitudes pendientes para revisión (sólo admin). */
    public List<SolicitudDocenteResponse> listarPendientes() {
        return rlsExecutor.executeAsSystem(() ->
                solicitudDocenteRepository.findByEstadoOrderByCreadoEnDesc(
                                EstadoSolicitudDocente.pendiente)
                        .stream()
                        .map(SolicitudDocenteResponse::from)
                        .toList());
    }

    /** Aprueba una solicitud de docente: cambio de rol del perfil + marca solicitud como aprobada. */
    public SolicitudDocenteResponse aprobar(UUID revisorId, UUID solicitudId,
                                            SolicitudDocenteRevisionRequest request) {
        ResultadoRevision resultado = rlsExecutor.executeAsSystem(() -> {
            escribirFlagSistema(true);
            try {
            SolicitudDocente s = solicitudDocenteRepository.findById(solicitudId)
                    .orElseThrow(() -> new ResourceNotFoundException("Solicitud no encontrada."));

            if (s.getEstado() != EstadoSolicitudDocente.pendiente) {
                throw new BadRequestException("Solo las solicitudes pendientes pueden aprobarse.");
            }

            Perfil perfil = s.getUsuarioId();
            perfil.setRol(RolUsuario.docente);

            s.setEstado(EstadoSolicitudDocente.aprobada);
            s.setRevisadoPor(perfilRepository.findById(revisorId).orElseThrow(
                    () -> new ResourceNotFoundException("Perfil del revisor no encontrado.")));
            s.setRevisadoEn(Instant.now());
            s.setMotivoRevision(request.motivoRevision().trim());

            perfilRepository.save(perfil);
            auditoriaService.registrar(com.inkaquest.shared.enums.TipoAccion.aprobar,
                    revisorId, s.getUsuarioId().getId(),
                    "solicitud_docente", solicitudId,
                    Map.of("rol", "estudiante"),
                    Map.of("rol", "docente"),
                    true, null);
            SolicitudDocenteResponse respuesta = SolicitudDocenteResponse.from(solicitudDocenteRepository.save(s));
            return new ResultadoRevision(respuesta, perfil.getId(), s.getRevisadoPor().getId(), solicitudId, request.motivoRevision());
            } finally {
                escribirFlagSistema(false);
            }
        });
        notificarSeguro(resultado, true);
        return resultado.respuesta();
    }

    /** Rechaza una solicitud con motivo. */
    public SolicitudDocenteResponse rechazar(UUID revisorId, UUID solicitudId,
                                             SolicitudDocenteRevisionRequest request) {
        ResultadoRevision resultado = rlsExecutor.executeAsSystem(() -> {
            SolicitudDocente s = solicitudDocenteRepository.findById(solicitudId)
                    .orElseThrow(() -> new ResourceNotFoundException("Solicitud no encontrada."));

            if (s.getEstado() != EstadoSolicitudDocente.pendiente) {
                throw new BadRequestException("Solo las solicitudes pendientes pueden rechazarse.");
            }

            s.setEstado(EstadoSolicitudDocente.rechazada);
            s.setRevisadoPor(perfilRepository.findById(revisorId).orElseThrow(
                    () -> new ResourceNotFoundException("Perfil del revisor no encontrado.")));
            s.setRevisadoEn(Instant.now());
            s.setMotivoRevision(request.motivoRevision().trim());

            auditoriaService.registrar(com.inkaquest.shared.enums.TipoAccion.rechazar,
                    revisorId, s.getUsuarioId().getId(),
                    "solicitud_docente", solicitudId,
                    null,
                    Map.of("motivo", request.motivoRevision().trim()),
                    true, null);
            SolicitudDocenteResponse respuesta = SolicitudDocenteResponse.from(solicitudDocenteRepository.save(s));
            return new ResultadoRevision(respuesta, s.getUsuarioId().getId(), s.getRevisadoPor().getId(), solicitudId, request.motivoRevision());
        });
        notificarSeguro(resultado, false);
        return resultado.respuesta();
    }

    /** Datos de la resolución ya confirmada, para notificar fuera de la transacción. */
    private record ResultadoRevision(SolicitudDocenteResponse respuesta, UUID estudianteId,
                                     UUID revisorId, UUID solicitudId, String motivo) {}

    /**
     * Activa/desactiva el flag de escritura del sistema en la MISMA conexión
     * de la transacción JPA. JdbcTemplate abriría otra conexión (JpaTransactionManager)
     * y el trigger no vería el flag.
     */
    private void escribirFlagSistema(boolean activar) {
        String sql = activar
                ? "select public.fn_activar_escritura_sistema()"
                : "select public.fn_desactivar_escritura_sistema()";
        entityManager.createNativeQuery(sql).getSingleResult();
    }

    /** La notificación es best-effort: nunca debe hacer fallar una aprobación/rechazo. */
    private void notificarSeguro(ResultadoRevision resultado, boolean aprobada) {
        try {
            notificarResolucion(resultado.estudianteId(), resultado.revisorId(), aprobada,
                    resultado.motivo(), resultado.solicitudId());
        } catch (Exception e) {
            LOG.log(Level.WARNING, "No se pudo notificar la resolución de la solicitud "
                    + resultado.solicitudId() + ": " + e.getMessage(), e);
        }
    }

    /**
     * Notifica al estudiante solicitante la resolución del administrador,
     * incluyendo el mensaje (motivo) de la revisión. El destinatario queda
     * explícito en la notificación para que la RLS de lectura le permita verla.
     */
    private void notificarResolucion(UUID destinatarioId, UUID revisorId,
                                     boolean aprobada, String motivo, UUID solicitudId) {
        String observacion = motivo == null ? "" : motivo.trim();
        Notificacion notificacion = new Notificacion();
        notificacion.setTitulo(aprobada
                ? "Solicitud de docente aprobada"
                : "Solicitud de docente rechazada");
        notificacion.setMensaje((aprobada
                ? "Tu solicitud para ser docente fue aprobada. Ya tienes acceso al panel docente."
                : "Tu solicitud para ser docente fue rechazada.")
                + (observacion.isEmpty() ? "" : " Observación del administrador: " + observacion));
        notificacion.setVariables(Map.of());
        notificacion.setCanal(CanalNotificacion.in_app);
        notificacion.setDestinatarioId(perfilRepository.getReferenceById(destinatarioId));
        notificacion.setEntidadTipo("solicitud_docente");
        notificacion.setEntidadId(solicitudId);
        notificacion.setEnviadaEn(Instant.now());
        notificacion.setClaveIdempotencia("solicitud-docente-" + solicitudId + (aprobada ? "-aprobada" : "-rechazada"));
        notificacion.setCreadoPor(perfilRepository.getReferenceById(revisorId));
        Notificacion guardada = notificacionRepository.save(notificacion);

        NotificacionDestinatario entrega = new NotificacionDestinatario();
        entrega.setNotificacionId(guardada);
        entrega.setUsuarioId(perfilRepository.getReferenceById(destinatarioId));
        entrega.setCanal(CanalNotificacion.in_app);
        entrega.setEstado(EstadoNotificacion.enviada);
        entrega.setEnviadaEn(Instant.now());
        notificacionDestinatarioRepository.save(entrega);
    }

    private static String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }
}
