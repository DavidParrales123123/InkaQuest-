package com.inkaquest.modules.comercio.repository;

import com.inkaquest.modules.comercio.entity.Transaccion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositorio JPA de {@link Transaccion} (tabla {@code public.transaccion}).
 */
@Repository
public interface TransaccionRepository extends JpaRepository<Transaccion, UUID> {

    /** Transacciones del usuario, mas recientes primero. */
    @Query("select t from Transaccion t where t.usuarioId.id = :usuarioId order by t.creadoEn desc")
    List<Transaccion> findDeUsuario(UUID usuarioId);

    /** Transaccion por referencia del proveedor. */
    Optional<Transaccion> findByReferencia(String referencia);

    /** Transacciones ligadas a un pedido. */
    @Query("select t from Transaccion t where t.pedidoId.id = :pedidoId order by t.creadoEn desc")
    List<Transaccion> findDePedido(UUID pedidoId);
}
