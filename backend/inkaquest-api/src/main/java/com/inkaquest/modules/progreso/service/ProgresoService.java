package com.inkaquest.modules.progreso.service;

import com.inkaquest.modules.academico.entity.Curso;
import com.inkaquest.modules.academico.entity.Leccion;
import com.inkaquest.modules.academico.entity.Modulo;
import com.inkaquest.modules.academico.entity.Unidad;
import com.inkaquest.modules.academico.repository.LeccionRepository;
import com.inkaquest.modules.identidad.entity.Perfil;
import com.inkaquest.modules.identidad.repository.PerfilRepository;
import com.inkaquest.modules.matriculas.entity.Matricula;
import com.inkaquest.modules.matriculas.repository.MatriculaRepository;
import com.inkaquest.modules.progreso.dto.LeccionCompletadaResponse;
import com.inkaquest.modules.progreso.dto.ProgresoCursoResponse;
import com.inkaquest.modules.progreso.entity.ProgresoCurso;
import com.inkaquest.modules.progreso.entity.ProgresoLeccion;
import com.inkaquest.modules.progreso.entity.ProgresoUnidad;
import com.inkaquest.modules.progreso.repository.ProgresoCursoRepository;
import com.inkaquest.modules.progreso.repository.ProgresoLeccionRepository;
import com.inkaquest.modules.progreso.repository.ProgresoUnidadRepository;
import com.inkaquest.shared.enums.EstadoMatricula;
import com.inkaquest.shared.enums.EstadoProgreso;
import com.inkaquest.shared.exception.BadRequestException;
import com.inkaquest.shared.exception.ResourceNotFoundException;
import com.inkaquest.shared.security.RlsExecutor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Servicio de progreso academico del estudiante autenticado (seccion 16).
 * Toda la logica vive en una unica transaccion RLS.
 */
@Service
public class ProgresoService {

    private final ProgresoCursoRepository progresoRepository;
    private final ProgresoLeccionRepository progresoLeccionRepository;
    private final ProgresoUnidadRepository progresoUnidadRepository;
    private final LeccionRepository leccionRepository;
    private final MatriculaRepository matriculaRepository;
    private final PerfilRepository perfilRepository;
    private final com.inkaquest.modules.gamificacion.service.GamificacionRecorder gamificacionRecorder;
    private final RlsExecutor rlsExecutor;

    public ProgresoService(ProgresoCursoRepository progresoRepository,
                           ProgresoLeccionRepository progresoLeccionRepository,
                           ProgresoUnidadRepository progresoUnidadRepository,
                           LeccionRepository leccionRepository,
                           MatriculaRepository matriculaRepository,
                           PerfilRepository perfilRepository,
                           com.inkaquest.modules.gamificacion.service.GamificacionRecorder gamificacionRecorder,
                           RlsExecutor rlsExecutor) {
        this.progresoRepository = progresoRepository;
        this.progresoLeccionRepository = progresoLeccionRepository;
        this.progresoUnidadRepository = progresoUnidadRepository;
        this.leccionRepository = leccionRepository;
        this.matriculaRepository = matriculaRepository;
        this.perfilRepository = perfilRepository;
        this.gamificacionRecorder = gamificacionRecorder;
        this.rlsExecutor = rlsExecutor;
    }

    /** Lista los progresos del estudiante autenticado. */
    public List<ProgresoCursoResponse> misProgresos(UUID estudianteId) {
        return rlsExecutor.executeAs(estudianteId, () ->
                progresoRepository
                        .findByEstudianteId(
                                perfilRepository.findById(estudianteId).orElseThrow())
                        .stream()
                        .map(ProgresoCursoResponse::from)
                        .toList());
    }

    /**
     * Marca una leccion como completada para el estudiante autenticado.
     * Es idempotente: completar dos veces no duplica XP.
     */
    @Transactional
    public LeccionCompletadaResponse completarLeccion(UUID estudianteId, UUID leccionId) {
        return rlsExecutor.executeAs(estudianteId, () -> {
            Perfil estudiante = perfilRepository.findById(estudianteId)
                    .orElseThrow(() -> new ResourceNotFoundException("Perfil no encontrado."));

            Leccion leccion = leccionRepository.findById(leccionId)
                    .orElseThrow(() -> new ResourceNotFoundException("Leccion no encontrada."));
            Modulo modulo = leccion.getModuloId();
            Unidad unidad = modulo.getUnidadId();
            Curso curso = unidad.getCursoId();

            if (!Boolean.TRUE.equals(leccion.getPublicado())
                    || !Boolean.TRUE.equals(modulo.getPublicado())
                    || !Boolean.TRUE.equals(unidad.getPublicado())) {
                throw new BadRequestException("Esa leccion no esta publicada.");
            }

            Matricula matricula = matriculaRepository.findByEstudianteIdAndCursoId(estudiante, curso)
                    .orElseThrow(() -> new BadRequestException(
                            "Debes estar matriculado en el curso para completar una leccion."));
            if (matricula.getEstado() != EstadoMatricula.activa
                    && matricula.getEstado() != EstadoMatricula.completada) {
                throw new BadRequestException("Tu matricula en este curso no esta activa.");
            }

            ProgresoCurso progreso = progresoRepository.findByEstudianteIdAndCursoId(estudiante, curso)
                    .orElseGet(() -> {
                        ProgresoCurso p = new ProgresoCurso();
                        p.setMatriculaId(matricula);
                        p.setEstudianteId(estudiante);
                        p.setCursoId(curso);
                        p.setEstado(EstadoProgreso.en_progreso);
                        p.setPorcentaje(BigDecimal.ZERO);
                        p.setLeccionesCompletadas(0);
                        p.setMinutosEstudio(0);
                        p.setIniciadoEn(Instant.now());
                        p.setUltimaActividadEn(Instant.now());
                        return p;
                    });
            progreso = progresoRepository.save(progreso);
            final ProgresoCurso progresoPersistido = progreso;

            boolean yaCompletada = progresoLeccionRepository
                    .findDeEstudianteEnLeccion(estudianteId, leccionId)
                    .map(p -> p.getEstado() == EstadoProgreso.completado)
                    .orElse(false);

            int xpDelta = 0;
            int minutosDelta = 0;
            if (!yaCompletada) {
                ProgresoLeccion pl = progresoLeccionRepository
                        .findDeEstudianteEnLeccion(estudianteId, leccionId)
                        .orElseGet(() -> {
                            ProgresoLeccion nueva = new ProgresoLeccion();
                            nueva.setProgresoCursoId(progresoPersistido);
                            nueva.setEstudianteId(estudiante);
                            nueva.setLeccionId(leccion);
                            nueva.setIniciadoEn(Instant.now());
                            return nueva;
                        });
                pl.setEstado(EstadoProgreso.completado);
                pl.setPorcentaje(BigDecimal.valueOf(100));
                pl.setXpObtenido(leccion.getXpOtorgado() != null ? leccion.getXpOtorgado() : 0);
                pl.setMinutosEstudio(leccion.getDuracionMinutos() != null ? leccion.getDuracionMinutos() : 0);
                pl.setCompletadoEn(Instant.now());
                progresoLeccionRepository.save(pl);
                xpDelta = leccion.getXpOtorgado() != null ? leccion.getXpOtorgado() : 0;
                minutosDelta = leccion.getDuracionMinutos() != null ? leccion.getDuracionMinutos() : 0;

                // Acumula XP y minutos en perfil y matricula del estudiante.
                estudiante.setXp((estudiante.getXp() != null ? estudiante.getXp() : 0) + xpDelta);
                perfilRepository.save(estudiante);
                matricula.setXpGanado((matricula.getXpGanado() != null ? matricula.getXpGanado() : 0) + xpDelta);
                matriculaRepository.save(matricula);

                // Registro de gamificacion: transaccion de XP (si aplica) y racha.
                gamificacionRecorder.registrarActividad(estudiante,
                        com.inkaquest.shared.enums.ConceptoXp.leccion_completada,
                        leccionId, "Leccion", leccion.getTitulo(), xpDelta);
            }

            // Recomputo de porcentaje de unidad.
            BigDecimal porcentajeUnidad = recomputarUnidad(progreso, estudiante, unidad);

            // Recomputo de curso.
            long totalPublicadas = leccionRepository.findPublicadasDeCurso(curso.getId()).size();
            long completadas = progresoLeccionRepository
                    .findCompletadasDeCurso(estudianteId, curso.getId(), EstadoProgreso.completado)
                    .size();
            BigDecimal porcentajeCurso = porcentaje(completadas, totalPublicadas);

            progreso.setLeccionesCompletadas((int) completadas);
            progreso.setMinutosEstudio((progreso.getMinutosEstudio() != null ? progreso.getMinutosEstudio() : 0) + minutosDelta);
            progreso.setPorcentaje(porcentajeCurso);
            progreso.setUltimaActividadEn(Instant.now());
            boolean cursoCompletado = totalPublicadas > 0 && completadas >= totalPublicadas;
            if (cursoCompletado) {
                progreso.setEstado(EstadoProgreso.completado);
                progreso.setCompletadoEn(Instant.now());
                matricula.setEstado(EstadoMatricula.completada);
                matricula.setCompletadoEn(Instant.now());
            } else {
                progreso.setEstado(EstadoProgreso.en_progreso);
            }
            matricula.setPorcentajeProgreso(porcentajeCurso);
            matriculaRepository.save(matricula);
            progresoRepository.save(progreso);

            return new LeccionCompletadaResponse(
                    leccionId,
                    xpDelta,
                    (int) completadas,
                    (int) totalPublicadas,
                    porcentajeCurso,
                    cursoCompletado);
        });
    }

    private BigDecimal recomputarUnidad(ProgresoCurso progreso, Perfil estudiante, Unidad unidad) {
        long totalUnidad = leccionRepository.countPublicadasDeUnidad(unidad.getId());
        long completadasUnidad = progresoLeccionRepository
                .findCompletadasDeUnidad(estudiante.getId(), unidad.getId(), EstadoProgreso.completado)
                .size();
        BigDecimal porcentajeUnidad = porcentaje(completadasUnidad, totalUnidad);

        ProgresoUnidad pu = progresoUnidadRepository
                .findDeEstudianteEnUnidad(estudiante.getId(), unidad.getId())
                .orElseGet(() -> {
                    ProgresoUnidad nueva = new ProgresoUnidad();
                    nueva.setProgresoCursoId(progreso);
                    nueva.setEstudianteId(estudiante);
                    nueva.setUnidadId(unidad);
                    nueva.setIniciadoEn(Instant.now());
                    return nueva;
                });
        pu.setPorcentaje(porcentajeUnidad);
        if (totalUnidad > 0 && completadasUnidad >= totalUnidad) {
            pu.setEstado(EstadoProgreso.completado);
            pu.setCompletadoEn(Instant.now());
        } else {
            pu.setEstado(EstadoProgreso.en_progreso);
        }
        progresoUnidadRepository.save(pu);
        return porcentajeUnidad;
    }

    private static BigDecimal porcentaje(long completadas, long total) {
        if (total <= 0) {
            return BigDecimal.ZERO;
        }
        return BigDecimal.valueOf(completadas * 100)
                .divide(BigDecimal.valueOf(total), 2, RoundingMode.HALF_UP);
    }
}
