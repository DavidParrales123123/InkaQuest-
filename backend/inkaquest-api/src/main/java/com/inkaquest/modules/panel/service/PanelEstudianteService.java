package com.inkaquest.modules.panel.service;

import com.inkaquest.modules.academico.entity.Curso;
import com.inkaquest.modules.academico.repository.CursoRepository;
import com.inkaquest.modules.gamificacion.entity.Racha;
import com.inkaquest.modules.gamificacion.repository.RachaRepository;
import com.inkaquest.modules.identidad.entity.Perfil;
import com.inkaquest.modules.matriculas.entity.Matricula;
import com.inkaquest.modules.matriculas.repository.MatriculaRepository;
import com.inkaquest.modules.panel.dto.PanelEstudianteResponse;
import com.inkaquest.modules.progreso.entity.ProgresoCurso;
import com.inkaquest.modules.progreso.repository.ProgresoCursoRepository;
import com.inkaquest.modules.soporte.repository.NotificacionDestinatarioRepository;
import com.inkaquest.shared.enums.EstadoMatricula;
import com.inkaquest.shared.exception.ResourceNotFoundException;
import com.inkaquest.shared.security.RlsExecutor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Agrega en una sola llamada todo lo que el panel del estudiante necesita:
 * cursos matriculados, avance, XP, racha y notificaciones sin leer.
 *
 * <p>No introduce logica duplicada: consume las mismas entidades/repositorios
 * que el resto del backend. La escritura sigue prohibida (RLS + perfil).</p>
 */
@Service
public class PanelEstudianteService {

    private final MatriculaRepository matriculaRepository;
    private final CursoRepository cursoRepository;
    private final ProgresoCursoRepository progresoRepository;
    private final RachaRepository rachaRepository;
    private final NotificacionDestinatarioRepository notificacionRepository;
    private final com.inkaquest.modules.identidad.repository.PerfilRepository perfilRepository;
    private final RlsExecutor rlsExecutor;

    public PanelEstudianteService(MatriculaRepository matriculaRepository,
                                  CursoRepository cursoRepository,
                                  ProgresoCursoRepository progresoRepository,
                                  RachaRepository rachaRepository,
                                  NotificacionDestinatarioRepository notificacionRepository,
                                  com.inkaquest.modules.identidad.repository.PerfilRepository perfilRepository,
                                  RlsExecutor rlsExecutor) {
        this.matriculaRepository = matriculaRepository;
        this.cursoRepository = cursoRepository;
        this.progresoRepository = progresoRepository;
        this.rachaRepository = rachaRepository;
        this.notificacionRepository = notificacionRepository;
        this.perfilRepository = perfilRepository;
        this.rlsExecutor = rlsExecutor;
    }

    @Transactional(readOnly = true)
    public PanelEstudianteResponse resumen(UUID estudianteId) {
        return rlsExecutor.executeAs(estudianteId, () -> {
            Perfil estudiante = perfilRepository.findById(estudianteId)
                    .orElseThrow(() -> new ResourceNotFoundException("Perfil no encontrado."));

            List<Matricula> matriculas = matriculaRepository.findAllDeEstudiante(estudianteId).stream()
                    .filter(m -> m.getEstado() == EstadoMatricula.activa
                            || m.getEstado() == EstadoMatricula.completada)
                    .toList();

            List<UUID> cursoIds = matriculas.stream()
                    .map(m -> m.getCursoId().getId())
                    .toList();
            List<Curso> cursos = cursoRepository.findAllById(cursoIds);

            List<ProgresoCurso> progresos = progresoRepository
                    .findByEstudianteId(estudiante);

            Racha racha = rachaRepository.findDeUsuario(estudianteId).orElse(null);
            Long noLeidas = notificacionRepository.countNoLeidas(estudianteId);

            int xp = estudiante.getXp() != null ? estudiante.getXp() : 0;
            int rachaActual = racha != null && racha.getRachaActual() != null ? racha.getRachaActual() : 0;

            return new PanelEstudianteResponse(
                    cursos.stream().map(PanelEstudianteService::aCursoPanel).toList(),
                    matriculas.stream().map(PanelEstudianteService::aMatriculaPanel).toList(),
                    progresos.stream().map(PanelEstudianteService::aProgresoPanel).toList(),
                    xp,
                    rachaActual,
                    noLeidas);
        });
    }

    private static PanelEstudianteResponse.CursoPanel aCursoPanel(Curso c) {
        return new PanelEstudianteResponse.CursoPanel(
                c.getId(),
                c.getCategoriaId() != null ? c.getCategoriaId().getId() : null,
                c.getTitulo(),
                c.getSlug(),
                c.getDescripcion(),
                c.getContenido(),
                c.getPortadaUrl(),
                c.getEstado(),
                c.getPrecio(),
                c.getMoneda(),
                c.getXpTotal(),
                c.getDuracionMinutos(),
                c.getCreadoPor() != null ? c.getCreadoPor().getId() : null,
                c.getPublicadoEn(),
                c.getCreadoEn(),
                c.getActualizadoEn());
    }

    private static PanelEstudianteResponse.MatriculaPanel aMatriculaPanel(Matricula m) {
        return new PanelEstudianteResponse.MatriculaPanel(
                m.getId(),
                m.getEstudianteId() != null ? m.getEstudianteId().getId() : null,
                m.getCursoId() != null ? m.getCursoId().getId() : null,
                m.getEstado().getValor(),
                m.getPrecioPagado(),
                m.getMoneda(),
                m.getPorcentajeProgreso(),
                m.getXpGanado(),
                m.getMatriculadoEn(),
                m.getCompletadoEn(),
                m.getCanceladoEn(),
                m.getCreadoEn(),
                m.getActualizadoEn());
    }

    private static PanelEstudianteResponse.ProgresoPanel aProgresoPanel(ProgresoCurso p) {
        return new PanelEstudianteResponse.ProgresoPanel(
                p.getId(),
                p.getMatriculaId() != null ? p.getMatriculaId().getId() : null,
                p.getEstudianteId() != null ? p.getEstudianteId().getId() : null,
                p.getCursoId() != null ? p.getCursoId().getId() : null,
                p.getEstado().getValor(),
                p.getPorcentaje(),
                p.getLeccionesCompletadas(),
                p.getMinutosEstudio(),
                p.getIniciadoEn(),
                p.getCompletadoEn(),
                p.getUltimaActividadEn(),
                p.getCreadoEn(),
                p.getActualizadoEn());
    }
}
