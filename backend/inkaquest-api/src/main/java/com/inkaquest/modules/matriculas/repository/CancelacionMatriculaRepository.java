package com.inkaquest.modules.matriculas.repository;

import com.inkaquest.modules.matriculas.entity.CancelacionMatricula;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositorio JPA de la entidad {@link CancelacionMatricula} (tabla {@code public.cancelacion_matricula}).
 *
 * <p>Las consultas se ejecutan bajo las politicas RLS de PostgreSQL: el
 * contexto de autorizacion de la transaccion determina que filas son
 * visibles. Ver {@code docs/base-de-datos/MATRIZ-RLS.md}.</p>
 */
@Repository
public interface CancelacionMatriculaRepository extends JpaRepository<CancelacionMatricula, UUID> {
}
