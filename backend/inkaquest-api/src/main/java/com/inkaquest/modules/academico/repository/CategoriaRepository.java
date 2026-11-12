package com.inkaquest.modules.academico.repository;

import com.inkaquest.modules.academico.entity.Categoria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositorio JPA de la entidad {@link Categoria} (tabla {@code public.categoria}).
 *
 * <p>Las consultas se ejecutan bajo las politicas RLS de PostgreSQL: el
 * contexto de autorizacion de la transaccion determina que filas son
 * visibles. Ver {@code docs/base-de-datos/MATRIZ-RLS.md}.</p>
 */
@Repository
public interface CategoriaRepository extends JpaRepository<Categoria, UUID> {

    /**
     * Consulta derivada sobre la tabla {@code public.categoria}.
     */
    Optional<Categoria> findBySlug(String slug);
}
