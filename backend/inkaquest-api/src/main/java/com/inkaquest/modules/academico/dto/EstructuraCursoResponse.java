package com.inkaquest.modules.academico.dto;

import com.inkaquest.shared.enums.EstadoCurso;
import com.inkaquest.shared.enums.TipoContenido;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Arbol completo del curso (unidades -> modulos -> lecciones) para
 * secciones 13 y 14. Si el curso esta publicado, cualquier autenticado lo
 * ve con las lecciones publicadas. Si es borrador/en_revision, solo lo ve
 * el creador/docente asignado/administrador y con todo el contenido.
 */
public record EstructuraCursoResponse(
        CursoResumen curso,
        List<UnidadEstructura> unidades) {

    public record CursoResumen(
            UUID id,
            String titulo,
            String slug,
            String descripcion,
            String portadaUrl,
            EstadoCurso estado,
            Integer xpTotal,
            Integer duracionMinutos,
            Instant publicadoEn) {
    }

    public record UnidadEstructura(
            UUID id,
            Integer numero,
            String titulo,
            String descripcion,
            Integer xpOtorgado,
            Boolean publicado,
            List<ModuloEstructura> modulos) {
    }

    public record ModuloEstructura(
            UUID id,
            Integer numero,
            String titulo,
            String descripcion,
            Integer xpOtorgado,
            Boolean publicado,
            List<LeccionEstructura> lecciones) {
    }

    public record LeccionEstructura(
            UUID id,
            Integer numero,
            String titulo,
            String descripcion,
            TipoContenido tipoContenido,
            Integer duracionMinutos,
            Integer xpOtorgado,
            Boolean requeridoAprobacion,
            Boolean publicado) {
    }
}
