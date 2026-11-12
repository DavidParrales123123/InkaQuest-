package com.inkaquest.modules.academico.repository;

import com.inkaquest.modules.academico.entity.RequisitoPrevio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositorio JPA de la entidad {@link RequisitoPrevio} (tabla {@code public.requisito_previo}).
 *
 * <p>Las consultas se ejecutan bajo las politicas RLS de PostgreSQL: el
 * contexto de autorizacion de la transaccion determina que filas son
 * visibles. Ver {@code docs/base-de-datos/MATRIZ-RLS.md}.</p>
 */
@Repository
public interface RequisitoPrevioRepository extends JpaRepository<RequisitoPrevio, UUID> {
}
