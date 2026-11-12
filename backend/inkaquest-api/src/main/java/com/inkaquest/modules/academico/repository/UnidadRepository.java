package com.inkaquest.modules.academico.repository;

import com.inkaquest.modules.academico.entity.Unidad;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositorio JPA de la entidad {@link Unidad} (tabla {@code public.unidad}).
 */
@Repository
public interface UnidadRepository extends JpaRepository<Unidad, UUID> {

    /** Unidades de un curso ordenadas por numero. */
    @Query("select u from Unidad u where u.cursoId.id = :cursoId order by u.numero asc")
    List<Unidad> findDeCurso(UUID cursoId);

    /** Maximo numero usado en un curso (0 si no hay unidades). */
    @Query("select coalesce(max(u.numero), 0) from Unidad u where u.cursoId.id = :cursoId")
    Integer maxNumeroDeCurso(UUID cursoId);
}
