package com.inkaquest.modules.retos.dto;

import com.inkaquest.modules.retos.entity.Reto;
import com.inkaquest.shared.enums.NivelDificultad;

import java.time.Instant;
import java.util.UUID;

/** Resumen de un reto publicado (listados). */
public record RetoResumenResponse(
        UUID id,
        String titulo,
        NivelDificultad dificultad,
        Integer xpOtorgado,
        Integer tiempoLimiteSeg,
        Integer intentosMaximos,
        Instant creadoEn) {

    public static RetoResumenResponse from(Reto r) {
        return new RetoResumenResponse(
                r.getId(), r.getTitulo(), r.getDificultad(), r.getXpOtorgado(),
                r.getTiempoLimiteSeg(), r.getIntentosMaximos(), r.getCreadoEn());
    }
}
