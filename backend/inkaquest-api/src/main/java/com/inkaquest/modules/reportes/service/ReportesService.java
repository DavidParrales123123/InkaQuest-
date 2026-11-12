package com.inkaquest.modules.reportes.service;

import com.inkaquest.modules.academico.entity.Curso;
import com.inkaquest.modules.academico.repository.CursoRepository;
import com.inkaquest.modules.academico.service.CursoAccessService;
import com.inkaquest.modules.comercio.repository.PedidoRepository;
import com.inkaquest.modules.identidad.repository.PerfilRepository;
import com.inkaquest.modules.matriculas.repository.MatriculaRepository;
import com.inkaquest.modules.reportes.dto.RendimientoCursoResponse;
import com.inkaquest.modules.reportes.dto.ResumenAdminResponse;
import com.inkaquest.shared.enums.*;
import com.inkaquest.shared.exception.ResourceNotFoundException;
import com.inkaquest.shared.exception.UnauthorizedException;
import com.inkaquest.shared.security.CheckRoleService;
import com.inkaquest.shared.security.RlsExecutor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Reportes y analitica para roles autorizados.
 *
 * <p>Los agregados de administracion solo son visibles para administradores.
 * El rendimiento de un curso solo para su creador/docente asignado o un admin.</p>
 */
@Service
public class ReportesService {

    private final PerfilRepository perfilRepository;
    private final CursoRepository cursoRepository;
    private final MatriculaRepository matriculaRepository;
    private final PedidoRepository pedidoRepository;
    private final CheckRoleService checkRoleService;
    private final CursoAccessService cursoAccessService;
    private final RlsExecutor rlsExecutor;

    public ReportesService(PerfilRepository perfilRepository,
                           CursoRepository cursoRepository,
                           MatriculaRepository matriculaRepository,
                           PedidoRepository pedidoRepository,
                           CheckRoleService checkRoleService,
                           CursoAccessService cursoAccessService,
                           RlsExecutor rlsExecutor) {
        this.perfilRepository = perfilRepository;
        this.cursoRepository = cursoRepository;
        this.matriculaRepository = matriculaRepository;
        this.pedidoRepository = pedidoRepository;
        this.checkRoleService = checkRoleService;
        this.cursoAccessService = cursoAccessService;
        this.rlsExecutor = rlsExecutor;
    }

    /** Resumen administrativo global. */
    @Transactional
    public ResumenAdminResponse resumenAdmin(UUID actorId) {
        exigirAdmin(actorId);
        return rlsExecutor.executeAs(actorId, () -> new ResumenAdminResponse(
                perfilRepository.countByRol(RolUsuario.estudiante),
                perfilRepository.countByRol(RolUsuario.docente),
                perfilRepository.countByRol(RolUsuario.administrador),
                cursoRepository.countByEstado(EstadoCurso.publicado),
                cursoRepository.countByEstado(EstadoCurso.borrador),
                cursoRepository.count(),
                matriculaRepository.countByEstado(EstadoMatricula.activa),
                matriculaRepository.countByEstado(EstadoMatricula.completada),
                matriculaRepository.count(),
                pedidoRepository.countByEstado(EstadoPedido.pagado),
                pedidoRepository.countByEstado(EstadoPedido.pendiente),
                pedidoRepository.totalRecaudado(EstadoPedido.pagado, "PEN"),
                pedidoRepository.totalRecaudado(EstadoPedido.pagado, "USD")));
    }

    /** Rendimiento de un curso para quien puede verlo. */
    @Transactional
    public RendimientoCursoResponse rendimientoCurso(UUID actorId, String cursoSlug) {
        return rlsExecutor.executeAs(actorId, () -> {
            Curso curso = cursoRepository.findBySlug(cursoSlug)
                    .orElseThrow(() -> new ResourceNotFoundException("Curso no encontrado."));
            if (!cursoAccessService.puedeEscribir(curso, actorId)) {
                throw new UnauthorizedException("Solo el docente del curso o un administrador puede ver este reporte.");
            }
            List<EstadoMatricula> estados = List.of(EstadoMatricula.activa, EstadoMatricula.completada);
            var matriculados = matriculaRepository.findMatriculadosCurso(curso.getId(), estados);
            long total = matriculados.size();
            long completados = matriculados.stream()
                    .filter(m -> m.getEstado() == EstadoMatricula.completada)
                    .count();
            long activos = total - completados;
            BigDecimal progreso = matriculaRepository.progresoPromedio(curso.getId(), estados);

            return new RendimientoCursoResponse(
                    curso.getId(),
                    curso.getTitulo(),
                    curso.getSlug(),
                    activos,
                    completados,
                    total,
                    progreso);
        });
    }

    private void exigirAdmin(UUID actorId) {
        if (checkRoleService.rolDe(actorId) != RolUsuario.administrador) {
            throw new UnauthorizedException("Solo administradores pueden consultar este reporte.");
        }
    }
}
