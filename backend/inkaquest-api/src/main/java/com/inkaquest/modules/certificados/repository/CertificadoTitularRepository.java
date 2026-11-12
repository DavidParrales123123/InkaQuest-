package com.inkaquest.modules.certificados.repository;

import com.inkaquest.modules.certificados.entity.CertificadoTitular;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

/**
 * Repositorio JPA de {@link CertificadoTitular} (tabla {@code public.certificado_titular}).
 */
@Repository
public interface CertificadoTitularRepository extends JpaRepository<CertificadoTitular, UUID> {

    /** Titulares de un certificado (principal primero). */
    @Query("select t from CertificadoTitular t where t.certificadoId.id = :certificadoId order by t.esPrincipal desc")
    List<CertificadoTitular> findDeCertificado(UUID certificadoId);

    /** Titulares ligados a un usuario (mis certificados). */
    @Query("select t from CertificadoTitular t where t.usuarioId.id = :usuarioId and t.esPrincipal = true order by t.creadoEn desc")
    List<CertificadoTitular> findDeUsuario(UUID usuarioId);
}
