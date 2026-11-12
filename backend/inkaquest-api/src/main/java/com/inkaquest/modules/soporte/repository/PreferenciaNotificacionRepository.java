package com.inkaquest.modules.soporte.repository;

import com.inkaquest.modules.identidad.entity.Perfil;
import com.inkaquest.modules.soporte.entity.PreferenciaNotificacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositorio JPA de la entidad {@link PreferenciaNotificacion} (tabla {@code public.preferencia_notificacion}).
 *
 * <p>Las consultas se ejecutan bajo las politicas RLS de PostgreSQL: el
 * contexto de autorizacion de la transaccion determina que filas son
 * visibles. Ver {@code docs/base-de-datos/MATRIZ-RLS.md}.</p>
 */
@Repository
public interface PreferenciaNotificacionRepository extends JpaRepository<PreferenciaNotificacion, UUID> {

    /**
     * Consulta derivada sobre la tabla {@code public.preferencia_notificacion}.
     */
    Optional<PreferenciaNotificacion> findByUsuarioId(Perfil usuarioId);
}
