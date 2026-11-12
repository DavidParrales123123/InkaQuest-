package com.inkaquest.modules.evaluaciones.repository;

import com.inkaquest.modules.evaluaciones.entity.TareaArchivo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Repositorio JPA de la entidad {@link TareaArchivo} (tabla
 * {@code public.tarea_archivo}).
 */
@Repository
public interface TareaArchivoRepository extends JpaRepository<TareaArchivo, UUID> {

    /** Lista los adjuntos de una tarea para el docente. */
    List<TareaArchivo> findByTarea_IdOrderByCreadoEnAsc(UUID tareaId);
}
