package com.inkaquest.modules.gamificacion.dto;

import java.util.List;
import java.util.UUID;

/** Resultado del ranking de la temporada activa: temporada, top y mi posicion. */
public record RankingTemporadaResponse(
        TemporadaResponse temporada,
        List<RankingEntryResponse> top,
        RankingEntryResponse miPosicion) {

    public static RankingTemporadaResponse of(TemporadaResponse temporada,
                                              List<RankingEntryResponse> top,
                                              RankingEntryResponse mi) {
        return new RankingTemporadaResponse(temporada, top, mi);
    }
}
