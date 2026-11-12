package com.inkaquest.modules.identidad.service;

import com.inkaquest.modules.identidad.dto.SolicitudDocenteRequest;
import com.inkaquest.modules.identidad.dto.SolicitudDocenteResponse;
import com.inkaquest.modules.identidad.dto.SolicitudDocenteRevisionRequest;
import com.inkaquest.modules.identidad.entity.SolicitudDocente;
import com.inkaquest.modules.identidad.repository.PerfilRepository;
import com.inkaquest.modules.identidad.repository.SolicitudDocenteRepository;
import com.inkaquest.shared.enums.EstadoSolicitudDocente;
import com.inkaquest.shared.enums.RolUsuario;
import com.inkaquest.shared.exception.BadRequestException;
import com.inkaquest.shared.exception.ResourceNotFoundException;
import com.inkaquest.shared.security.RlsExecutor;
import org.springframework.stereotype.Service;
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

    private final SolicitudDocenteRepository solicitudDocenteRepository;
    private final PerfilRepository perfilRepository;
    private final com.inkaquest.modules.auditoria.service.AuditoriaService auditoriaService;
    private final RlsExecutor rlsExecutor;

    public SolicitudDocenteService(SolicitudDocenteRepository solicitudDocenteRepository,
                                   PerfilRepository perfilRepository,
                                   com.inkaquest.modules.auditoria.service.AuditoriaService auditoriaService,
                                   RlsExecutor rlsExecutor) {
        this.solicitudDocenteRepository = solicitudDocenteRepository;
        this.perfilRepository = perfilRepository;
        this.auditoriaService = auditoriaService;
        this.rlsExecutor = rlsExecutor;
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

            return SolicitudDocenteResponse.from(solicitudDocenteRepository.save(s));
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
        return rlsExecutor.executeAsSystem(() -> {
            SolicitudDocente s = solicitudDocenteRepository.findById(solicitudId)
                    .orElseThrow(() -> new ResourceNotFoundException("Solicitud no encontrada."));

            if (s.getEstado() != EstadoSolicitudDocente.pendiente) {
                throw new BadRequestException("Solo las solicitudes pendientes pueden aprobarse.");
            }

            com.inkaquest.modules.identidad.entity.Perfil perfil = s.getUsuarioId();
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
            return SolicitudDocenteResponse.from(solicitudDocenteRepository.save(s));
        });
    }

    /** Rechaza una solicitud con motivo. */
    public SolicitudDocenteResponse rechazar(UUID revisorId, UUID solicitudId,
                                             SolicitudDocenteRevisionRequest request) {
        return rlsExecutor.executeAsSystem(() -> {
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
            return SolicitudDocenteResponse.from(solicitudDocenteRepository.save(s));
        });
    }

    private static String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }
}
