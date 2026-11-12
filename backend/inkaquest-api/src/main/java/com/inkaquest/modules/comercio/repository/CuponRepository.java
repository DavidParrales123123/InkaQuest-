package com.inkaquest.modules.comercio.repository;

import com.inkaquest.modules.comercio.entity.Cupon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositorio JPA de {@link Cupon} (tabla {@code public.cupon}).
 */
@Repository
public interface CuponRepository extends JpaRepository<Cupon, UUID> {

    /** Cupon por codigo (unico). */
    Optional<Cupon> findByCodigo(String codigo);

    /** Incremento atomico de usos con guarda de capacidad. Devuelve filas afectadas (0 => agotado). */
    @org.springframework.data.jpa.repository.Modifying
    @Query("update Cupon c set c.usosActuales = c.usosActuales + 1, c.actualizadoEn = CURRENT_TIMESTAMP where c.id = :id and c.usosActuales < c.usosMaximos")
    int incrementarUso(@org.springframework.data.repository.query.Param("id") UUID id);
}
