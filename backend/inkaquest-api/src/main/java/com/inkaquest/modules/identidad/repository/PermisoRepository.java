package com.inkaquest.modules.identidad.repository;

import com.inkaquest.modules.identidad.entity.Permiso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositorio JPA de la entidad {@link Permiso} (tabla {@code public.permiso}).
 *
 * <p>Las consultas se ejecutan bajo las politicas RLS de PostgreSQL: el
 * contexto de autorizacion de la transaccion determina que filas son
 * visibles. Ver {@code docs/base-de-datos/MATRIZ-RLS.md}.</p>
 */
@Repository
public interface PermisoRepository extends JpaRepository<Permiso, UUID> {
}
