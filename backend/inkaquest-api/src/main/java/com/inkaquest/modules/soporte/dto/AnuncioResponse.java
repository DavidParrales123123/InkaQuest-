package com.inkaquest.modules.soporte.dto;

import com.inkaquest.modules.soporte.entity.Anuncio;
import java.time.Instant;
import java.util.UUID;

/** Anuncio visible para un curso / para el estudiante. */
public record AnuncioResponse(
        UUID id,
        UUID cursoId,
        String cursoTitulo,
        String titulo,
        String contenido,
        Boolean fijado,
        String estado,
        Instant creadoEn) {

    public static AnuncioResponse from(Anuncio a) {
        return new AnuncioResponse(
                a.getId(),
                a.getCurso() != null ? a.getCurso().getId() : null,
                a.getCurso() != null ? a.getCurso().getTitulo() : null,
                a.getTitulo(),
                a.getContenido(),
                a.getFijado(),
                a.getEstado(),
                a.getCreadoEn());
    }
}
