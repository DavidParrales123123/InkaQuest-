package com.inkaquest.modules.evaluaciones.repository;

import com.inkaquest.modules.evaluaciones.entity.Evaluacion;
import com.inkaquest.modules.evaluaciones.entity.IntentoEvaluacion;
import com.inkaquest.modules.identidad.entity.Perfil;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositorio JPA de la entidad {@link IntentoEvaluacion} (tabla {@code public.intento_evaluacion}).
 *
 * <p>Las consultas se ejecutan bajo las politicas RLS de PostgreSQL: el
 * contexto de autorizacion de la transaccion determina que filas son
 * visibles. Ver {@code docs/base-de-datos/MATRIZ-RLS.md}.</p>
 */
@Repository
public interface IntentoEvaluacionRepository extends JpaRepository<IntentoEvaluacion, UUID> {

    /**
     * Consulta derivada sobre la tabla {@code public.intento_evaluacion}.
     */
    Optional<IntentoEvaluacion> findByEstudianteIdAndEvaluacionId(Perfil estudianteId, Evaluacion evaluacionId);

    /**
     * Consulta derivada sobre la tabla {@code public.intento_evaluacion}.
     */
    Optional<IntentoEvaluacion> findByEstudianteId(Perfil estudianteId);
    
    /**
     * Cuenta intentos de un estudiante en una evaluación.
     */
    int countByEstudianteIdIdAndEvaluacionIdId(UUID estudianteId, UUID evaluacionId);
    
    /**
     * Lista todos los intentos de un estudiante en una evaluación.
     */
    java.util.List<IntentoEvaluacion> findByEstudianteIdIdAndEvaluacionIdIdOrderByNumeroDesc(UUID estudianteId, UUID evaluacionId);
}
