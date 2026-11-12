package com.inkaquest.modules.academico.repository;

import com.inkaquest.modules.academico.entity.Modulo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

/**
 * Repositorio JPA de la entidad {@link Modulo} (tabla {@code public.modulo}).
 */
@Repository
public interface ModuloRepository extends JpaRepository<Modulo, UUID> {

    /** Modulos de una unidad ordenados por numero. */
    @Query("select m from Modulo m where m.unidadId.id = :unidadId order by m.numero asc")
    List<Modulo> findDeUnidad(UUID unidadId);

    /** Todos los modulos de un curso (orden: unidad.numero, modulo.numero). */
    @Query("select m from Modulo m where m.unidadId.cursoId.id = :cursoId order by m.unidadId.numero asc, m.numero asc")
    List<Modulo> findDeCurso(UUID cursoId);

    /** Maximo numero usado en una unidad. */
    @Query("select coalesce(max(m.numero), 0) from Modulo m where m.unidadId.id = :unidadId")
    Integer maxNumeroDeUnidad(UUID unidadId);

    /** Cantidad de modulos de una unidad. */
    @Query("select count(m) from Modulo m where m.unidadId.id = :unidadId")
    long countDeUnidad(UUID unidadId);
}
