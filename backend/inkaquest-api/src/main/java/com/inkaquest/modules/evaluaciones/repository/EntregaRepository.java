package com.inkaquest.modules.evaluaciones.repository;

import com.inkaquest.modules.evaluaciones.entity.Entrega;
import com.inkaquest.modules.identidad.entity.Perfil;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositorio JPA de la entidad {@link Entrega} (tabla {@code public.entrega}).
 *
 * <p>Las consultas se ejecutan bajo las politicas RLS de PostgreSQL: el
 * contexto de autorizacion de la transaccion determina que filas son
 * visibles. Ver {@code docs/base-de-datos/MATRIZ-RLS.md}.</p>
 */
@Repository
public interface EntregaRepository extends JpaRepository<Entrega, UUID> {

    /**
     * Consulta derivada sobre la tabla {@code public.entrega}.
     */
    Optional<Entrega> findByEstudianteId(Perfil estudianteId);
    
    /**
     * Busca todas las entregas de una tarea.
     */
    java.util.List<Entrega> findByTareaIdId(UUID tareaId);
    
    /**
     * Busca la entrega de un estudiante para una tarea específica.
     */
    Optional<Entrega> findByTareaIdIdAndEstudianteIdId(UUID tareaId, UUID estudianteId);
    
    /**
     * Verifica si existe una entrega de un estudiante para una tarea.
     */
    boolean existsByTareaIdIdAndEstudianteIdId(UUID tareaId, UUID estudianteId);
}
