package com.inkaquest.modules.soporte.dto;

import com.inkaquest.modules.soporte.entity.Ticket;
import com.inkaquest.modules.soporte.entity.TicketRespuesta;
import com.inkaquest.shared.enums.EstadoTicket;
import com.inkaquest.shared.enums.PrioridadTicket;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Alta de ticket de soporte (v1). */
public record TicketCrearRequest(
        @NotBlank(message = "El asunto es obligatorio.")
        @Size(max = 200, message = "El asunto no puede superar 200 caracteres.")
        String asunto,

        @NotBlank(message = "La descripcion es obligatoria.")
        @Size(max = 4000, message = "La descripcion no puede superar 4000 caracteres.")
        String descripcion,

        @Size(max = 50, message = "La categoria no puede superar 50 caracteres.")
        String categoria,

        PrioridadTicket prioridad) {

    /** Detalle completo del ticket. */
    public record TicketResponse(
            UUID id,
            String asunto,
            String descripcion,
            String categoria,
            PrioridadTicket prioridad,
            EstadoTicket estado,
            Instant creadoEn,
            List<RespuestaResponse> respuestas) {

        public static TicketResponse from(Ticket t, List<TicketRespuesta> respuestas) {
            return new TicketResponse(
                    t.getId(),
                    t.getAsunto(),
                    t.getDescripcion(),
                    t.getCategoria(),
                    t.getPrioridad(),
                    t.getEstado(),
                    t.getCreadoEn(),
                    respuestas.stream().map(RespuestaResponse::from).toList());
        }
    }

    public record RespuestaResponse(
            UUID id,
            UUID autorId,
            String cuerpo,
            Boolean esInterna,
            Instant creadoEn) {

        public static RespuestaResponse from(TicketRespuesta r) {
            return new RespuestaResponse(
                    r.getId(),
                    r.getAutorId() != null ? r.getAutorId().getId() : null,
                    r.getCuerpo(),
                    r.getEsInterna(),
                    r.getCreadoEn());
        }
    }

    /** Mensaje dentro de un ticket. */
    public record MensajeTicketRequest(
            @NotBlank(message = "El cuerpo del mensaje es obligatorio.")
            @Size(max = 4000, message = "El mensaje no puede superar 4000 caracteres.")
            String cuerpo) {
    }
}
