package com.inkaquest.modules.gamificacion.service;

import com.inkaquest.modules.gamificacion.dto.*;
import com.inkaquest.modules.gamificacion.entity.*;
import com.inkaquest.modules.gamificacion.repository.*;
import com.inkaquest.modules.identidad.entity.Perfil;
import com.inkaquest.modules.identidad.repository.PerfilRepository;
import com.inkaquest.shared.enums.EstadoMision;
import com.inkaquest.shared.enums.EstadoTemporada;
import com.inkaquest.shared.exception.ResourceNotFoundException;
import com.inkaquest.shared.security.RlsExecutor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Servicio de lectura del estado gamificado del estudiante (seccion
 * gamificacion): XP, nivel, racha, insignias, misiones, ranking y
 * transacciones. Solo lectura; el registro ocurre en {@link GamificacionRecorder}.
 */
@Service
public class GamificacionService {

    private final RachaRepository rachaRepository;
    private final HistorialRachaRepository historialRachaRepository;
    private final InsigniaRepository insigniaRepository;
    private final InsigniaUsuarioRepository insigniaUsuarioRepository;
    private final MisionRepository misionRepository;
    private final MisionUsuarioRepository misionUsuarioRepository;
    private final TemporadaRepository temporadaRepository;
    private final RankingRepository rankingRepository;
    private final TransaccionXpRepository transaccionXpRepository;
    private final MonederoRepository monederoRepository;
    private final PerfilRepository perfilRepository;
    private final RlsExecutor rlsExecutor;

    public GamificacionService(RachaRepository rachaRepository,
                               HistorialRachaRepository historialRachaRepository,
                               InsigniaRepository insigniaRepository,
                               InsigniaUsuarioRepository insigniaUsuarioRepository,
                               MisionRepository misionRepository,
                               MisionUsuarioRepository misionUsuarioRepository,
                               TemporadaRepository temporadaRepository,
                               RankingRepository rankingRepository,
                               TransaccionXpRepository transaccionXpRepository,
                               MonederoRepository monederoRepository,
                               PerfilRepository perfilRepository,
                               RlsExecutor rlsExecutor) {
        this.rachaRepository = rachaRepository;
        this.historialRachaRepository = historialRachaRepository;
        this.insigniaRepository = insigniaRepository;
        this.insigniaUsuarioRepository = insigniaUsuarioRepository;
        this.misionRepository = misionRepository;
        this.misionUsuarioRepository = misionUsuarioRepository;
        this.temporadaRepository = temporadaRepository;
        this.rankingRepository = rankingRepository;
        this.transaccionXpRepository = transaccionXpRepository;
        this.monederoRepository = monederoRepository;
        this.perfilRepository = perfilRepository;
        this.rlsExecutor = rlsExecutor;
    }

    /** Resumen del estado gamificado. */
    @Transactional
    public GamificacionResumenResponse resumen(UUID estudianteId) {
        return rlsExecutor.executeAs(estudianteId, () -> {
            Perfil perfil = perfil(estudianteId);
            Racha racha = rachaRepository.findDeUsuario(estudianteId).orElse(null);
            Monedero monedero = monederoRepository.findByUsuarioId(perfil).orElse(null);
            int obtenidas = insigniaUsuarioRepository.findObtenidasDeUsuario(estudianteId).size();
            List<MisionUsuario> misMisiones = misionUsuarioRepository.findDeUsuario(estudianteId);
            long enCurso = misMisiones.stream().filter(mu -> mu.getEstado() == EstadoMision.en_progreso).count();
            long completadas = misMisiones.stream().filter(mu -> mu.getEstado() == EstadoMision.completada).count();

            return new GamificacionResumenResponse(
                    perfil.getXp(),
                    perfil.getNivel(),
                    racha != null ? racha.getRachaActual() : 0,
                    racha != null ? racha.getMejorRacha() : 0,
                    monedero != null ? monedero.getSaldo() : 0,
                    obtenidas,
                    (int) enCurso,
                    (int) completadas,
                    racha != null ? racha.getUltimaActividad() : null);
        });
    }

    /** Catalogo de insignias activas con el estado del usuario. */
    @Transactional
    public List<InsigniaCatalogoResponse> insignias(UUID estudianteId) {
        return rlsExecutor.executeAs(estudianteId, () -> {
            List<Insignia> catalogo = insigniaRepository.findActivas();
            Map<UUID, InsigniaUsuario> misias = insigniaUsuarioRepository.findDeUsuario(estudianteId)
                    .stream()
                    .collect(Collectors.toMap(i -> i.getInsigniaId().getId(), i -> i, (a, b) -> a));

            return catalogo.stream().map(insignia -> {
                InsigniaUsuario mia = misias.get(insignia.getId());
                BigDecimal progreso = mia != null ? mia.getProgreso() : BigDecimal.ZERO;
                boolean obtenida = mia != null && mia.getObtenidaEn() != null;
                return new InsigniaCatalogoResponse(
                        insignia.getId(),
                        insignia.getCodigo(),
                        insignia.getNombre(),
                        insignia.getDescripcion(),
                        insignia.getIcono(),
                        insignia.getRareza(),
                        insignia.getXpOtorgado(),
                        progreso,
                        mia != null ? mia.getObtenidaEn() : null,
                        obtenida);
            }).toList();
        });
    }

    /** Misiones activas visibles, con el progreso del usuario en cada una. */
    @Transactional
    public List<MisionResponse> misiones(UUID estudianteId) {
        return rlsExecutor.executeAs(estudianteId, () -> {
            Instant ahora = Instant.now();
            Map<UUID, MisionUsuario> misias = misionUsuarioRepository.findDeUsuario(estudianteId)
                    .stream()
                    .collect(Collectors.toMap(mu -> mu.getMisionId().getId(), mu -> mu, (a, b) -> a));

            return misionRepository.findActivas().stream()
                    .filter(m -> (m.getFechaInicio() == null || !m.getFechaInicio().isAfter(ahora))
                            && (m.getFechaFin() == null || !m.getFechaFin().isBefore(ahora)))
                    .map(m -> {
                        MisionUsuario mia = misias.get(m.getId());
                        Integer progreso = mia != null ? mia.getProgreso() : 0;
                        EstadoMision estado = mia != null ? mia.getEstado() : EstadoMision.pendiente;
                        return new MisionResponse(
                                m.getId(),
                                m.getNombre(),
                                m.getDescripcion(),
                                m.getTipo(),
                                m.getObjetivoTipo(),
                                m.getObjetivoCantidad(),
                                m.getXpRecompensa(),
                                m.getMonedasRecompensa(),
                                m.getInsigniaId() != null ? m.getInsigniaId().getId() : null,
                                m.getFechaInicio(),
                                m.getFechaFin(),
                                progreso,
                                estado,
                                mia == null);
                    }).toList();
        });
    }

    /** Temporada activa actual (or null si no hay). */
    @Transactional
    public TemporadaResponse temporadaActual(UUID actorId) {
        return rlsExecutor.executeAs(actorId, () -> temporadaRepository
                        .findFirstByEstadoOrderByFechaInicioDesc(EstadoTemporada.activa)
                        .map(this::aTemporada)
                        .orElse(null));
    }

    /** Ranking de la temporada activa: top 20 + mi puesto. */
    @Transactional
    public RankingTemporadaResponse ranking(UUID actorId) {
        return rlsExecutor.executeAs(actorId, () -> {
            Temporada temporada = temporadaRepository
                    .findFirstByEstadoOrderByFechaInicioDesc(EstadoTemporada.activa)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "No hay una temporada activa en este momento."));

            List<RankingEntryResponse> top = rankingRepository
                    .topDeTemporada(temporada.getId(), Pageable.ofSize(20))
                    .getContent().stream()
                    .map(this::aRankingEntry)
                    .toList();

            RankingEntryResponse mia = rankingRepository
                    .findDeTemporadaDeUsuario(temporada.getId(), actorId)
                    .map(this::aRankingEntry)
                    .orElse(null);

            return RankingTemporadaResponse.of(aTemporada(temporada), top, mia);
        });
    }

    /** Historial paginado de transacciones XP. */
    @Transactional
    public Page<TransaccionXpResponse> transacciones(UUID estudianteId, Pageable pageable) {
        return rlsExecutor.executeAs(estudianteId, () ->
                transaccionXpRepository.findUltimasDeUsuario(estudianteId, pageable)
                        .map(this::aTransaccion));
    }

    // ---------- Mappers ----------

    private TemporadaResponse aTemporada(Temporada t) {
        return new TemporadaResponse(t.getId(), t.getNombre(), t.getDescripcion(),
                t.getEstado(), t.getFechaInicio(), t.getFechaFin());
    }

    private RankingEntryResponse aRankingEntry(Ranking r) {
        var u = r.getUsuarioId();
        return new RankingEntryResponse(
                r.getPosicion(),
                u != null ? u.getId() : null,
                u != null ? u.getNombre() : null,
                u != null ? u.getApellido() : null,
                u != null ? u.getAvatarUrl() : null,
                r.getPuntos());
    }

    private TransaccionXpResponse aTransaccion(TransaccionXp t) {
        return new TransaccionXpResponse(t.getId(), t.getXp(), t.getConcepto(),
                t.getReferenciaTipo(), t.getReferenciaId(), t.getDescripcion(), t.getCreadoEn());
    }

    private Perfil perfil(UUID estudianteId) {
        return perfilRepository.findById(estudianteId)
                .orElseThrow(() -> new ResourceNotFoundException("Perfil no encontrado."));
    }
}
