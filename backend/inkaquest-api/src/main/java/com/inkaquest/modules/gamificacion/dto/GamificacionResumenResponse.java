package com.inkaquest.modules.gamificacion.dto;

/** Resumen del estado gamificado del estudiante. */
public record GamificacionResumenResponse(
        Integer xp,
        Integer nivel,
        Integer rachaActual,
        Integer mejorRacha,
        Integer saldoMonedas,
        Integer insigniasObtenidas,
        Integer misionesEnCurso,
        Integer misionesCompletadas,
        /** Ultima actividad registrada en la racha (o null si nunca). */
        java.time.LocalDate ultimaActividadRacha) {
}
