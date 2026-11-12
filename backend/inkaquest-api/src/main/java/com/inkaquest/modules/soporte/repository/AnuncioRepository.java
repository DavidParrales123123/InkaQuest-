package com.inkaquest.modules.soporte.repository;

import com.inkaquest.modules.soporte.entity.Anuncio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

/**
 * Repositorio JPA de la entidad {@link Anuncio} (tabla {@code public.anuncio}).
 */
@Repository
public interface AnuncioRepository extends JpaRepository<Anuncio, UUID> {

    /** Anuncios visibles para un estudiante: los de sus cursos matriculados activos. */
    @Query("select a from Anuncio a where a.curso.id in "
         + "(select m.cursoId.id from com.inkaquest.modules.matriculas.entity.Matricula m "
         + " where m.estudianteId.id = :estudianteId and m.estado in ('activa','completada')) "
         + "order by a.fijado desc, a.creadoEn desc")
    List<Anuncio> findVisiblesPara(@Param("estudianteId") UUID estudianteId);

    /** Anuncios de un curso concreto. */
    @Query("select a from Anuncio a where a.curso.id = :cursoId order by a.fijado desc, a.creadoEn desc")
    List<Anuncio> findDeCurso(@Param("cursoId") UUID cursoId);
}
