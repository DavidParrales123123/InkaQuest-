package com.inkaquest.modules.retos.repository;

import com.inkaquest.modules.retos.entity.ResultadoCaso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositorio JPA de la entidad {@link ResultadoCaso} (tabla {@code public.resultado_caso}).
 *
 * <p>Las consultas se ejecutan bajo las politicas RLS de PostgreSQL: el
 * contexto de autorizacion de la transaccion determina que filas son
 * visibles. Ver {@code docs/base-de-datos/MATRIZ-RLS.md}.</p>
 */
@Repository
public interface ResultadoCasoRepository extends JpaRepository<ResultadoCaso, UUID> {
}
