package com.inkaquest.modules.auditoria.repository;

import com.inkaquest.modules.auditoria.entity.RegistroAccion;
import com.inkaquest.shared.enums.TipoAccion;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositorio JPA de {@link RegistroAccion} (tabla {@code public.registro_accion}).
 */
@Repository
public interface RegistroAccionRepository extends JpaRepository<RegistroAccion, UUID> {

    /** Busqueda paginada por tipo de entidad y accion (solo admin). */
    @Query("select r from RegistroAccion r where (:entidad is null or lower(r.entidadTipo) = lower(:entidad)) and (:accion is null or r.accion = :accion) order by r.creadoEn desc")
    Page<RegistroAccion> buscar(String entidad, TipoAccion accion, Pageable pageable);
}
