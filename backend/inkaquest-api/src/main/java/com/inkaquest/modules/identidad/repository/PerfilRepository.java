package com.inkaquest.modules.identidad.repository;

import com.inkaquest.modules.identidad.entity.Perfil;
import com.inkaquest.shared.enums.RolUsuario;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositorio JPA de la entidad {@link Perfil} (tabla {@code public.perfil}).
 */
@Repository
public interface PerfilRepository extends JpaRepository<Perfil, UUID> {

    /** Busca un perfil por email. */
    Optional<Perfil> findByEmail(String email);

    /** Lista paginada por rol. */
    Page<Perfil> findByRol(RolUsuario rol, Pageable pageable);

    /** Busqueda paginada por rol + texto (nombre, apellido o email). */
    @Query("select p from Perfil p where p.rol = :rol and (lower(p.nombre) like lower(concat('%', :q, '%')) or lower(coalesce(p.apellido, '')) like lower(concat('%', :q, '%')) or lower(p.email) like lower(concat('%', :q, '%')))")
    Page<Perfil> buscarPorRol(RolUsuario rol, String q, Pageable pageable);

    /** Cantidad de perfiles por rol. */
    long countByRol(RolUsuario rol);
}
