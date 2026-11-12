package com.inkaquest.modules.evaluaciones.repository;

import com.inkaquest.modules.evaluaciones.entity.RespuestaEvaluacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositorio JPA de la entidad {@link RespuestaEvaluacion} (tabla {@code public.respuesta_evaluacion}).
 *
 * <p>Las consultas se ejecutan bajo las politicas RLS de PostgreSQL: el
 * contexto de autorizacion de la transaccion determina que filas son
 * visibles. Ver {@code docs/base-de-datos/MATRIZ-RLS.md}.</p>
 */
@Repository
public interface RespuestaEvaluacionRepository extends JpaRepository<RespuestaEvaluacion, UUID> {
    
    /**
     * Busca todas las respuestas de un intento.
     */
    java.util.List<RespuestaEvaluacion> findByIntentoIdId(UUID intentoId);
}
