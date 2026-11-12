package com.inkaquest.modules.gamificacion.repository;

import com.inkaquest.modules.gamificacion.entity.HistorialRacha;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositorio JPA de la entidad {@link HistorialRacha} (tabla {@code public.historial_racha}).
 */
@Repository
public interface HistorialRachaRepository extends JpaRepository<HistorialRacha, UUID> {

    /** Fila del historial de racha del usuario para una fecha concreta. */
    @Query("select h from HistorialRacha h where h.usuarioId.id = :usuarioId and h.fecha = :fecha")
    Optional<HistorialRacha> findDeFecha(UUID usuarioId, LocalDate fecha);
}
