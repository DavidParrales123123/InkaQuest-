package com.inkaquest.modules.soporte.repository;

import com.inkaquest.modules.soporte.entity.TicketRespuesta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

/**
 * Repositorio JPA de {@link TicketRespuesta} (tabla {@code public.ticket_respuesta}).
 */
@Repository
public interface TicketRespuestaRepository extends JpaRepository<TicketRespuesta, UUID> {

    /** Respuestas de un ticket, de la mas antigua a la mas reciente. */
    @Query("select r from TicketRespuesta r where r.ticketId.id = :ticketId order by r.creadoEn asc")
    List<TicketRespuesta> findDeTicket(UUID ticketId);
}
