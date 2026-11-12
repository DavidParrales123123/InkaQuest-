package com.inkaquest.modules.comercio.repository;

import com.inkaquest.modules.comercio.entity.WebhookPago;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositorio JPA de {@link WebhookPago} (tabla {@code public.webhook_pago}).
 */
@Repository
public interface WebhookPagoRepository extends JpaRepository<WebhookPago, UUID> {

    /** Busca un webhook por id del evento (idempotencia). */
    Optional<WebhookPago> findByEventoId(String eventoId);
}
