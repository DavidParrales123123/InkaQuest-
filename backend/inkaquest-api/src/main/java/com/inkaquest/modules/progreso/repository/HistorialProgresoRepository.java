package com.inkaquest.modules.progreso.repository;

import com.inkaquest.modules.identidad.entity.Perfil;
import com.inkaquest.modules.progreso.entity.HistorialProgreso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositorio JPA de la entidad {@link HistorialProgreso} (tabla {@code public.historial_progreso}).
 *
 * <p>Las consultas se ejecutan bajo las politicas RLS de PostgreSQL: el
 * contexto de autorizacion de la transaccion determina que filas son
 * visibles. Ver {@code docs/base-de-datos/MATRIZ-RLS.md}.</p>
 */
@Repository
public interface HistorialProgresoRepository extends JpaRepository<HistorialProgreso, UUID> {

    /**
     * Consulta derivada sobre la tabla {@code public.historial_progreso}.
     */
    Optional<HistorialProgreso> findByEstudianteId(Perfil estudianteId);
}
