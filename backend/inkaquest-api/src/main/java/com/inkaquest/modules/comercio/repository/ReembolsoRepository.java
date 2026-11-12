package com.inkaquest.modules.comercio.repository;

import com.inkaquest.modules.comercio.entity.Reembolso;
import com.inkaquest.modules.identidad.entity.Perfil;
import com.inkaquest.shared.enums.EstadoReembolso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositorio JPA de la entidad {@link Reembolso} (tabla {@code public.reembolso}).
 *
 * <p>Las consultas se ejecutan bajo las politicas RLS de PostgreSQL: el
 * contexto de autorizacion de la transaccion determina que filas son
 * visibles. Ver {@code docs/base-de-datos/MATRIZ-RLS.md}.</p>
 */
@Repository
public interface ReembolsoRepository extends JpaRepository<Reembolso, UUID> {

    /**
     * Consulta derivada sobre la tabla {@code public.reembolso}.
     */
    Optional<Reembolso> findByUsuarioIdAndEstado(Perfil usuarioId, EstadoReembolso estado);

    /**
     * Consulta derivada sobre la tabla {@code public.reembolso}.
     */
    Optional<Reembolso> findByUsuarioId(Perfil usuarioId);
}
