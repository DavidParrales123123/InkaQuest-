package com.inkaquest.modules.evaluaciones.repository;

import com.inkaquest.modules.evaluaciones.entity.Calificacion;
import com.inkaquest.modules.identidad.entity.Perfil;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositorio JPA de la entidad {@link Calificacion} (tabla {@code public.calificacion}).
 *
 * <p>Las consultas se ejecutan bajo las politicas RLS de PostgreSQL: el
 * contexto de autorizacion de la transaccion determina que filas son
 * visibles. Ver {@code docs/base-de-datos/MATRIZ-RLS.md}.</p>
 */
@Repository
public interface CalificacionRepository extends JpaRepository<Calificacion, UUID> {

    /**
     * Consulta derivada sobre la tabla {@code public.calificacion}.
     */
    Optional<Calificacion> findByEstudianteId(Perfil estudianteId);
    
    /**
     * Busca una calificación por ID de entrega.
     * Query method: findBy + EntregaId (relación ManyToOne) + Id (campo UUID de Entrega)
     */
    Optional<Calificacion> findByEntregaIdId(UUID entregaId);
}
