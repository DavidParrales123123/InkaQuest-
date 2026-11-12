package com.inkaquest.modules.soporte.repository;

import com.inkaquest.modules.soporte.entity.NotificacionDestinatario;
import com.inkaquest.shared.enums.EstadoNotificacion;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.UUID;

/**
 * Repositorio JPA de {@link NotificacionDestinatario} (tabla {@code public.notificacion_destinatario}).
 */
@Repository
public interface NotificacionDestinatarioRepository extends JpaRepository<NotificacionDestinatario, UUID> {

    /** Notificaciones del usuario, no leidas primero y mas recientes despues. */
    @Query("select nd from NotificacionDestinatario nd join fetch nd.notificacionId n where nd.usuarioId.id = :usuarioId order by nd.leidaEn asc nulls first, coalesce(nd.enviadaEn, nd.creadoEn) desc")
    Page<NotificacionDestinatario> findDeUsuario(UUID usuarioId, Pageable pageable);

    /** Cantidad de no leidas del usuario. */
    @Query("select count(nd) from NotificacionDestinatario nd where nd.usuarioId.id = :usuarioId and nd.leidaEn is null")
    long countNoLeidas(UUID usuarioId);

    /** Marca todas como leidas de una vez (atomico). */
    @Modifying(clearAutomatically = true)
    @Query("update NotificacionDestinatario nd set nd.leidaEn = CURRENT_TIMESTAMP, nd.estado = :estado where nd.usuarioId.id = :usuarioId and nd.leidaEn is null")
    int marcarTodasLeidas(UUID usuarioId, EstadoNotificacion estado);
}
