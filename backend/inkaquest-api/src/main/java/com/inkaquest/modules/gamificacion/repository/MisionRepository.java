package com.inkaquest.modules.gamificacion.repository;

import com.inkaquest.modules.gamificacion.entity.Mision;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

/**
 * Repositorio JPA de la entidad {@link Mision} (tabla {@code public.mision}).
 */
@Repository
public interface MisionRepository extends JpaRepository<Mision, UUID> {

    /** Misiones activas (sin filtro de fechas; el filtrado fino lo hace el servicio). */
    @Query("select m from Mision m where m.activa = true order by m.fechaInicio asc nulls last")
    List<Mision> findActivas();
}
