package com.inkaquest.modules.academico.service;

import com.inkaquest.modules.academico.dto.CursoActualizarRequest;
import com.inkaquest.modules.academico.dto.CursoCrearRequest;
import com.inkaquest.modules.academico.dto.CursoResponse;
import com.inkaquest.modules.academico.entity.Categoria;
import com.inkaquest.modules.academico.entity.Curso;
import com.inkaquest.modules.academico.entity.DocenteCurso;
import com.inkaquest.modules.academico.repository.CategoriaRepository;
import com.inkaquest.modules.academico.repository.CursoRepository;
import com.inkaquest.modules.academico.repository.DocenteCursoRepository;
import com.inkaquest.modules.identidad.entity.Perfil;
import com.inkaquest.modules.identidad.repository.PerfilRepository;
import com.inkaquest.shared.enums.EstadoCurso;
import com.inkaquest.shared.enums.RolUsuario;
import com.inkaquest.shared.exception.BadRequestException;
import com.inkaquest.shared.exception.ResourceNotFoundException;
import com.inkaquest.shared.exception.UnauthorizedException;
import com.inkaquest.shared.security.CheckRoleService;
import com.inkaquest.shared.security.RlsExecutor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Stream;

/**
 * Servicio de escritura de cursos (seccion 13): alta, edicion, flujo de
 * revision y publicacion. El rol se resuelve contra {@code perfil.rol}, no
 * contra el token. Toda la escritura pasa por RLS como el usuario actor.
 */
@Service
public class CursoAdminService {

    private final CursoRepository cursoRepository;
    private final CategoriaRepository categoriaRepository;
    private final DocenteCursoRepository docenteCursoRepository;
    private final PerfilRepository perfilRepository;
    private final CheckRoleService checkRoleService;
    private final CursoAccessService cursoAccessService;
    private final RlsExecutor rlsExecutor;

    public CursoAdminService(CursoRepository cursoRepository,
                             CategoriaRepository categoriaRepository,
                             DocenteCursoRepository docenteCursoRepository,
                             PerfilRepository perfilRepository,
                             CheckRoleService checkRoleService,
                             CursoAccessService cursoAccessService,
                             RlsExecutor rlsExecutor) {
        this.cursoRepository = cursoRepository;
        this.categoriaRepository = categoriaRepository;
        this.docenteCursoRepository = docenteCursoRepository;
        this.perfilRepository = perfilRepository;
        this.checkRoleService = checkRoleService;
        this.cursoAccessService = cursoAccessService;
        this.rlsExecutor = rlsExecutor;
    }

    /** Alta de curso por docente o administrador. Siempre queda en borrador. */
    @Transactional
    public CursoResponse crear(UUID actorId, CursoCrearRequest request) {
        return rlsExecutor.executeAs(actorId, () -> {
            RolUsuario rol = checkRoleService.rolDe(actorId);
            if (rol != RolUsuario.docente && rol != RolUsuario.administrador) {
                throw new UnauthorizedException("Solo docentes o administradores pueden crear cursos.");
            }
            if (cursoRepository.findBySlug(request.slug()).isPresent()) {
                throw new BadRequestException("Ya existe un curso con ese slug.");
            }
            Perfil actor = perfilRepository.findById(actorId)
                    .orElseThrow(() -> new ResourceNotFoundException("Perfil no encontrado."));

            Categoria categoria = resolverCategoria(request.categoriaSlug());

            Curso curso = new Curso();
            curso.setTitulo(request.titulo().trim());
            curso.setSlug(request.slug());
            curso.setDescripcion(request.descripcion());
            curso.setContenido(request.contenido());
            curso.setPortadaUrl(request.portadaUrl());
            curso.setCategoriaId(categoria);
            curso.setEstado(EstadoCurso.borrador);
            curso.setPrecio(request.precio());
            curso.setMoneda(request.moneda().toUpperCase());
            curso.setXpTotal(request.xpTotal());
            curso.setDuracionMinutos(request.duracionMinutos());
            curso.setCreadoPor(actor);
            return CursoResponse.from(cursoRepository.save(curso));
        });
    }

    /** Actualizacion parcial. Solo curso en borrador/en_revision y solo por su creador o admin. */
    @Transactional
    public CursoResponse actualizar(UUID actorId, String slug, CursoActualizarRequest request) {
        return rlsExecutor.executeAs(actorId, () -> {
            Curso curso = cursoModificable(actorId, slug);

            if (request.titulo() != null) {
                curso.setTitulo(request.titulo().trim());
            }
            if (request.descripcion() != null) {
                curso.setDescripcion(request.descripcion());
            }
            if (request.contenido() != null) {
                curso.setContenido(request.contenido());
            }
            if (request.portadaUrl() != null) {
                curso.setPortadaUrl(request.portadaUrl());
            }
            if (request.categoriaSlug() != null) {
                curso.setCategoriaId(resolverCategoria(request.categoriaSlug()));
            }
            if (request.precio() != null) {
                curso.setPrecio(request.precio());
            }
            if (request.moneda() != null) {
                curso.setMoneda(request.moneda().toUpperCase());
            }
            if (request.xpTotal() != null) {
                curso.setXpTotal(request.xpTotal());
            }
            if (request.duracionMinutos() != null) {
                curso.setDuracionMinutos(request.duracionMinutos());
            }
            return CursoResponse.from(cursoRepository.save(curso));
        });
    }

    /** Envia a revision: borrador -> en_revision. Creador del curso o admin. */
    @Transactional
    public CursoResponse enviarRevision(UUID actorId, String slug) {
        return rlsExecutor.executeAs(actorId, () -> {
            Curso curso = cursoModificable(actorId, slug);
            if (curso.getEstado() != EstadoCurso.borrador) {
                throw new BadRequestException("Solo los cursos en borrador pueden enviarse a revision.");
            }
            curso.setEstado(EstadoCurso.en_revision);
            return CursoResponse.from(cursoRepository.save(curso));
        });
    }

    /** Publica: en_revision -> publicado. Solo administrador. */
    @Transactional
    public CursoResponse publicar(UUID actorId, String slug) {
        return rlsExecutor.executeAs(actorId, () -> {
            exigirAdmin(actorId, "Solo el administrador puede publicar un curso.");
            Curso curso = cursoRepository.findBySlug(slug)
                    .orElseThrow(() -> new ResourceNotFoundException("Curso no encontrado: " + slug));
            if (curso.getEstado() != EstadoCurso.en_revision) {
                throw new BadRequestException("Solo los cursos en revision pueden publicarse.");
            }
            curso.setEstado(EstadoCurso.publicado);
            curso.setPublicadoEn(Instant.now());
            return CursoResponse.from(cursoRepository.save(curso));
        });
    }

    /** Archiva: publicado -> archivado. Solo administrador. */
    @Transactional
    public CursoResponse archivar(UUID actorId, String slug) {
        return rlsExecutor.executeAs(actorId, () -> {
            exigirAdmin(actorId, "Solo el administrador puede archivar un curso.");
            Curso curso = cursoRepository.findBySlug(slug)
                    .orElseThrow(() -> new ResourceNotFoundException("Curso no encontrado: " + slug));
            if (curso.getEstado() != EstadoCurso.publicado) {
                throw new BadRequestException("Solo los cursos publicados pueden archivarse.");
            }
            curso.setEstado(EstadoCurso.archivado);
            return CursoResponse.from(cursoRepository.save(curso));
        });
    }

    /** Listado administrativo de cursos por estado (solo administrador). */
    @Transactional
    public org.springframework.data.domain.Page<CursoResponse> listarPorEstado(
            UUID actorId, EstadoCurso estado, org.springframework.data.domain.Pageable pageable) {
        exigirAdmin(actorId, "Solo el administrador puede listar cursos por estado.");
        return rlsExecutor.executeAs(actorId,
                () -> cursoRepository.findByEstado(estado, pageable).map(CursoResponse::from));
    }

    /** Cursos visibles para el docente actor: creados por el o asignados activos. */
    @Transactional
    public List<CursoResponse> misCursosDocente(UUID actorId) {
        return rlsExecutor.executeAs(actorId, () -> {
            RolUsuario rol = checkRoleService.rolDe(actorId);
            if (rol != RolUsuario.docente && rol != RolUsuario.administrador) {
                throw new UnauthorizedException("Solo docentes o administradores tienen cursos.");
            }
            List<UUID> asignados = docenteCursoRepository.findCursoIdsDeDocente(actorId);
            java.util.stream.Stream<UUID> creados = cursoRepository.findCreadosPor(actorId).stream()
                    .map(Curso::getId);
            List<UUID> ids = Stream.concat(creados, asignados.stream())
                    .distinct()
                    .toList();
            return cursoRepository.findAllById(ids).stream()
                    .map(CursoResponse::from)
                    .toList();
        });
    }

    // ---------- Helpers ----------

    private Curso cursoModificable(UUID actorId, String slug) {
        Curso curso = cursoRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Curso no encontrado: " + slug));
        if (!cursoAccessService.puedeEscribir(curso, actorId)) {
            throw new UnauthorizedException("No tienes permiso para editar este curso.");
        }
        if (curso.getEstado() != EstadoCurso.borrador && curso.getEstado() != EstadoCurso.en_revision) {
            throw new BadRequestException("Solo se puede editar un curso en borrador o en revision.");
        }
        return curso;
    }

    private void exigirAdmin(UUID actorId, String mensaje) {
        cursoAccessService.exigirAdmin(actorId, mensaje);
    }

    private Categoria resolverCategoria(String categoriaSlug) {
        if (categoriaSlug == null || categoriaSlug.isBlank()) {
            return null;
        }
        return categoriaRepository.findBySlug(categoriaSlug)
                .orElseThrow(() -> new BadRequestException(
                        "Categoria no encontrada: " + categoriaSlug));
    }
}
