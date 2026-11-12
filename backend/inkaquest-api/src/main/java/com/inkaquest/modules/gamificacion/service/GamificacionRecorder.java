package com.inkaquest.modules.gamificacion.service;

import com.inkaquest.modules.gamificacion.entity.HistorialRacha;
import com.inkaquest.modules.gamificacion.entity.Racha;
import com.inkaquest.modules.gamificacion.entity.TransaccionXp;
import com.inkaquest.modules.gamificacion.repository.HistorialRachaRepository;
import com.inkaquest.modules.gamificacion.repository.RachaRepository;
import com.inkaquest.modules.gamificacion.repository.TransaccionXpRepository;
import com.inkaquest.modules.identidad.entity.Perfil;
import com.inkaquest.shared.enums.ConceptoXp;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Registra actividad de gamificacion (XP, racha) dentro de la transaccion
 * abierta por el llamador.
 *
 * <p><b>Por que no abre su propia transaccion.</b> Lo llama
 * {@code ProgresoService.completarLeccion}, que ya ejecuta bajo
 * {@code RlsExecutor} (misma conexion, mismo contexto). Si este componente
 * abriera su propia transaccion, el registro de XP podria persistir aun
 * cuando el completar de la leccion fallara, o viceversa. Aqui todo-engajo-nada.</p>
 *
 * <p><b>Racha.</b> El contador dice: dias consecutivos con al menos una
 * actividad completada. Si hoy ya se contaba, no se duplica; si ayer si,
 * +1; si no, empieza en 1. Se guarda tambien en {@code historial_racha}.</p>
 *
 * <p>Sin bonus diario asignado: el catalogo real da XP=0 a las lecciones y
 * no hay regla de XP diario configurada; el bonus de racha esta pendiente
 * de regla de negocio (ver docs/backend/secciones-21-22.md).</p>
 */
@Component
public class GamificacionRecorder {

    private final RachaRepository rachaRepository;
    private final HistorialRachaRepository historialRachaRepository;
    private final TransaccionXpRepository transaccionXpRepository;

    public GamificacionRecorder(RachaRepository rachaRepository,
                                HistorialRachaRepository historialRachaRepository,
                                TransaccionXpRepository transaccionXpRepository) {
        this.rachaRepository = rachaRepository;
        this.historialRachaRepository = historialRachaRepository;
        this.transaccionXpRepository = transaccionXpRepository;
    }

    /**
     * Registra la actividad de HOY en la racha del usuario y, si xp > 0,
     * crea la transaccion de XP correspondiente.
     */
    public void registrarActividad(Perfil estudiante, ConceptoXp concepto,
                                   UUID referenciaId, String referenciaTipo,
                                   String descripcion, int xp) {
        LocalDate hoy = LocalDate.now();
        LocalDate ayer = hoy.minusDays(1);

        Racha racha = rachaRepository.findDeUsuario(estudiante.getId())
                .orElseGet(() -> {
                    Racha nueva = new Racha();
                    nueva.setUsuarioId(estudiante);
                    nueva.setRachaActual(0);
                    nueva.setMejorRacha(0);
                    nueva.setUltimaActividad(null);
                    return nueva;
                });

        if (!hoy.equals(racha.getUltimaActividad())) {
            boolean ayerActivo = ayer.equals(racha.getUltimaActividad());
            racha.setRachaActual(ayerActivo ? racha.getRachaActual() + 1 : 1);
            racha.setMejorRacha(Math.max(racha.getMejorRacha(), racha.getRachaActual()));
            racha.setUltimaActividad(hoy);
            racha = rachaRepository.save(racha);

            HistorialRacha historial = historialRachaRepository
                    .findDeFecha(estudiante.getId(), hoy)
                    .orElseGet(() -> {
                        HistorialRacha nueva = new HistorialRacha();
                        nueva.setUsuarioId(estudiante);
                        nueva.setFecha(hoy);
                        return nueva;
                    });
            historial.setRacha(racha.getRachaActual());
            historial.setXpOtorgado(0);
            historialRachaRepository.save(historial);
        }

        if (xp > 0) {
            TransaccionXp tx = new TransaccionXp();
            tx.setUsuarioId(estudiante);
            tx.setXp(xp);
            tx.setConcepto(concepto);
            tx.setReferenciaTipo(referenciaTipo);
            tx.setReferenciaId(referenciaId);
            tx.setDescripcion(descripcion);
            transaccionXpRepository.save(tx);
        }
    }
}
