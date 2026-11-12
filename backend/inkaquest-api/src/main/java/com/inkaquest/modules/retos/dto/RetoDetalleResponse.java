package com.inkaquest.modules.retos.dto;

import com.inkaquest.modules.retos.entity.CasoPrueba;
import com.inkaquest.modules.retos.entity.Reto;
import com.inkaquest.shared.enums.NivelDificultad;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Detalle de un reto publicado: enunciado + casos VISIBLES (nunca ocultos). */
public record RetoDetalleResponse(
        UUID id,
        String titulo,
        String descripcion,
        String enunciado,
        NivelDificultad dificultad,
        Integer xpOtorgado,
        Integer tiempoLimiteSeg,
        Integer memoriaLimiteMb,
        Integer intentosMaximos,
        List<CasoPublicoResponse> casosPublicos,
        Instant creadoEn) {

    public record CasoPublicoResponse(
            UUID id,
            Integer orden,
            String entrada,
            String salidaEsperada,
            Boolean esEjemplo,
            Integer tiempoLimiteSeg,
            BigDecimal peso) {

        public static CasoPublicoResponse from(CasoPrueba c) {
            return new CasoPublicoResponse(c.getId(), c.getOrden(), c.getEntrada(),
                    c.getSalidaEsperada(), c.getEsEjemplo(), c.getTiempoLimiteSeg(), c.getPeso());
        }
    }
}
