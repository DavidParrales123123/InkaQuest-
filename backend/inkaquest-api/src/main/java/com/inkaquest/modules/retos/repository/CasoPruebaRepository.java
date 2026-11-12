package com.inkaquest.modules.retos.repository;

import com.inkaquest.modules.retos.entity.CasoPrueba;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

/**
 * Repositorio JPA de la entidad {@link CasoPrueba} (tabla {@code public.caso_prueba}).
 */
@Repository
public interface CasoPruebaRepository extends JpaRepository<CasoPrueba, UUID> {

    /** Casos publicos de un reto (nunca ocultos), ordenados por orden. */
    @Query("select c from CasoPrueba c where c.retoId.id = :retoId and c.esOculto = false order by c.orden asc")
    List<CasoPrueba> findPublicosDeReto(UUID retoId);

    /** Casos de ejemplo de un reto (esEjemplo = true). */
    @Query("select c from CasoPrueba c where c.retoId.id = :retoId and c.esEjemplo = true order by c.orden asc")
    List<CasoPrueba> findEjemplosDeReto(UUID retoId);

    /** Total de casos de un reto. */
    @Query("select count(c) from CasoPrueba c where c.retoId.id = :retoId")
    long countDeReto(UUID retoId);
}
