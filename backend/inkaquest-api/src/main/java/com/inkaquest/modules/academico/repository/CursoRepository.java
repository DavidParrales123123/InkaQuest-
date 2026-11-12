package com.inkaquest.modules.academico.repository;

import com.inkaquest.modules.academico.entity.Curso;
import com.inkaquest.shared.enums.EstadoCurso;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositorio JPA de la entidad {@link Curso} (tabla {@code public.curso}).
 */
@Repository
public interface CursoRepository extends JpaRepository<Curso, UUID> {

    /** Busca un curso por slug. */
    Optional<Curso> findBySlug(String slug);

    /** Busca un curso por estado (sin paginacion). */
    List<Curso> findByEstado(EstadoCurso estado);

    /** Lista paginada por estado. */
    Page<Curso> findByEstado(EstadoCurso estado, Pageable pageable);

    /** Busqueda textual basica sobre titulo y descripcion. */
    @Query("select c from Curso c where c.estado = :estado and (lower(c.titulo) like lower(concat('%', :q, '%')) or lower(coalesce(c.descripcion, '')) like lower(concat('%', :q, '%')))")
    Page<Curso> buscarPorTexto(EstadoCurso estado, String q, Pageable pageable);

    /** Cursos creados por un usuario (docente/admin), mas recientes primero. */
    @Query("select c from Curso c where c.creadoPor.id = :creadoPor order by c.creadoEn desc")
    List<Curso> findCreadosPor(UUID creadoPor);

    /** Cantidad de cursos por estado. */
    long countByEstado(EstadoCurso estado);
}
