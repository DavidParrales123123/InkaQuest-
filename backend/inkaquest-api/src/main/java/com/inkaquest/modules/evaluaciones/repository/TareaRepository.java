package com.inkaquest.modules.evaluaciones.repository;

import com.inkaquest.modules.evaluaciones.entity.Tarea;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositorio JPA de la entidad {@link Tarea} (tabla {@code public.tarea}).
 *
 * <p>Las consultas se ejecutan bajo las politicas RLS de PostgreSQL: el
 * contexto de autorizacion de la transaccion determina que filas son
 * visibles. Ver {@code docs/base-de-datos/MATRIZ-RLS.md}.</p>
 */
@Repository
public interface TareaRepository extends JpaRepository<Tarea, UUID> {
    
    /**
     * Busca tareas por ID de curso a través de la actividad.
     * Query method: findBy + ActividadId (relación) + CursoId (relación anidada) + Id
     */
    java.util.List<Tarea> findByActividadIdCursoIdId(UUID cursoId);
}
