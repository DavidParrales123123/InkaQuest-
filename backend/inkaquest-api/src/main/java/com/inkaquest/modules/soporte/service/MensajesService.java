package com.inkaquest.modules.soporte.service;

import com.inkaquest.modules.identidad.entity.Perfil;
import com.inkaquest.modules.identidad.repository.PerfilRepository;
import com.inkaquest.modules.soporte.dto.HiloResumenResponse;
import com.inkaquest.modules.soporte.dto.MensajeCrearRequest;
import com.inkaquest.modules.soporte.dto.MensajeResponse;
import com.inkaquest.modules.soporte.entity.Mensaje;
import com.inkaquest.modules.soporte.repository.MensajeRepository;
import com.inkaquest.shared.exception.BadRequestException;
import com.inkaquest.shared.exception.ResourceNotFoundException;
import com.inkaquest.shared.security.RlsExecutor;
import org.springframework.data.domain.Limit;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Mensajeria estudiante-estudiante / docente-estudiante (1 a 1).
 */
@Service
public class MensajesService {

    private final MensajeRepository mensajeRepository;
    private final PerfilRepository perfilRepository;
    private final RlsExecutor rlsExecutor;

    public MensajesService(MensajeRepository mensajeRepository,
                           PerfilRepository perfilRepository,
                           RlsExecutor rlsExecutor) {
        this.mensajeRepository = mensajeRepository;
        this.perfilRepository = perfilRepository;
        this.rlsExecutor = rlsExecutor;
    }

    /** Hilos del usuario con nombre, ultimo mensaje y no leidos. */
    @Transactional
    public List<HiloResumenResponse> hilos(UUID usuarioId) {
        return rlsExecutor.executeAs(usuarioId, () -> {
            List<Mensaje> ultimos = mensajeRepository.ultimosDeUsuario(usuarioId, Limit.of(500));

            // ultimos viene desc (mas reciente primero) -> el primero de cada grupo es el ultimo.
            Map<UUID, Mensaje> ultimoPorOtro = new LinkedHashMap<>();
            Map<UUID, Long> noLeidosPorOtro = new HashMap<>();
            for (Mensaje m : ultimos) {
                UUID otroId = m.getEmisorId().getId().equals(usuarioId)
                        ? m.getDestinatarioId().getId()
                        : m.getEmisorId().getId();
                ultimoPorOtro.putIfAbsent(otroId, m);
                if (m.getDestinatarioId().getId().equals(usuarioId) && m.getLeidoEn() == null) {
                    noLeidosPorOtro.merge(otroId, 1L, Long::sum);
                }
            }

            List<UUID> ids = new ArrayList<>(ultimoPorOtro.keySet());
            Map<UUID, Perfil> perfiles = perfilRepository.findAllById(ids)
                    .stream()
                    .collect(Collectors.toMap(Perfil::getId, p -> p));

            return ultimoPorOtro.values().stream()
                    .map(m -> {
                        UUID otroId = m.getEmisorId().getId().equals(usuarioId)
                                ? m.getDestinatarioId().getId()
                                : m.getEmisorId().getId();
                        Perfil p = perfiles.get(otroId);
                        String nombre = p != null
                                ? ((p.getNombre() != null ? p.getNombre() : "") + " "
                                        + (p.getApellido() != null ? p.getApellido() : "")).trim()
                                : "Usuario";
                        if (nombre.isEmpty() && p != null) {
                            nombre = p.getEmail();
                        }
                        return new HiloResumenResponse(
                                otroId,
                                nombre,
                                p != null ? p.getEmail() : null,
                                m.getCuerpo(),
                                m.getCreadoEn(),
                                noLeidosPorOtro.getOrDefault(otroId, 0L));
                    })
                    .sorted(Comparator.comparing(HiloResumenResponse::ultimoEn,
                            Comparator.nullsFirst(Comparator.naturalOrder())).reversed())
                    .toList();
        });
    }

    /** Conversacion cronologica con otro usuario. */
    @Transactional
    public List<MensajeResponse> conversacion(UUID usuarioId, UUID otroId) {
        return rlsExecutor.executeAs(usuarioId, () ->
                mensajeRepository.conversacion(usuarioId, otroId)
                        .stream()
                        .map(MensajeResponse::from)
                        .toList());
    }

    /** Envia un mensaje a otro usuario (reutilizando hilo si existe). */
    @Transactional
    public MensajeResponse enviar(UUID usuarioId, UUID otroId, MensajeCrearRequest request) {
        return rlsExecutor.executeAs(usuarioId, () -> {
            Perfil emisor = perfilRepository.findById(usuarioId)
                    .orElseThrow(() -> new ResourceNotFoundException("Perfil no encontrado."));
            Perfil destinatario = perfilRepository.findById(otroId)
                    .orElseThrow(() -> new ResourceNotFoundException("El destinatario no existe."));

            if (destinatario.getId().equals(usuarioId)) {
                throw new BadRequestException("No puedes enviarte un mensaje a ti mismo.");
            }

            List<Mensaje> historial = mensajeRepository.conversacion(usuarioId, otroId);
            UUID hilo = historial.isEmpty()
                    ? UUID.randomUUID()
                    : historial.get(historial.size() - 1).getHiloId();

            Mensaje m = new Mensaje();
            m.setEmisorId(emisor);
            m.setDestinatarioId(destinatario);
            m.setHiloId(hilo != null ? hilo : UUID.randomUUID());
            m.setCuerpo(request.cuerpo().trim());
            m.setAdjuntos(Map.of());
            m.setBorradoPorEmisor(false);
            m.setBorradoPorDestinatario(false);
            return MensajeResponse.from(mensajeRepository.save(m));
        });
    }

    /** Marca como leidos los mensajes del otro a mi. */
    @Transactional
    public long marcarLeidos(UUID usuarioId, UUID otroId) {
        return rlsExecutor.executeAs(usuarioId, () -> {
            List<Mensaje> pendientes = mensajeRepository.conversacion(usuarioId, otroId)
                    .stream()
                    .filter(m -> m.getDestinatarioId().getId().equals(usuarioId) && m.getLeidoEn() == null)
                    .toList();
            if (pendientes.isEmpty()) {
                return 0L;
            }
            Instant ahora = Instant.now();
            pendientes.forEach(m -> m.setLeidoEn(ahora));
            mensajeRepository.saveAll(pendientes);
            return (long) pendientes.size();
        });
    }
}
