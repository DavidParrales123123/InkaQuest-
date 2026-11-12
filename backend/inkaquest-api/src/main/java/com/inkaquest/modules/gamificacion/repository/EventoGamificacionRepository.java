package com.inkaquest.modules.gamificacion.repository;

import com.inkaquest.modules.gamificacion.entity.EventoGamificacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositorio JPA de la entidad {@link EventoGamificacion} (tabla {@code public.evento_gamificacion}).
 *
 * <p>Las consultas se ejecutan bajo las politicas RLS de PostgreSQL: el
 * contexto de autorizacion de la transaccion determina que filas son
 * visibles. Ver {@code docs/base-de-datos/MATRIZ-RLS.md}.</p>
 */
@Repository
public interface EventoGamificacionRepository extends JpaRepository<EventoGamificacion, UUID> {
}
