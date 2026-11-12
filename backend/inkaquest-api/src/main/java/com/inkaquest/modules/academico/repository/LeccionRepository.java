package com.inkaquest.modules.academico.repository;

import com.inkaquest.modules.academico.entity.Leccion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

/**
 * Repositorio JPA de la entidad {@link Leccion} (tabla {@code public.leccion}).
 */
@Repository
public interface LeccionRepository extends JpaRepository<Leccion, UUID> {

    /** Lecciones de un modulo ordenadas por numero. */
    @Query("select l from Leccion l where l.moduloId.id = :moduloId order by l.numero asc")
    List<Leccion> findDeModulo(UUID moduloId);

    /** Todas las lecciones de un curso (orden: unidad.numero, modulo.numero, leccion.numero). */
    @Query("select l from Leccion l where l.moduloId.unidadId.cursoId.id = :cursoId order by l.moduloId.unidadId.numero asc, l.moduloId.numero asc, l.numero asc")
    List<Leccion> findDeCurso(UUID cursoId);

    /** Lecciones publicadas de un curso completo. */
    @Query("select l from Leccion l where l.moduloId.unidadId.cursoId.id = :cursoId and l.publicado = true order by l.moduloId.unidadId.numero asc, l.moduloId.numero asc, l.numero asc")
    List<Leccion> findPublicadasDeCurso(UUID cursoId);

    /** Total de lecciones publicadas de una unidad concreta. */
    @Query("select count(l) from Leccion l where l.moduloId.unidadId.id = :unidadId and l.publicado = true")
    long countPublicadasDeUnidad(UUID unidadId);

    /** Cantidad de lecciones de un modulo. */
    @Query("select count(l) from Leccion l where l.moduloId.id = :moduloId")
    long countDeModulo(UUID moduloId);

    /** Maximo numero usado en un modulo. */
    @Query("select coalesce(max(l.numero), 0) from Leccion l where l.moduloId.id = :moduloId")
    Integer maxNumeroDeModulo(UUID moduloId);
}
