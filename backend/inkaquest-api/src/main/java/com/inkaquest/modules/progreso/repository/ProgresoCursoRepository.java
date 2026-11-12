package com.inkaquest.modules.progreso.repository;

import com.inkaquest.modules.academico.entity.Curso;
import com.inkaquest.modules.identidad.entity.Perfil;
import com.inkaquest.modules.progreso.entity.ProgresoCurso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositorio JPA de la entidad {@link ProgresoCurso} (tabla {@code public.progreso_curso}).
 */
@Repository
public interface ProgresoCursoRepository extends JpaRepository<ProgresoCurso, UUID> {

    /** Devuelve el progreso del estudiante en un curso concreto. */
    Optional<ProgresoCurso> findByEstudianteIdAndCursoId(Perfil estudianteId, Curso cursoId);

    /** Lista los progresos del estudiante en todos los cursos. */
    List<ProgresoCurso> findByEstudianteId(Perfil estudianteId);
}
