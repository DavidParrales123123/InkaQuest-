package com.inkaquest.modules.gamificacion.repository;

import com.inkaquest.modules.gamificacion.entity.InsigniaUsuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

/**
 * Repositorio JPA de la entidad {@link InsigniaUsuario} (tabla {@code public.insignia_usuario}).
 */
@Repository
public interface InsigniaUsuarioRepository extends JpaRepository<InsigniaUsuario, UUID> {

    /** Insignias del usuario (todas). */
    @Query("select i from InsigniaUsuario i where i.usuarioId.id = :usuarioId")
    List<InsigniaUsuario> findDeUsuario(UUID usuarioId);

    /** Insignias efectivamente obtenidas (obtenidaEn != null). */
    @Query("select i from InsigniaUsuario i where i.usuarioId.id = :usuarioId and i.obtenidaEn is not null")
    List<InsigniaUsuario> findObtenidasDeUsuario(UUID usuarioId);
}
