package com.inkaquest.modules.evaluaciones.repository;

import com.inkaquest.modules.evaluaciones.entity.Opcion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositorio JPA de la entidad {@link Opcion} (tabla {@code public.opcion}).
 *
 * <p>Las consultas se ejecutan bajo las politicas RLS de PostgreSQL: el
 * contexto de autorizacion de la transaccion determina que filas son
 * visibles. Ver {@code docs/base-de-datos/MATRIZ-RLS.md}.</p>
 */
@Repository
public interface OpcionRepository extends JpaRepository<Opcion, UUID> {
    
    /**
     * Busca todas las opciones de una pregunta ordenadas.
     */
    java.util.List<Opcion> findByPreguntaIdIdOrderByOrdenAsc(UUID preguntaId);
}
