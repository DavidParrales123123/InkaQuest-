package com.inkaquest.modules.academico.repository;

import com.inkaquest.modules.academico.entity.DocenteCurso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositorio JPA de la entidad {@link DocenteCurso} (tabla {@code public.docente_curso}).
 */
@Repository
public interface DocenteCursoRepository extends JpaRepository<DocenteCurso, UUID> {

    /** Asignacion activa de un docente a un curso. */
    @Query("select d from DocenteCurso d where d.docenteId.id = :docenteId and d.cursoId.id = :cursoId and d.activo = true")
    Optional<DocenteCurso> findActiva(UUID docenteId, UUID cursoId);

    /** Cursos donde el docente esta asignado y activo. */
    @Query("select d.cursoId.id from DocenteCurso d where d.docenteId.id = :docenteId and d.activo = true")
    List<UUID> findCursoIdsDeDocente(UUID docenteId);
}
