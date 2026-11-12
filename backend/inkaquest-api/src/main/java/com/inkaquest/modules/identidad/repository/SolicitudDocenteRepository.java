package com.inkaquest.modules.identidad.repository;

import com.inkaquest.modules.identidad.entity.SolicitudDocente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

/**
 * Repositorio JPA de la entidad {@link SolicitudDocente} (tabla {@code public.solicitud_docente}).
 *
 * <p>Las consultas se ejecutan bajo las politicas RLS de PostgreSQL: el
 * contexto de autorizacion de la transaccion determina que filas son
 * visibles. Ver {@code docs/base-de-datos/MATRIZ-RLS.md}.</p>
 */
@Repository
public interface SolicitudDocenteRepository extends JpaRepository<SolicitudDocente, UUID> {

    List<SolicitudDocente> findByUsuarioId_IdOrderByCreadoEnDesc(UUID usuarioId);

    List<SolicitudDocente> findByEstadoOrderByCreadoEnDesc(
            com.inkaquest.shared.enums.EstadoSolicitudDocente estado);
}
