package com.inkaquest.modules.comercio.repository;

import com.inkaquest.modules.comercio.entity.Pedido;
import com.inkaquest.shared.enums.EstadoPedido;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositorio JPA de {@link Pedido} (tabla {@code public.pedido}).
 */
@Repository
public interface PedidoRepository extends JpaRepository<Pedido, UUID> {

    /** Pedido por numero publico (usado por el webhook). */
    Optional<Pedido> findByNumero(String numero);

    /** Idempotencia de creacion de pedidos. */
    Optional<Pedido> findByClaveIdempotencia(String claveIdempotencia);

    /** Pedidos del usuario, mas recientes primero. */
    @Query("select p from Pedido p where p.usuarioId.id = :usuarioId order by p.creadoEn desc")
    List<Pedido> findDeUsuario(UUID usuarioId);

    /** Pedidos paginados del usuario. */
    Page<Pedido> findByUsuarioId(com.inkaquest.modules.identidad.entity.Perfil usuarioId, Pageable pageable);

    /** Cantidad de pedidos PAGADOS del usuario con un cupon concreto. */
    @Query("select count(p) from Pedido p where p.usuarioId.id = :usuarioId and p.cuponId.id = :cuponId and p.estado in (:pagados)")
    long countPagadosConCupon(UUID usuarioId, UUID cuponId, java.util.Collection<EstadoPedido> pagados);

    /** Total recaudado (SUM) en moneda y estado dados. */
    @Query("select coalesce(sum(p.total), 0) from Pedido p where p.estado = :estado and p.moneda = :moneda")
    java.math.BigDecimal totalRecaudado(EstadoPedido estado, String moneda);

    /** Pedidos por estado (conteo). */
    long countByEstado(EstadoPedido estado);
}
