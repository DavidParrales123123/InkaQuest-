package com.inkaquest.modules.gamificacion.repository;

import com.inkaquest.modules.gamificacion.entity.ReglaProgresion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositorio JPA de la entidad {@link ReglaProgresion} (tabla {@code public.regla_progresion}).
 *
 * <p>Las consultas se ejecutan bajo las politicas RLS de PostgreSQL: el
 * contexto de autorizacion de la transaccion determina que filas son
 * visibles. Ver {@code docs/base-de-datos/MATRIZ-RLS.md}.</p>
 */
@Repository
public interface ReglaProgresionRepository extends JpaRepository<ReglaProgresion, UUID> {
}
