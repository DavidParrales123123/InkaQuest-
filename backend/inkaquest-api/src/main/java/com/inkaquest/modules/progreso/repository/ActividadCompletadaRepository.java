package com.inkaquest.modules.progreso.repository;

import com.inkaquest.modules.academico.entity.Curso;
import com.inkaquest.modules.identidad.entity.Perfil;
import com.inkaquest.modules.progreso.entity.ActividadCompletada;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositorio JPA de la entidad {@link ActividadCompletada} (tabla {@code public.actividad_completada}).
 *
 * <p>Las consultas se ejecutan bajo las politicas RLS de PostgreSQL: el
 * contexto de autorizacion de la transaccion determina que filas son
 * visibles. Ver {@code docs/base-de-datos/MATRIZ-RLS.md}.</p>
 */
@Repository
public interface ActividadCompletadaRepository extends JpaRepository<ActividadCompletada, UUID> {

    /**
     * Consulta derivada sobre la tabla {@code public.actividad_completada}.
     */
    Optional<ActividadCompletada> findByEstudianteIdAndCursoId(Perfil estudianteId, Curso cursoId);

    /**
     * Consulta derivada sobre la tabla {@code public.actividad_completada}.
     */
    Optional<ActividadCompletada> findByEstudianteId(Perfil estudianteId);
}
