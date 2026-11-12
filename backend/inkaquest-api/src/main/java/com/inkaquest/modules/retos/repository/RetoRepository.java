package com.inkaquest.modules.retos.repository;

import com.inkaquest.modules.retos.entity.Reto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

/**
 * Repositorio JPA de la entidad {@link Reto} (tabla {@code public.reto}).
 */
@Repository
public interface RetoRepository extends JpaRepository<Reto, UUID> {

    /** Retos publicados paginados. */
    Page<Reto> findByPublishedTrue(Pageable pageable);

    /** Retos publicados de un curso. */
    @Query("select r from Reto r where r.published = true and r.cursoId.id = :cursoId order by r.creadoEn desc")
    List<Reto> findPublicadosDeCurso(UUID cursoId);
}
