package com.inkaquest.modules.soporte.service;

import com.inkaquest.modules.identidad.entity.Perfil;
import com.inkaquest.modules.identidad.repository.PerfilRepository;
import com.inkaquest.modules.soporte.dto.TicketCrearRequest;
import com.inkaquest.modules.soporte.entity.Ticket;
import com.inkaquest.modules.soporte.entity.TicketRespuesta;
import com.inkaquest.modules.soporte.repository.TicketRepository;
import com.inkaquest.modules.soporte.repository.TicketRespuestaRepository;
import com.inkaquest.shared.enums.EstadoTicket;
import com.inkaquest.shared.exception.BadRequestException;
import com.inkaquest.shared.exception.ResourceNotFoundException;
import com.inkaquest.shared.exception.UnauthorizedException;
import com.inkaquest.shared.security.CheckRoleService;
import com.inkaquest.shared.security.RlsExecutor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Servicio de soporte y tickets.
 *
 * <p>Propiedad del recurso: un ticket solo lo ve su autor o un administrador
 * (autor o admin). Se muestran las respuestas internas solo a admins.</p>
 */
@Service
public class SoporteService {

    private final TicketRepository ticketRepository;
    private final TicketRespuestaRepository respuestaRepository;
    private final PerfilRepository perfilRepository;
    private final CheckRoleService checkRoleService;
    private final RlsExecutor rlsExecutor;

    public SoporteService(TicketRepository ticketRepository,
                          TicketRespuestaRepository respuestaRepository,
                          PerfilRepository perfilRepository,
                          CheckRoleService checkRoleService,
                          RlsExecutor rlsExecutor) {
        this.ticketRepository = ticketRepository;
        this.respuestaRepository = respuestaRepository;
        this.perfilRepository = perfilRepository;
        this.checkRoleService = checkRoleService;
        this.rlsExecutor = rlsExecutor;
    }

    /** Crea un ticket de soporte. */
    @Transactional
    public TicketCrearRequest.TicketResponse crear(UUID actorId, TicketCrearRequest request) {
        return rlsExecutor.executeAs(actorId, () -> {
            Perfil actor = perfilRepository.findById(actorId)
                    .orElseThrow(() -> new ResourceNotFoundException("Perfil no encontrado."));
            Ticket ticket = new Ticket();
            ticket.setUsuarioId(actor);
            ticket.setAsunto(request.asunto().trim());
            ticket.setDescripcion(request.descripcion().trim());
            ticket.setCategoria(request.categoria() != null && !request.categoria().isBlank()
                    ? request.categoria().trim() : null);
            ticket.setPrioridad(request.prioridad() != null
                    ? request.prioridad() : com.inkaquest.shared.enums.PrioridadTicket.media);
            ticket.setEstado(EstadoTicket.abierto);
            ticket.setClaveIdempotencia(UUID.randomUUID().toString());
            ticket = ticketRepository.save(ticket);
            return TicketCrearRequest.TicketResponse.from(ticket, List.of());
        });
    }

    /** Lista mis tickets con sus respuestas. */
    @Transactional
    public List<TicketCrearRequest.TicketResponse> misTickets(UUID actorId) {
        return rlsExecutor.executeAs(actorId, () ->
                ticketRepository.findDeUsuario(actorId).stream()
                        .map(t -> TicketCrearRequest.TicketResponse.from(t,
                                respuestaRepository.findDeTicket(t.getId())))
                        .toList());
    }

    /** Detalle de un ticket: solo autor o admin (ocultando notas internas si no admin). */
    @Transactional
    public TicketCrearRequest.TicketResponse detalle(UUID actorId, UUID ticketId) {
        return rlsExecutor.executeAs(actorId, () -> {
            Ticket ticket = ticketLegible(ticketId, actorId);
            List<TicketRespuesta> respuestas = respuestaRepository.findDeTicket(ticketId);
            boolean esAdmin = esAdmin(actorId);
            if (!esAdmin) {
                respuestas = respuestas.stream().filter(r -> !Boolean.TRUE.equals(r.getEsInterna())).toList();
            }
            return TicketCrearRequest.TicketResponse.from(ticket, respuestas);
        });
    }

    /** Agrega un mensaje al ticket. Autor o admin; admin puede marcar interno. */
    @Transactional
    public TicketCrearRequest.RespuestaResponse responder(UUID actorId, UUID ticketId,
                                                          TicketCrearRequest.MensajeTicketRequest request) {
        return rlsExecutor.executeAs(actorId, () -> {
            Ticket ticket = ticketLegible(ticketId, actorId);
            if (ticket.getEstado() == EstadoTicket.cerrado) {
                throw new BadRequestException("El ticket esta cerrado. Abre uno nuevo si necesitas continuar.");
            }
            Perfil actor = perfilRepository.findById(actorId)
                    .orElseThrow(() -> new ResourceNotFoundException("Perfil no encontrado."));
            TicketRespuesta respuesta = new TicketRespuesta();
            respuesta.setTicketId(ticket);
            respuesta.setAutorId(actor);
            respuesta.setCuerpo(request.cuerpo().trim());
            respuesta.setEsInterna(Boolean.FALSE);
            respuesta.setAdjunto(Map.of());
            respuesta = respuestaRepository.save(respuesta);
            if (ticket.getEstado() == EstadoTicket.abierto) {
                ticket.setEstado(EstadoTicket.en_progreso);
                ticketRepository.save(ticket);
            }
            return TicketCrearRequest.RespuestaResponse.from(respuesta);
        });
    }

    /** Cierra el ticket. Autor o admin. */
    @Transactional
    public TicketCrearRequest.TicketResponse cerrar(UUID actorId, UUID ticketId) {
        return rlsExecutor.executeAs(actorId, () -> {
            Ticket ticket = ticketLegible(ticketId, actorId);
            if (ticket.getEstado() == EstadoTicket.cerrado) {
                return TicketCrearRequest.TicketResponse.from(
                        ticket, respuestaRepository.findDeTicket(ticket.getId()));
            }
            ticket.setEstado(EstadoTicket.cerrado);
            ticket.setCerradoEn(Instant.now());
            ticket = ticketRepository.save(ticket);
            return TicketCrearRequest.TicketResponse.from(
                    ticket, respuestaRepository.findDeTicket(ticket.getId()));
        });
    }

    // ---------- interno ----------

    private Ticket ticketLegible(UUID ticketId, UUID actorId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket no encontrado."));
        boolean esAdmin = esAdmin(actorId);
        boolean esAutor = ticket.getUsuarioId() != null
                && actorId.equals(ticket.getUsuarioId().getId());
        if (!esAdmin && !esAutor) {
            throw new UnauthorizedException("No tienes permiso para ver este ticket.");
        }
        return ticket;
    }

    private boolean esAdmin(UUID actorId) {
        return checkRoleService.rolDe(actorId) == com.inkaquest.shared.enums.RolUsuario.administrador;
    }
}
