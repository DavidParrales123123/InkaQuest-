package com.inkaquest.modules.comercio.repository;

import com.inkaquest.modules.comercio.entity.HistorialFinanciero;
import com.inkaquest.modules.identidad.entity.Perfil;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositorio JPA de la entidad {@link HistorialFinanciero} (tabla {@code public.historial_financiero}).
 *
 * <p>Las consultas se ejecutan bajo las politicas RLS de PostgreSQL: el
 * contexto de autorizacion de la transaccion determina que filas son
 * visibles. Ver {@code docs/base-de-datos/MATRIZ-RLS.md}.</p>
 */
@Repository
public interface HistorialFinancieroRepository extends JpaRepository<HistorialFinanciero, UUID> {

    /**
     * Consulta derivada sobre la tabla {@code public.historial_financiero}.
     */
    Optional<HistorialFinanciero> findByUsuarioId(Perfil usuarioId);
}
