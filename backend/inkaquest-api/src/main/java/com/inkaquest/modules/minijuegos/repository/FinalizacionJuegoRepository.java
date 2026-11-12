package com.inkaquest.modules.minijuegos.repository;

import com.inkaquest.modules.minijuegos.entity.FinalizacionJuego;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositorio JPA de la entidad {@link FinalizacionJuego} (tabla {@code public.finalizacion_juego}).
 *
 * <p>Las consultas se ejecutan bajo las politicas RLS de PostgreSQL: el
 * contexto de autorizacion de la transaccion determina que filas son
 * visibles. Ver {@code docs/base-de-datos/MATRIZ-RLS.md}.</p>
 */
@Repository
public interface FinalizacionJuegoRepository extends JpaRepository<FinalizacionJuego, UUID> {
}
