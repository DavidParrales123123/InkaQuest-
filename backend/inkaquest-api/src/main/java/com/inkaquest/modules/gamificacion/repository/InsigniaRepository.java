package com.inkaquest.modules.gamificacion.repository;

import com.inkaquest.modules.gamificacion.entity.Insignia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

/**
 * Repositorio JPA de la entidad {@link Insignia} (tabla {@code public.insignia}).
 */
@Repository
public interface InsigniaRepository extends JpaRepository<Insignia, UUID> {

    /** Catalogo de insignias activas. */
    @Query("select i from Insignia i where i.activa = true order by i.rareza asc, i.nombre asc")
    List<Insignia> findActivas();
}
