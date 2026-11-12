package com.inkaquest.modules.gamificacion.repository;

import com.inkaquest.modules.gamificacion.entity.TransaccionXp;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.UUID;

/**
 * Repositorio JPA de la entidad {@link TransaccionXp} (tabla {@code public.transaccion_xp}).
 */
@Repository
public interface TransaccionXpRepository extends JpaRepository<TransaccionXp, UUID> {

    /** Historial paginado de transacciones XP del usuario (mas reciente primero). */
    @Query("select t from TransaccionXp t where t.usuarioId.id = :usuarioId order by t.creadoEn desc")
    Page<TransaccionXp> findUltimasDeUsuario(UUID usuarioId, Pageable pageable);
}
