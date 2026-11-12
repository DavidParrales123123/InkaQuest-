package com.inkaquest.modules.gamificacion.repository;

import com.inkaquest.modules.gamificacion.entity.Temporada;
import com.inkaquest.shared.enums.EstadoTemporada;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositorio JPA de la entidad {@link Temporada} (tabla {@code public.temporada}).
 */
@Repository
public interface TemporadaRepository extends JpaRepository<Temporada, UUID> {

    /** Temporadas por estado. */
    @Query("select t from Temporada t where t.estado = :estado order by t.fechaInicio desc")
    List<Temporada> findPorEstado(EstadoTemporada estado);

    /** Primera (mas reciente) temporada activa. */
    Optional<Temporada> findFirstByEstadoOrderByFechaInicioDesc(EstadoTemporada estado);
}
