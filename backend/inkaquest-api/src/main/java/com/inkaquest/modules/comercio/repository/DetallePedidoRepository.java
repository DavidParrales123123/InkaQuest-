package com.inkaquest.modules.comercio.repository;

import com.inkaquest.modules.comercio.entity.DetallePedido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

/**
 * Repositorio JPA de {@link DetallePedido} (tabla {@code public.detalle_pedido}).
 */
@Repository
public interface DetallePedidoRepository extends JpaRepository<DetallePedido, UUID> {

    /** Lineas de un pedido. */
    @Query("select d from DetallePedido d where d.pedidoId.id = :pedidoId order by d.creadoEn asc")
    List<DetallePedido> findDePedido(UUID pedidoId);
}
