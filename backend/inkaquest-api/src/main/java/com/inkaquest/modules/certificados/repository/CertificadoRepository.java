package com.inkaquest.modules.certificados.repository;

import com.inkaquest.modules.certificados.entity.Certificado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositorio JPA de la entidad {@link Certificado} (tabla {@code public.certificado}).
 *
 * <p>Las consultas se ejecutan bajo las politicas RLS de PostgreSQL: el
 * contexto de autorizacion de la transaccion determina que filas son
 * visibles. Ver {@code docs/base-de-datos/MATRIZ-RLS.md}.</p>
 */
@Repository
public interface CertificadoRepository extends JpaRepository<Certificado, UUID> {

    /**
     * Consulta derivada sobre la tabla {@code public.certificado}.
     */
    Optional<Certificado> findByCodigo(String codigo);

    /**
     * Consulta derivada sobre la tabla {@code public.certificado}.
     */
    Optional<Certificado> findByEstado(String estado);
}
