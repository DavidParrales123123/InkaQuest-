package com.inkaquest.modules.comercio.repository;

import com.inkaquest.modules.comercio.entity.Carrito;
import com.inkaquest.modules.identidad.entity.Perfil;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositorio JPA de la entidad {@link Carrito} (tabla {@code public.carrito}).
 *
 * <p>Las consultas se ejecutan bajo las politicas RLS de PostgreSQL: el
 * contexto de autorizacion de la transaccion determina que filas son
 * visibles. Ver {@code docs/base-de-datos/MATRIZ-RLS.md}.</p>
 */
@Repository
public interface CarritoRepository extends JpaRepository<Carrito, UUID> {

    /**
     * Consulta derivada sobre la tabla {@code public.carrito}.
     */
    Optional<Carrito> findByUsuarioIdAndEstado(Perfil usuarioId, String estado);

    /**
     * Consulta derivada sobre la tabla {@code public.carrito}.
     */
    Optional<Carrito> findByUsuarioId(Perfil usuarioId);
}
