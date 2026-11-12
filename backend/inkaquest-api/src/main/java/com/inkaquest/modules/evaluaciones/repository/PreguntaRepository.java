package com.inkaquest.modules.evaluaciones.repository;

import com.inkaquest.modules.evaluaciones.entity.Pregunta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositorio JPA de la entidad {@link Pregunta} (tabla {@code public.pregunta}).
 *
 * <p>Las consultas se ejecutan bajo las politicas RLS de PostgreSQL: el
 * contexto de autorizacion de la transaccion determina que filas son
 * visibles. Ver {@code docs/base-de-datos/MATRIZ-RLS.md}.</p>
 */
@Repository
public interface PreguntaRepository extends JpaRepository<Pregunta, UUID> {
    
    /**
     * Busca todas las preguntas de una evaluación ordenadas.
     */
    java.util.List<Pregunta> findByEvaluacionIdIdOrderByOrdenAsc(UUID evaluacionId);
    
    /**
     * Cuenta las preguntas de una evaluación.
     */
    long countByEvaluacionIdId(UUID evaluacionId);
}
