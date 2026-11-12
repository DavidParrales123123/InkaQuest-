package com.inkaquest.modules.gamificacion.repository;

import com.inkaquest.modules.gamificacion.entity.Inventario;
import com.inkaquest.modules.identidad.entity.Perfil;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositorio JPA de la entidad {@link Inventario} (tabla {@code public.inventario}).
 *
 * <p>Las consultas se ejecutan bajo las politicas RLS de PostgreSQL: el
 * contexto de autorizacion de la transaccion determina que filas son
 * visibles. Ver {@code docs/base-de-datos/MATRIZ-RLS.md}.</p>
 */
@Repository
public interface InventarioRepository extends JpaRepository<Inventario, UUID> {

    /**
     * Consulta derivada sobre la tabla {@code public.inventario}.
     */
    Optional<Inventario> findByUsuarioId(Perfil usuarioId);
}
