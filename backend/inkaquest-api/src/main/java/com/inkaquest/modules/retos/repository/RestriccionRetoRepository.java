package com.inkaquest.modules.retos.repository;

import com.inkaquest.modules.retos.entity.RestriccionReto;
import com.inkaquest.modules.retos.entity.Reto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositorio JPA de la entidad {@link RestriccionReto} (tabla {@code public.restriccion_reto}).
 *
 * <p>Las consultas se ejecutan bajo las politicas RLS de PostgreSQL: el
 * contexto de autorizacion de la transaccion determina que filas son
 * visibles. Ver {@code docs/base-de-datos/MATRIZ-RLS.md}.</p>
 */
@Repository
public interface RestriccionRetoRepository extends JpaRepository<RestriccionReto, UUID> {

    /**
     * Consulta derivada sobre la tabla {@code public.restriccion_reto}.
     */
    Optional<RestriccionReto> findByRetoId(Reto retoId);
}
