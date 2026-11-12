package com.inkaquest.modules.progreso.repository;

import com.inkaquest.modules.identidad.entity.Perfil;
import com.inkaquest.modules.progreso.entity.ProgresoLeccion;
import com.inkaquest.shared.enums.EstadoProgreso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositorio JPA de la entidad {@link ProgresoLeccion} (tabla {@code public.progreso_leccion}).
 */
@Repository
public interface ProgresoLeccionRepository extends JpaRepository<ProgresoLeccion, UUID> {

    /** Progreso del estudiante en una leccion concreta. */
    @Query("select p from ProgresoLeccion p where p.estudianteId.id = :estudianteId and p.leccionId.id = :leccionId")
    Optional<ProgresoLeccion> findDeEstudianteEnLeccion(UUID estudianteId, UUID leccionId);

    /** Todas las lecciones completadas por el estudiante dentro de un curso. */
    @Query("select p from ProgresoLeccion p where p.estudianteId.id = :estudianteId and p.leccionId.moduloId.unidadId.cursoId.id = :cursoId and p.estado = :estado")
    List<ProgresoLeccion> findCompletadasDeCurso(UUID estudianteId, UUID cursoId, EstadoProgreso estado);

    /** Lecciones completadas por el estudiante en una unidad concreta. */
    @Query("select p from ProgresoLeccion p where p.estudianteId.id = :estudianteId and p.leccionId.moduloId.unidadId.id = :unidadId and p.estado = :estado")
    List<ProgresoLeccion> findCompletadasDeUnidad(UUID estudianteId, UUID unidadId, EstadoProgreso estado);

    /** Cantidad de progresos asociados a una leccion (para bloquear borrado con progreso ya registrado). */
    @Query("select count(p) from ProgresoLeccion p where p.leccionId.id = :leccionId")
    long countByLeccionId(UUID leccionId);
}

