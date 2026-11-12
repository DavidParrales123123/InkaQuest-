package com.inkaquest.modules.gamificacion.repository;

import com.inkaquest.modules.gamificacion.entity.MisionUsuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositorio JPA de la entidad {@link MisionUsuario} (tabla {@code public.mision_usuario}).
 */
@Repository
public interface MisionUsuarioRepository extends JpaRepository<MisionUsuario, UUID> {

    /** Progreso del usuario en todas sus misiones. */
    @Query("select mu from MisionUsuario mu where mu.usuarioId.id = :usuarioId")
    List<MisionUsuario> findDeUsuario(UUID usuarioId);

    /** Progreso del usuario en una mision concreta. */
    @Query("select mu from MisionUsuario mu where mu.usuarioId.id = :usuarioId and mu.misionId.id = :misionId")
    Optional<MisionUsuario> findDeUsuarioEnMision(UUID usuarioId, UUID misionId);
}
