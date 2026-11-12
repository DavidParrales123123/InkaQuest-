package com.inkaquest.modules.soporte.repository;

import com.inkaquest.modules.soporte.entity.Ticket;
import com.inkaquest.shared.enums.EstadoTicket;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

/**
 * Repositorio JPA de {@link Ticket} (tabla {@code public.ticket}).
 */
@Repository
public interface TicketRepository extends JpaRepository<Ticket, UUID> {

    /** Tickets del usuario, mas recientes primero. */
    @Query("select t from Ticket t where t.usuarioId.id = :usuarioId order by t.creadoEn desc")
    List<Ticket> findDeUsuario(UUID usuarioId);

    /** Tickets del usuario paginados. */
    Page<Ticket> findByUsuarioId(com.inkaquest.modules.identidad.entity.Perfil usuarioId, Pageable pageable);

    /** Tickets por estado (admin). */
    @Query("select t from Ticket t where t.estado = :estado order by t.creadoEn desc")
    List<Ticket> findPorEstado(EstadoTicket estado);
}
