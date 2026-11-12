package com.inkaquest.modules.academico.service;

import com.inkaquest.modules.academico.dto.CursoResponse;
import com.inkaquest.modules.academico.repository.CursoRepository;
import com.inkaquest.shared.enums.EstadoCurso;
import com.inkaquest.shared.exception.ResourceNotFoundException;
import com.inkaquest.shared.security.RlsExecutor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Servicio de consulta de cursos publicados.
 *
 * <p>Devuelve únicamente contenido público (estado {@code publicado}) para
 * alumnos. Los cursos son JWT-claim agnósticos: el filtrado por rol real se
 * hace contra {@code public.perfil.rol}.</p>
 */
@Service
public class CursoService {

    private final CursoRepository cursoRepository;
    private final RlsExecutor rlsExecutor;

    public CursoService(CursoRepository cursoRepository, RlsExecutor rlsExecutor) {
        this.cursoRepository = cursoRepository;
        this.rlsExecutor = rlsExecutor;
    }

    /** Lista paginada. Si {@code q} no es nulo/vacío se filtra por título/descripción. */
    public Page<CursoResponse> listarPublicados(UUID estudianteId, String q, Pageable pageable) {
        return rlsExecutor.executeAs(estudianteId, () -> {
            Page<CursoResponse> resultado;
            if (q == null || q.isBlank()) {
                resultado = cursoRepository.findByEstado(EstadoCurso.publicado, pageable)
                        .map(CursoResponse::from);
            } else {
                resultado = cursoRepository.buscarPorTexto(EstadoCurso.publicado, q, pageable)
                        .map(CursoResponse::from);
            }
            return resultado;
        });
    }

    /** Detalle de un curso, solo si está publicado. */
    public CursoResponse detallePorSlug(UUID estudianteId, String slug) {
        return rlsExecutor.executeAs(estudianteId, () ->
                cursoRepository.findBySlug(slug)
                        .filter(c -> c.getEstado() == EstadoCurso.publicado)
                        .map(CursoResponse::from)
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Curso no encontrado: " + slug)));
    }

    /** Detalle de un curso por id, solo si está publicado. */
    public CursoResponse detallePorId(UUID estudianteId, UUID id) {
        return rlsExecutor.executeAs(estudianteId, () ->
                cursoRepository.findById(id)
                        .filter(c -> c.getEstado() == EstadoCurso.publicado)
                        .map(CursoResponse::from)
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Curso no encontrado.")));
    }
}
