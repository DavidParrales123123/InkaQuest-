package com.inkaquest.modules.progreso.repository;

import com.inkaquest.modules.identidad.entity.Perfil;
import com.inkaquest.modules.progreso.entity.ProgresoUnidad;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositorio JPA de la entidad {@link ProgresoUnidad} (tabla {@code public.progreso_unidad}).
 */
@Repository
public interface ProgresoUnidadRepository extends JpaRepository<ProgresoUnidad, UUID> {

    /** Progreso del estudiante en una unidad concreta. */
    @Query("select p from ProgresoUnidad p where p.estudianteId.id = :estudianteId and p.unidadId.id = :unidadId")
    Optional<ProgresoUnidad> findDeEstudianteEnUnidad(UUID estudianteId, UUID unidadId);

    /** Todos los progresos de unidad del estudiante en un curso. */
    @Query("select p from ProgresoUnidad p where p.estudianteId.id = :estudianteId and p.unidadId.cursoId.id = :cursoId")
    List<ProgresoUnidad> findDeCurso(UUID estudianteId, UUID cursoId);
}
