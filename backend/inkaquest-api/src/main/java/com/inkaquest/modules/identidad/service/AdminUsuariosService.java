package com.inkaquest.modules.identidad.service;

import com.inkaquest.modules.identidad.dto.PerfilResponse;
import com.inkaquest.modules.identidad.entity.Perfil;
import com.inkaquest.modules.identidad.repository.PerfilRepository;
import com.inkaquest.modules.identidad.repository.SolicitudDocenteRepository;
import com.inkaquest.modules.identidad.dto.SolicitudDocenteResponse;
import com.inkaquest.modules.identidad.entity.SolicitudDocente;
import com.inkaquest.shared.enums.EstadoSolicitudDocente;
import com.inkaquest.shared.enums.RolUsuario;
import com.inkaquest.shared.exception.BadRequestException;
import com.inkaquest.shared.exception.ResourceNotFoundException;
import com.inkaquest.shared.exception.UnauthorizedException;
import com.inkaquest.shared.security.CheckRoleService;
import com.inkaquest.shared.security.RlsExecutor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Servicio de administracion de usuarios (secciones 11 y 12): listados
 * paginados por rol y detalle de un usuario. Solo administrador.
 */
@Service
public class AdminUsuariosService {

    private final CheckRoleService checkRoleService;
    private final PerfilRepository perfilRepository;
    private final SolicitudDocenteRepository solicitudRepository;
    private final com.inkaquest.modules.auditoria.service.AuditoriaService auditoriaService;
    private final RlsExecutor rlsExecutor;

    public AdminUsuariosService(CheckRoleService checkRoleService,
                                PerfilRepository perfilRepository,
                                SolicitudDocenteRepository solicitudRepository,
                                com.inkaquest.modules.auditoria.service.AuditoriaService auditoriaService,
                                RlsExecutor rlsExecutor) {
        this.checkRoleService = checkRoleService;
        this.perfilRepository = perfilRepository;
        this.solicitudRepository = solicitudRepository;
        this.auditoriaService = auditoriaService;
        this.rlsExecutor = rlsExecutor;
    }

    /** Lista paginada por rol (+ q opcional sobre nombre/apellido/email). */
    @Transactional
    public Page<PerfilResponse> listarPorRol(UUID actorId, RolUsuario rol, String q, Pageable pageable) {
        exigirAdmin(actorId);
        return rlsExecutor.executeAs(actorId, () -> {
            Page<Perfil> page;
            if (q == null || q.isBlank()) {
                page = perfilRepository.findByRol(rol, pageable);
            } else {
                page = perfilRepository.buscarPorRol(rol, q.trim(), pageable);
            }
            return page.map(PerfilResponse::from);
        });
    }

    /** Detalle de un usuario. */
    @Transactional
    public PerfilResponse detalle(UUID actorId, UUID usuarioId) {
        exigirAdmin(actorId);
        return rlsExecutor.executeAs(actorId, () ->
                perfilRepository.findById(usuarioId)
                        .map(PerfilResponse::from)
                        .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado.")));
    }

    /** Cambia el estado de la cuenta de un usuario (activo o suspendido). Solo admin. */
    @Transactional
    public PerfilResponse cambiarEstadoCuenta(UUID actorId, UUID usuarioId,
                                              com.inkaquest.shared.enums.EstadoCuenta estado) {
        exigirAdmin(actorId);
        if (usuarioId.equals(actorId)) {
            throw new BadRequestException("No puedes cambiar el estado de tu propia cuenta.");
        }
        if (estado != com.inkaquest.shared.enums.EstadoCuenta.activo
                && estado != com.inkaquest.shared.enums.EstadoCuenta.suspendido) {
            throw new BadRequestException("Solo se permite pasar a activo o suspendido.");
        }
        return rlsExecutor.executeAs(actorId, () -> {
            Perfil perfil = perfilRepository.findById(usuarioId)
                    .orElseThrow(() -> new ResourceNotFoundException("El perfil del usuario no existe."));
            String estadoAnterior = perfil.getEstadoCuenta() != null
                    ? perfil.getEstadoCuenta().getValor() : "desconocido";
            perfil.setEstadoCuenta(estado);
            Perfil guardado = perfilRepository.save(perfil);
            auditoriaService.registrar(com.inkaquest.shared.enums.TipoAccion.actualizar,
                    actorId, usuarioId,
                    "perfil", usuarioId,
                    java.util.Map.of("estado_cuenta", estadoAnterior),
                    java.util.Map.of("estado_cuenta", estado.getValor()),
                    true, null);
            return PerfilResponse.from(guardado);
        });
    }

    /** Solicitudes de docente filtradas por estado. */
    @Transactional
    public List<SolicitudDocenteResponse> solicitudesPorEstado(UUID actorId, EstadoSolicitudDocente estado) {
        exigirAdmin(actorId);
        if (estado == null) {
            throw new BadRequestException("El estado de la solicitud es obligatorio.");
        }
        return rlsExecutor.executeAs(actorId, () ->
                solicitudRepository.findByEstadoOrderByCreadoEnDesc(estado).stream()
                        .map(SolicitudDocenteResponse::from)
                        .toList());
    }

    private void exigirAdmin(UUID actorId) {
        if (checkRoleService.rolDe(actorId) != RolUsuario.administrador) {
            throw new UnauthorizedException("Solo administradores pueden acceder a este recurso.");
        }
    }
}
