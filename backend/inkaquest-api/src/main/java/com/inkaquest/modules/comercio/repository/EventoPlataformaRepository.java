package com.inkaquest.modules.comercio.repository;

import com.inkaquest.modules.comercio.entity.EventoPlataforma;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositorio JPA de la entidad {@link EventoPlataforma} (tabla {@code public.evento_plataforma}).
 *
 * <p>Las consultas se ejecutan bajo las politicas RLS de PostgreSQL: el
 * contexto de autorizacion de la transaccion determina que filas son
 * visibles. Ver {@code docs/base-de-datos/MATRIZ-RLS.md}.</p>
 */
@Repository
public interface EventoPlataformaRepository extends JpaRepository<EventoPlataforma, UUID> {
}
