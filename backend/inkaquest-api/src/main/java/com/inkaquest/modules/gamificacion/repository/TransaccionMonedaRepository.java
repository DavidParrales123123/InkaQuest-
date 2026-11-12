package com.inkaquest.modules.gamificacion.repository;

import com.inkaquest.modules.gamificacion.entity.TransaccionMoneda;
import com.inkaquest.modules.identidad.entity.Perfil;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositorio JPA de la entidad {@link TransaccionMoneda} (tabla {@code public.transaccion_moneda}).
 *
 * <p>Las consultas se ejecutan bajo las politicas RLS de PostgreSQL: el
 * contexto de autorizacion de la transaccion determina que filas son
 * visibles. Ver {@code docs/base-de-datos/MATRIZ-RLS.md}.</p>
 */
@Repository
public interface TransaccionMonedaRepository extends JpaRepository<TransaccionMoneda, UUID> {

    /**
     * Consulta derivada sobre la tabla {@code public.transaccion_moneda}.
     */
    Optional<TransaccionMoneda> findByUsuarioId(Perfil usuarioId);
}
