package com.inkaquest.modules.soporte.repository;

import com.inkaquest.modules.soporte.entity.HistorialSoporte;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositorio JPA de la entidad {@link HistorialSoporte} (tabla {@code public.historial_soporte}).
 *
 * <p>Las consultas se ejecutan bajo las politicas RLS de PostgreSQL: el
 * contexto de autorizacion de la transaccion determina que filas son
 * visibles. Ver {@code docs/base-de-datos/MATRIZ-RLS.md}.</p>
 */
@Repository
public interface HistorialSoporteRepository extends JpaRepository<HistorialSoporte, UUID> {
}
