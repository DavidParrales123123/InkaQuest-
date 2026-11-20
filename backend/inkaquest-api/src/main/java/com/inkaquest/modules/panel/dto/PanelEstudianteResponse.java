package com.inkaquest.modules.panel.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.inkaquest.shared.enums.EstadoCurso;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Vista agregada del panel del estudiante. */
public record PanelEstudianteResponse(
        List<CursoPanel> cursos,
        List<MatriculaPanel> matriculas,
        List<ProgresoPanel> progresos,
        Integer xp,
        Integer racha,
        Long noLeidas) {

    public record CursoPanel(
            UUID id,
            @JsonProperty("categoria_id") UUID categoriaId,
            String titulo,
            String slug,
            String descripcion,
            String contenido,
            @JsonProperty("portada_url") String portadaUrl,
            EstadoCurso estado,
            BigDecimal precio,
            String moneda,
            @JsonProperty("xp_total") Integer xpTotal,
            @JsonProperty("duracion_minutos") Integer duracionMinutos,
            @JsonProperty("creado_por") UUID creadoPor,
            @JsonProperty("publicado_en") Instant publicadoEn,
            @JsonProperty("creado_en") Instant creadoEn,
            @JsonProperty("actualizado_en") Instant actualizadoEn) {
    }

    public record MatriculaPanel(
            UUID id,
            @JsonProperty("estudiante_id") UUID estudianteId,
            @JsonProperty("curso_id") UUID cursoId,
            String estado,
            @JsonProperty("precio_pagado") BigDecimal precioPagado,
            String moneda,
            @JsonProperty("porcentaje_progreso") BigDecimal porcentajeProgreso,
            @JsonProperty("xp_ganado") Integer xpGanado,
            @JsonProperty("matriculado_en") Instant matriculadoEn,
            @JsonProperty("completado_en") Instant completadoEn,
            @JsonProperty("cancelado_en") Instant canceladoEn,
            @JsonProperty("creado_en") Instant creadoEn,
            @JsonProperty("actualizado_en") Instant actualizadoEn) {
    }

    public record ProgresoPanel(
            UUID id,
            @JsonProperty("matricula_id") UUID matriculaId,
            @JsonProperty("estudiante_id") UUID estudianteId,
            @JsonProperty("curso_id") UUID cursoId,
            String estado,
            BigDecimal porcentaje,
            @JsonProperty("lecciones_completadas") Integer leccionesCompletadas,
            @JsonProperty("minutos_estudio") Integer minutosEstudio,
            @JsonProperty("iniciado_en") Instant iniciadoEn,
            @JsonProperty("completado_en") Instant completadoEn,
            @JsonProperty("ultima_actividad_en") Instant ultimaActividadEn,
            @JsonProperty("creado_en") Instant creadoEn,
            @JsonProperty("actualizado_en") Instant actualizadoEn) {
    }
}
