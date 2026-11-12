package com.inkaquest.modules.matriculas.service;

import com.inkaquest.modules.academico.entity.Curso;
import com.inkaquest.modules.academico.repository.CursoRepository;
import com.inkaquest.modules.academico.service.CursoAccessService;
import com.inkaquest.modules.identidad.entity.Perfil;
import com.inkaquest.modules.identidad.repository.PerfilRepository;
import com.inkaquest.modules.matriculas.dto.EstudianteEnCursoResponse;
import com.inkaquest.modules.matriculas.dto.MatriculaRequest;
import com.inkaquest.modules.matriculas.dto.MatriculaResponse;
import com.inkaquest.modules.matriculas.entity.Matricula;
import com.inkaquest.modules.matriculas.repository.MatriculaRepository;
import com.inkaquest.shared.enums.EstadoCurso;
import com.inkaquest.shared.enums.EstadoMatricula;
import com.inkaquest.shared.exception.BadRequestException;
import com.inkaquest.shared.exception.ResourceNotFoundException;
import com.inkaquest.shared.security.RlsExecutor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Servicio de matrícula. La transacción se abre con RLS vigente: el usuario
 * solo ve sus propias filas.
 */
@Service
public class MatriculaService {

    private final MatriculaRepository matriculaRepository;
    private final PerfilRepository perfilRepository;
    private final CursoRepository cursoRepository;
    private final CursoAccessService cursoAccessService;
    private final RlsExecutor rlsExecutor;

    public MatriculaService(MatriculaRepository matriculaRepository,
                            PerfilRepository perfilRepository,
                            CursoRepository cursoRepository,
                            CursoAccessService cursoAccessService,
                            RlsExecutor rlsExecutor) {
        this.matriculaRepository = matriculaRepository;
        this.perfilRepository = perfilRepository;
        this.cursoRepository = cursoRepository;
        this.cursoAccessService = cursoAccessService;
        this.rlsExecutor = rlsExecutor;
    }

    /** Lista las matrículas visibles del estudiante autenticado. */
    public List<MatriculaResponse> misMatriculas(UUID estudianteId) {
        return rlsExecutor.executeAs(estudianteId, () ->
                matriculaRepository.findAllDeEstudiante(estudianteId).stream()
                        .map(MatriculaResponse::from)
                        .toList());
    }

    /** Inscribe al estudiante autenticado en un curso publicado. */
    public MatriculaResponse matricularme(UUID estudianteId, MatriculaRequest request) {
        return rlsExecutor.executeAs(estudianteId, () -> {
            Perfil perfil = perfilRepository.findById(estudianteId)
                    .orElseThrow(() -> new ResourceNotFoundException("Perfil no encontrado."));

            Curso curso = cursoRepository.findBySlug(request.cursoSlug())
                    .orElseThrow(() -> new ResourceNotFoundException("Curso no encontrado."));

            if (curso.getEstado() != EstadoCurso.publicado) {
                throw new BadRequestException("Ese curso aún no está publicado.");
            }

            if (matriculaRepository.findByEstudianteIdAndCursoId(perfil, curso).isPresent()) {
                throw new BadRequestException("Ya estás matriculado en este curso.");
            }

            Matricula m = new Matricula();
            m.setEstudianteId(perfil);
            m.setCursoId(curso);
            m.setEstado(EstadoMatricula.activa);
            m.setPrecioPagado(curso.getPrecio());
            m.setMoneda(curso.getMoneda());
            m.setPorcentajeProgreso(java.math.BigDecimal.ZERO);
            m.setXpGanado(0);
            m.setMatriculadoEn(Instant.now());
            return MatriculaResponse.from(matriculaRepository.save(m));
        });
    }

    /** Lista los alumnos matriculados en un curso (creador/docente asignado/admin). */
    public List<EstudianteEnCursoResponse> estudiantesDelCurso(UUID actorId, String cursoSlug) {
        return rlsExecutor.executeAs(actorId, () -> {
            Curso curso = cursoRepository.findBySlug(cursoSlug)
                    .orElseThrow(() -> new ResourceNotFoundException("Curso no encontrado: " + cursoSlug));
            cursoAccessService.exigirEscritura(curso, actorId);
            return matriculaRepository.findMatriculadosCurso(curso.getId(),
                            List.of(EstadoMatricula.activa, EstadoMatricula.completada))
                    .stream()
                    .map(EstudianteEnCursoResponse::from)
                    .toList();
        });
    }

    /** Cancela una de sus propias matrículas (pasa a estado `cancelada`). */
    public MatriculaResponse cancelar(UUID estudianteId, UUID matriculaId) {
        return rlsExecutor.executeAs(estudianteId, () -> {
            Matricula m = matriculaRepository.findById(matriculaId)
                    .orElseThrow(() -> new ResourceNotFoundException("Matrícula no encontrada."));
            if (!estudianteId.equals(m.getEstudianteId().getId())) {
                throw new com.inkaquest.shared.exception.UnauthorizedException(
                        "No puedes cancelar una matrícula ajena.");
            }
            if (m.getEstado() != EstadoMatricula.activa) {
                throw new BadRequestException("Solo se pueden cancelar matrículas activas.");
            }
            m.setEstado(EstadoMatricula.cancelada);
            m.setCanceladoEn(Instant.now());
            return MatriculaResponse.from(matriculaRepository.save(m));
        });
    }
}
