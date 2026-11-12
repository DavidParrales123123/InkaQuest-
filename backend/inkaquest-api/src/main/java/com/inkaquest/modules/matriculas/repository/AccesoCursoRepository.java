package com.inkaquest.modules.matriculas.repository;

import com.inkaquest.modules.academico.entity.Curso;
import com.inkaquest.modules.matriculas.entity.AccesoCurso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositorio JPA de la entidad {@link AccesoCurso} (tabla {@code public.acceso_curso}).
 *
 * <p>Las consultas se ejecutan bajo las politicas RLS de PostgreSQL: el
 * contexto de autorizacion de la transaccion determina que filas son
 * visibles. Ver {@code docs/base-de-datos/MATRIZ-RLS.md}.</p>
 */
@Repository
public interface AccesoCursoRepository extends JpaRepository<AccesoCurso, UUID> {

    /**
     * Consulta derivada sobre la tabla {@code public.acceso_curso}.
     */
    Optional<AccesoCurso> findByCursoId(Curso cursoId);
}
