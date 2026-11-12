package com.inkaquest.modules.retos.service;

import com.inkaquest.modules.identidad.entity.Perfil;
import com.inkaquest.modules.identidad.repository.PerfilRepository;
import com.inkaquest.modules.retos.dto.*;
import com.inkaquest.modules.retos.entity.*;
import com.inkaquest.modules.retos.repository.*;
import com.inkaquest.shared.enums.EstadoEnvio;
import com.inkaquest.shared.exception.BadRequestException;
import com.inkaquest.shared.exception.ResourceNotFoundException;
import com.inkaquest.shared.security.RlsExecutor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Servicio de retos de programacion.
 *
 * <p><b>Estado de esta seccion.</b> La capa de datos del reto funciona
 * (retos, lenguajes, casos, envios), pero la EJECUCION del codigo del
 * estudiante no existe todavia: hace falta un sandbox aislado que no
 * tenemos. Por eso los envios se registran en estado {@code pendiente};
 * la compilacion/evaluacion llega con la infraestructura de ejecucion.</p>
 */
@Service
public class RetoService {

    private final RetoRepository retoRepository;
    private final CasoPruebaRepository casoPruebaRepository;
    private final EnvioRetoRepository envioRetoRepository;
    private final LenguajeRepository lenguajeRepository;
    private final PerfilRepository perfilRepository;
    private final RlsExecutor rlsExecutor;

    public RetoService(RetoRepository retoRepository,
                       CasoPruebaRepository casoPruebaRepository,
                       EnvioRetoRepository envioRetoRepository,
                       LenguajeRepository lenguajeRepository,
                       PerfilRepository perfilRepository,
                       RlsExecutor rlsExecutor) {
        this.retoRepository = retoRepository;
        this.casoPruebaRepository = casoPruebaRepository;
        this.envioRetoRepository = envioRetoRepository;
        this.lenguajeRepository = lenguajeRepository;
        this.perfilRepository = perfilRepository;
        this.rlsExecutor = rlsExecutor;
    }

    /** Lista retos publicados paginados; opcional por curso. */
    @Transactional
    public Page<RetoResumenResponse> listar(UUID actorId, String cursoSlug, Pageable pageable) {
        return rlsExecutor.executeAs(actorId,
                () -> retoRepository.findByPublishedTrue(pageable).map(RetoResumenResponse::from));
    }

    /** Detalle de un reto publicado. Nunca expone casos ocultos. */
    @Transactional
    public RetoDetalleResponse detalle(UUID actorId, UUID retoId) {
        return rlsExecutor.executeAs(actorId, () -> {
            Reto reto = retoPublicado(retoId);
            List<RetoDetalleResponse.CasoPublicoResponse> visibles =
                    casoPruebaRepository.findPublicosDeReto(retoId).stream()
                            .map(RetoDetalleResponse.CasoPublicoResponse::from)
                            .toList();
            return new RetoDetalleResponse(
                    reto.getId(),
                    reto.getTitulo(),
                    reto.getDescripcion(),
                    reto.getEnunciado(),
                    reto.getDificultad(),
                    reto.getXpOtorgado(),
                    reto.getTiempoLimiteSeg(),
                    reto.getMemoriaLimiteMb(),
                    reto.getIntentosMaximos(),
                    visibles,
                    reto.getCreadoEn());
        });
    }

    /** Lenguajes activos disponibles. */
    @Transactional
    public List<Lenguaje> lenguajes(UUID actorId) {
        return rlsExecutor.executeAs(actorId, lenguajeRepository::findActivos);
    }

    /**
     * Envia una solucion. Queda registrada como pendiente; no se ejecuta
     * codigo del estudiante dentro de este proceso.
     */
    @Transactional
    public EnvioRetoResponse enviar(UUID estudianteId, UUID retoId, EnvioCrearRequest request) {
        return rlsExecutor.executeAs(estudianteId, () -> {
            Reto reto = retoPublicado(retoId);

            if (request.claveIdempotencia() != null && !request.claveIdempotencia().isBlank()) {
                EnvioReto existente = envioRetoRepository.findByClaveIdempotencia(request.claveIdempotencia())
                        .orElse(null);
                if (existente != null) {
                    return EnvioRetoResponse.from(existente);
                }
            }

            long usados = envioRetoRepository.countDeEstudianteEnReto(retoId, estudianteId);
            if (reto.getIntentosMaximos() != null && reto.getIntentosMaximos() > 0
                    && usados >= reto.getIntentosMaximos()) {
                throw new BadRequestException(
                        "Has agotado los " + reto.getIntentosMaximos() + " intentos de este reto.");
            }

            Lenguaje lenguaje = lenguajeRepository.findById(request.lenguajeId())
                    .filter(Lenguaje::getActivo)
                    .orElseThrow(() -> new BadRequestException("Lenguaje no soportado o inactivo."));

            Perfil estudiante = perfilRepository.findById(estudianteId)
                    .orElseThrow(() -> new ResourceNotFoundException("Perfil no encontrado."));

            EnvioReto envio = new EnvioReto();
            envio.setRetoId(reto);
            envio.setEstudianteId(estudiante);
            envio.setLenguajeId(lenguaje);
            envio.setCodigo(request.codigo());
            envio.setEstado(EstadoEnvio.pendiente);
            envio.setClaveIdempotencia(
                    request.claveIdempotencia() != null && !request.claveIdempotencia().isBlank()
                            ? request.claveIdempotencia().trim() : null);
            return EnvioRetoResponse.from(envioRetoRepository.save(envio));
        });
    }

    /** Envios del estudiante en un reto (ordenados mas reciente primero). */
    @Transactional
    public List<EnvioRetoResponse> misEnvios(UUID estudianteId, UUID retoId) {
        return rlsExecutor.executeAs(estudianteId, () -> {
            retoPublicado(retoId);
            return envioRetoRepository.findDeEstudianteEnReto(retoId, estudianteId).stream()
                    .map(EnvioRetoResponse::from)
                    .toList();
        });
    }

    /** Intentos restantes (o -1 si ilimitado). */
    @Transactional
    public int intentosRestantes(UUID estudianteId, UUID retoId) {
        return rlsExecutor.executeAs(estudianteId, () -> {
            Reto reto = retoPublicado(retoId);
            if (reto.getIntentosMaximos() == null || reto.getIntentosMaximos() <= 0) {
                return -1;
            }
            long usados = envioRetoRepository.countDeEstudianteEnReto(retoId, estudianteId);
            return Math.max(0, reto.getIntentosMaximos() - (int) usados);
        });
    }

    private Reto retoPublicado(UUID retoId) {
        Reto reto = retoRepository.findById(retoId)
                .orElseThrow(() -> new ResourceNotFoundException("Reto no encontrado."));
        if (!Boolean.TRUE.equals(reto.getPublished())) {
            throw new ResourceNotFoundException("Reto no encontrado.");
        }
        return reto;
    }
}
