package com.inkaquest.modules.retos.repository;

import com.inkaquest.modules.retos.entity.Lenguaje;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

/**
 * Repositorio JPA de la entidad {@link Lenguaje} (tabla {@code public.lenguaje}).
 */
@Repository
public interface LenguajeRepository extends JpaRepository<Lenguaje, UUID> {

    /** Lenguajes activos disponibles para resolver retos. */
    @Query("select l from Lenguaje l where l.activo = true order by l.nombre asc")
    List<Lenguaje> findActivos();
}
