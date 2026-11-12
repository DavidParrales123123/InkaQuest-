package com.inkaquest.modules.auditoria.repository;

import com.inkaquest.modules.auditoria.entity.ParametroSistema;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositorio JPA de la entidad {@link ParametroSistema} (tabla {@code public.parametro_sistema}).
 *
 * <p>Las consultas se ejecutan bajo las politicas RLS de PostgreSQL: el
 * contexto de autorizacion de la transaccion determina que filas son
 * visibles. Ver {@code docs/base-de-datos/MATRIZ-RLS.md}.</p>
 */
@Repository
public interface ParametroSistemaRepository extends JpaRepository<ParametroSistema, UUID> {
}
