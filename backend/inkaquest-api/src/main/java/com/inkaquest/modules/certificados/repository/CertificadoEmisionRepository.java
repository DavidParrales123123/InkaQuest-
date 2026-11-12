package com.inkaquest.modules.certificados.repository;

import com.inkaquest.modules.certificados.entity.CertificadoEmision;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositorio JPA de {@link CertificadoEmision} (tabla {@code public.certificado_emision}).
 */
@Repository
public interface CertificadoEmisionRepository extends JpaRepository<CertificadoEmision, UUID> {

    /** Busca una emision por clave de idempotencia. */
    Optional<CertificadoEmision> findByClaveIdempotencia(String claveIdempotencia);
}
