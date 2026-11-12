package com.inkaquest.modules.academico.service;

import com.inkaquest.modules.academico.dto.*;
import com.inkaquest.modules.academico.entity.Curso;
import com.inkaquest.modules.academico.entity.Leccion;
import com.inkaquest.modules.academico.entity.Modulo;
import com.inkaquest.modules.academico.entity.Unidad;
import com.inkaquest.modules.academico.repository.LeccionRepository;
import com.inkaquest.modules.academico.repository.ModuloRepository;
import com.inkaquest.modules.academico.repository.UnidadRepository;
import com.inkaquest.modules.academico.repository.CursoRepository;
import com.inkaquest.modules.progreso.repository.ProgresoLeccionRepository;
import com.inkaquest.shared.enums.EstadoCurso;
import com.inkaquest.shared.exception.BadRequestException;
import com.inkaquest.shared.exception.ResourceNotFoundException;
import com.inkaquest.shared.security.RlsExecutor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.function.Predicate;
import java.util.stream.Collectors;

/**
 * Servicio de estructura curricular (seccion 14): arbol de unidades,
 * modulos y lecciones, mas el CRUD de cada nivel. El permiso de escritura
 * se resuelve siempre contra {@code perfil.rol} + propiedad/asignacion.
 */
@Service
public class EstructuraService {

    private final CursoRepository cursoRepository;
    private final UnidadRepository unidadRepository;
    private final ModuloRepository moduloRepository;
    private final LeccionRepository leccionRepository;
    private final ProgresoLeccionRepository progresoLeccionRepository;
    private final CursoAccessService cursoAccessService;
    private final RlsExecutor rlsExecutor;

    public EstructuraService(CursoRepository cursoRepository,
                             UnidadRepository unidadRepository,
                             ModuloRepository moduloRepository,
                             LeccionRepository leccionRepository,
                             ProgresoLeccionRepository progresoLeccionRepository,
                             CursoAccessService cursoAccessService,
                             RlsExecutor rlsExecutor) {
        this.cursoRepository = cursoRepository;
        this.unidadRepository = unidadRepository;
        this.moduloRepository = moduloRepository;
        this.leccionRepository = leccionRepository;
        this.progresoLeccionRepository = progresoLeccionRepository;
        this.cursoAccessService = cursoAccessService;
        this.rlsExecutor = rlsExecutor;
    }

    /** Arbol del curso. Publico (autenticado) si publicado; si no, solo creador/asignado/admin. */
    @Transactional
    public EstructuraCursoResponse estructura(String slug, UUID actorId) {
        return rlsExecutor.executeAs(actorId, () -> {
            Curso curso = cursoRepository.findBySlug(slug)
                    .orElseThrow(() -> new ResourceNotFoundException("Curso no encontrado: " + slug));
            boolean puedeVerTodo = puedeEscribir(curso, actorId);
            if (curso.getEstado() != EstadoCurso.publicado && !puedeVerTodo) {
                throw new ResourceNotFoundException("Curso no encontrado: " + slug);
            }
            EstructuraCursoResponse.CursoResumen resumen = new EstructuraCursoResponse.CursoResumen(
                    curso.getId(), curso.getTitulo(), curso.getSlug(), curso.getDescripcion(),
                    curso.getPortadaUrl(), curso.getEstado(), curso.getXpTotal(),
                    curso.getDuracionMinutos(), curso.getPublicadoEn());
            return construirArbol(curso, resumen, puedeVerTodo);
        });
    }

    // ---------- Unidades ----------

    @Transactional
    public UUID crearUnidad(String slug, UUID actorId, UnidadCrearRequest request) {
        return rlsExecutor.executeAs(actorId, () -> {
            Curso curso = cursoEscribible(actorId, slug);
            Unidad u = new Unidad();
            u.setCursoId(curso);
            u.setNumero(unidadRepository.maxNumeroDeCurso(curso.getId()) + 1);
            u.setTitulo(request.titulo().trim());
            u.setDescripcion(request.descripcion());
            u.setXpOtorgado(request.xpOtorgado() != null ? request.xpOtorgado() : 0);
            u.setPublicado(request.publicado() != null ? request.publicado() : Boolean.FALSE);
            return unidadRepository.save(u).getId();
        });
    }

    @Transactional
    public void actualizarUnidad(UUID actorId, UUID unidadId, UnidadActualizarRequest request) {
        rlsExecutor.executeAs(actorId, () -> {
            Unidad u = unidadRepository.findById(unidadId)
                    .orElseThrow(() -> new ResourceNotFoundException("Unidad no encontrada."));
            exigirEscritura(u.getCursoId(), actorId);
            if (request.titulo() != null) u.setTitulo(request.titulo().trim());
            if (request.descripcion() != null) u.setDescripcion(request.descripcion());
            if (request.numero() != null && !request.numero().equals(u.getNumero())) {
                boolean duplicado = unidadRepository.findDeCurso(u.getCursoId().getId()).stream()
                        .anyMatch(x -> !x.getId().equals(u.getId()) && x.getNumero().equals(request.numero()));
                if (duplicado) throw new BadRequestException("Ya existe una unidad con el numero " + request.numero() + ".");
                u.setNumero(request.numero());
            }
            if (request.xpOtorgado() != null) u.setXpOtorgado(request.xpOtorgado());
            if (request.publicado() != null) u.setPublicado(request.publicado());
            return unidadRepository.save(u);
        });
    }

    @Transactional
    public void eliminarUnidad(UUID actorId, UUID unidadId) {
        rlsExecutor.executeAs(actorId, () -> {
            Unidad u = unidadRepository.findById(unidadId)
                    .orElseThrow(() -> new ResourceNotFoundException("Unidad no encontrada."));
            exigirEscritura(u.getCursoId(), actorId);
            if (moduloRepository.countDeUnidad(u.getId()) > 0) {
                throw new BadRequestException("No se puede eliminar una unidad con modulos. Elimina los modulos primero.");
            }
            unidadRepository.delete(u);
            return null;
        });
    }

    // ---------- Modulos ----------

    @Transactional
    public UUID crearModulo(UUID actorId, UUID unidadId, ModuloCrearRequest request) {
        return rlsExecutor.executeAs(actorId, () -> {
            Unidad u = unidadRepository.findById(unidadId)
                    .orElseThrow(() -> new ResourceNotFoundException("Unidad no encontrada."));
            exigirEscritura(u.getCursoId(), actorId);
            Modulo m = new Modulo();
            m.setUnidadId(u);
            m.setNumero(moduloRepository.maxNumeroDeUnidad(u.getId()) + 1);
            m.setTitulo(request.titulo().trim());
            m.setDescripcion(request.descripcion());
            m.setXpOtorgado(request.xpOtorgado() != null ? request.xpOtorgado() : 0);
            m.setPublicado(request.publicado() != null ? request.publicado() : Boolean.FALSE);
            return moduloRepository.save(m).getId();
        });
    }

    @Transactional
    public void actualizarModulo(UUID actorId, UUID moduloId, ModuloActualizarRequest request) {
        rlsExecutor.executeAs(actorId, () -> {
            Modulo m = moduloRepository.findById(moduloId)
                    .orElseThrow(() -> new ResourceNotFoundException("Modulo no encontrado."));
            exigirEscritura(m.getUnidadId().getCursoId(), actorId);
            if (request.titulo() != null) m.setTitulo(request.titulo().trim());
            if (request.descripcion() != null) m.setDescripcion(request.descripcion());
            if (request.numero() != null && !request.numero().equals(m.getNumero())) {
                boolean duplicado = moduloRepository.findDeUnidad(m.getUnidadId().getId()).stream()
                        .anyMatch(x -> !x.getId().equals(m.getId()) && x.getNumero().equals(request.numero()));
                if (duplicado) throw new BadRequestException("Ya existe un modulo con el numero " + request.numero() + ".");
                m.setNumero(request.numero());
            }
            if (request.xpOtorgado() != null) m.setXpOtorgado(request.xpOtorgado());
            if (request.publicado() != null) m.setPublicado(request.publicado());
            return moduloRepository.save(m);
        });
    }

    @Transactional
    public void eliminarModulo(UUID actorId, UUID moduloId) {
        rlsExecutor.executeAs(actorId, () -> {
            Modulo m = moduloRepository.findById(moduloId)
                    .orElseThrow(() -> new ResourceNotFoundException("Modulo no encontrado."));
            exigirEscritura(m.getUnidadId().getCursoId(), actorId);
            if (leccionRepository.countDeModulo(m.getId()) > 0) {
                throw new BadRequestException("No se puede eliminar un modulo con lecciones. Elimina las lecciones primero.");
            }
            moduloRepository.delete(m);
            return null;
        });
    }

    // ---------- Lecciones ----------

    @Transactional
    public UUID crearLeccion(UUID actorId, UUID moduloId, LeccionCrearRequest request) {
        return rlsExecutor.executeAs(actorId, () -> {
            Modulo m = moduloRepository.findById(moduloId)
                    .orElseThrow(() -> new ResourceNotFoundException("Modulo no encontrado."));
            exigirEscritura(m.getUnidadId().getCursoId(), actorId);
            Leccion l = new Leccion();
            l.setModuloId(m);
            l.setNumero(leccionRepository.maxNumeroDeModulo(m.getId()) + 1);
            l.setTitulo(request.titulo().trim());
            l.setDescripcion(request.descripcion());
            l.setTipoContenido(request.tipoContenido());
            l.setDuracionMinutos(request.duracionMinutos() != null ? request.duracionMinutos() : 0);
            l.setXpOtorgado(request.xpOtorgado() != null ? request.xpOtorgado() : 0);
            l.setRequeridoAprobacion(request.requeridoAprobacion() != null ? request.requeridoAprobacion() : Boolean.FALSE);
            l.setPublicado(request.publicado() != null ? request.publicado() : Boolean.FALSE);
            return leccionRepository.save(l).getId();
        });
    }

    @Transactional
    public void actualizarLeccion(UUID actorId, UUID leccionId, LeccionActualizarRequest request) {
        rlsExecutor.executeAs(actorId, () -> {
            Leccion l = leccionRepository.findById(leccionId)
                    .orElseThrow(() -> new ResourceNotFoundException("Leccion no encontrada."));
            exigirEscritura(l.getModuloId().getUnidadId().getCursoId(), actorId);
            if (request.titulo() != null) l.setTitulo(request.titulo().trim());
            if (request.descripcion() != null) l.setDescripcion(request.descripcion());
            if (request.numero() != null && !request.numero().equals(l.getNumero())) {
                boolean duplicado = leccionRepository.findDeModulo(l.getModuloId().getId()).stream()
                        .anyMatch(x -> !x.getId().equals(l.getId()) && x.getNumero().equals(request.numero()));
                if (duplicado) throw new BadRequestException("Ya existe una leccion con el numero " + request.numero() + ".");
                l.setNumero(request.numero());
            }
            if (request.tipoContenido() != null) l.setTipoContenido(request.tipoContenido());
            if (request.duracionMinutos() != null) l.setDuracionMinutos(request.duracionMinutos());
            if (request.xpOtorgado() != null) l.setXpOtorgado(request.xpOtorgado());
            if (request.requeridoAprobacion() != null) l.setRequeridoAprobacion(request.requeridoAprobacion());
            if (request.publicado() != null) l.setPublicado(request.publicado());
            return leccionRepository.save(l);
        });
    }

    @Transactional
    public void eliminarLeccion(UUID actorId, UUID leccionId) {
        rlsExecutor.executeAs(actorId, () -> {
            Leccion l = leccionRepository.findById(leccionId)
                    .orElseThrow(() -> new ResourceNotFoundException("Leccion no encontrada."));
            exigirEscritura(l.getModuloId().getUnidadId().getCursoId(), actorId);
            if (progresoLeccionRepository.countByLeccionId(l.getId()) > 0) {
                throw new BadRequestException("No se puede eliminar una leccion con progreso de alumnos registrado.");
            }
            leccionRepository.delete(l);
            return null;
        });
    }

    // ---------- Helpers ----------

    private Curso cursoEscribible(UUID actorId, String slug) {
        Curso curso = cursoRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Curso no encontrado: " + slug));
        cursoAccessService.exigirEscritura(curso, actorId);
        return curso;
    }

    private void exigirEscritura(Curso curso, UUID actorId) {
        cursoAccessService.exigirEscritura(curso, actorId);
    }

    private boolean puedeEscribir(Curso curso, UUID actorId) {
        return cursoAccessService.puedeEscribir(curso, actorId);
    }

    private EstructuraCursoResponse construirArbol(Curso curso,
                                                    EstructuraCursoResponse.CursoResumen resumen,
                                                    boolean puedeVerTodo) {
        List<Unidad> unidades = unidadRepository.findDeCurso(curso.getId());
        List<Modulo> modulos = moduloRepository.findDeCurso(curso.getId());
        List<Leccion> lecciones = leccionRepository.findDeCurso(curso.getId());

        Predicate<Unidad> unidadVisible = puedeVerTodo ? u -> true : Unidad::getPublicado;
        Predicate<Modulo> moduloVisible = puedeVerTodo ? m -> true : Modulo::getPublicado;
        Predicate<Leccion> leccionVisible = puedeVerTodo ? l -> true : Leccion::getPublicado;

        Map<UUID, List<Modulo>> modulosPorUnidad = modulos.stream()
                .filter(moduloVisible)
                .collect(Collectors.groupingBy(m -> m.getUnidadId().getId(), LinkedHashMap::new, Collectors.toList()));
        Map<UUID, List<Leccion>> leccionesPorModulo = lecciones.stream()
                .filter(leccionVisible)
                .collect(Collectors.groupingBy(l -> l.getModuloId().getId(), LinkedHashMap::new, Collectors.toList()));

        List<EstructuraCursoResponse.UnidadEstructura> unidadesDto = unidades.stream()
                .filter(unidadVisible)
                .map(u -> new EstructuraCursoResponse.UnidadEstructura(
                        u.getId(), u.getNumero(), u.getTitulo(), u.getDescripcion(),
                        u.getXpOtorgado(), u.getPublicado(),
                        modulosPorUnidad.getOrDefault(u.getId(), List.of()).stream()
                                .map(m -> new EstructuraCursoResponse.ModuloEstructura(
                                        m.getId(), m.getNumero(), m.getTitulo(), m.getDescripcion(),
                                        m.getXpOtorgado(), m.getPublicado(),
                                        leccionesPorModulo.getOrDefault(m.getId(), List.of()).stream()
                                                .map(l -> new EstructuraCursoResponse.LeccionEstructura(
                                                        l.getId(), l.getNumero(), l.getTitulo(), l.getDescripcion(),
                                                        l.getTipoContenido(), l.getDuracionMinutos(), l.getXpOtorgado(),
                                                        l.getRequeridoAprobacion(), l.getPublicado()))
                                                .toList()))
                                .toList()))
                .toList();

        return new EstructuraCursoResponse(resumen, unidadesDto);
    }
}
