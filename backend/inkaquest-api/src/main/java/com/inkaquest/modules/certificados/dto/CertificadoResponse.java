package com.inkaquest.modules.certificados.dto;

import com.inkaquest.modules.certificados.entity.Certificado;
import com.inkaquest.modules.certificados.entity.CertificadoCurso;
import com.inkaquest.modules.certificados.entity.CertificadoTitular;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Certificado visto por su titular (o verificacion publica, con datos minimos). */
public record CertificadoResponse(
        UUID id,
        String codigo,
        String estado,
        Instant emitidoEn,
        String cursoTitulo,
        String titularNombre,
        Integer horas,
        Boolean verificado,
        String hashSha256) {

    public static CertificadoResponse from(Certificado certificado,
                                           List<CertificadoTitular> titulares,
                                           List<CertificadoCurso> cursos) {
        CertificadoTitular titular = titulares.isEmpty() ? null : titulares.get(0);
        CertificadoCurso curso = cursos.isEmpty() ? null : cursos.get(0);
        return new CertificadoResponse(
                certificado.getId(),
                certificado.getCodigo(),
                certificado.getEstado(),
                certificado.getEmitidoEn(),
                curso != null ? curso.getTituloSnapshot() : null,
                titular != null ? titular.getNombreCompleto() : null,
                curso != null ? curso.getHoras() : null,
                certificado.getVerificado(),
                certificado.getHashSha256());
    }
}
