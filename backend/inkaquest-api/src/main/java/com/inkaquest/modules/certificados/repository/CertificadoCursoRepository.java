package com.inkaquest.modules.certificados.repository;

import com.inkaquest.modules.certificados.entity.CertificadoCurso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositorio JPA de {@link CertificadoCurso} (tabla {@code public.certificado_curso}).
 */
@Repository
public interface CertificadoCursoRepository extends JpaRepository<CertificadoCurso, UUID> {

    /** Certificado existente de un usuario en un curso (para idempotencia). */
    @Query("select c from CertificadoCurso c where c.cursoId.id = :cursoId and c.certificadoId.id in (select t.certificadoId.id from CertificadoTitular t where t.usuarioId.id = :usuarioId and t.esPrincipal = true)")
    Optional<CertificadoCurso> findDeCursoYTitular(UUID cursoId, UUID usuarioId);

    /** Curso asociado a un certificado. */
    @Query("select c from CertificadoCurso c where c.certificadoId.id = :certificadoId")
    List<CertificadoCurso> findDeCertificado(UUID certificadoId);
}
