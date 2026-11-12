package com.inkaquest.modules.academico.service;

import com.inkaquest.modules.academico.entity.Curso;
import com.inkaquest.modules.academico.repository.DocenteCursoRepository;
import com.inkaquest.shared.enums.RolUsuario;
import com.inkaquest.shared.exception.UnauthorizedException;
import com.inkaquest.shared.security.CheckRoleService;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Resolucion centralizada de permisos de escritura de un curso.
 *
 * <p>Un usuario puede modificar la estructura/contenido de un curso si es
 * administrador, si es el creador del curso, o si es un docente con
 * asignacion activa en {@code public.docente_curso}. Vive en un unico
 * sitio para que no haya reglas divergentes entre servicios.</p>
 */
@Service
public class CursoAccessService {

    private final CheckRoleService checkRoleService;
    private final DocenteCursoRepository docenteCursoRepository;

    public CursoAccessService(CheckRoleService checkRoleService,
                              DocenteCursoRepository docenteCursoRepository) {
        this.checkRoleService = checkRoleService;
        this.docenteCursoRepository = docenteCursoRepository;
    }

    /** true si el actor puede escribir el curso (admin / creador / docente asignado activo). */
    public boolean puedeEscribir(Curso curso, UUID actorId) {
        RolUsuario rol = checkRoleService.rolDe(actorId);
        if (rol == RolUsuario.administrador) {
            return true;
        }
        if (rol == RolUsuario.docente) {
            boolean esCreador = curso.getCreadoPor() != null
                    && actorId.equals(curso.getCreadoPor().getId());
            return esCreador
                    || docenteCursoRepository.findActiva(actorId, curso.getId()).isPresent();
        }
        return false;
    }

    /** Exige permiso de escritura; lanza UnauthorizedException si no lo tiene. */
    public void exigirEscritura(Curso curso, UUID actorId) {
        if (!puedeEscribir(curso, actorId)) {
            throw new UnauthorizedException("No tienes permiso para modificar este curso.");
        }
    }

    /** Exige rol administrador; lanza UnauthorizedException si no lo tiene. */
    public void exigirAdmin(UUID actorId, String mensaje) {
        if (checkRoleService.rolDe(actorId) != RolUsuario.administrador) {
            throw new UnauthorizedException(mensaje);
        }
    }
}
