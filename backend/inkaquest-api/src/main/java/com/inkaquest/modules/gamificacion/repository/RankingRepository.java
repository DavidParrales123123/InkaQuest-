package com.inkaquest.modules.gamificacion.repository;

import com.inkaquest.modules.gamificacion.entity.Ranking;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositorio JPA de la entidad {@link Ranking} (tabla {@code public.ranking}).
 */
@Repository
public interface RankingRepository extends JpaRepository<Ranking, UUID> {

    /** Top de una temporada paginado (mejor a peor). */
    @Query("select r from Ranking r where r.temporadaId.id = :temporadaId order by r.puntos desc, r.actualizadoEn asc")
    Page<Ranking> topDeTemporada(UUID temporadaId, Pageable pageable);

    /** Posicion del usuario en una temporada. */
    @Query("select r from Ranking r where r.temporadaId.id = :temporadaId and r.usuarioId.id = :usuarioId")
    Optional<Ranking> findDeTemporadaDeUsuario(UUID temporadaId, UUID usuarioId);
}
