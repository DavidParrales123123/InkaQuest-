package com.inkaquest.modules.gamificacion.repository;

import com.inkaquest.modules.gamificacion.entity.Racha;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositorio JPA de la entidad {@link Racha} (tabla {@code public.racha}).
 */
@Repository
public interface RachaRepository extends JpaRepository<Racha, UUID> {

    /** Racha del usuario. */
    @Query("select r from Racha r where r.usuarioId.id = :usuarioId")
    Optional<Racha> findDeUsuario(UUID usuarioId);
}
