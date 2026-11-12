package com.inkaquest.modules.identidad.repository;

import com.inkaquest.modules.identidad.entity.RolPermiso;
import com.inkaquest.modules.identidad.entity.RolPermisoId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repositorio JPA de la entidad {@link RolPermiso} (tabla {@code public.rol_permiso}).
 *
 * <p>La clave primaria es compuesta ({@code rol, permiso_id}), por lo que el
 * repositorio usa {@link RolPermisoId} en lugar de un UUID.</p>
 *
 * <p>El acceso esta protegido por RLS: el catalogo de permisos es de solo
 * lectura para el usuario autenticado y solo el administrador puede
 * modificarlo.</p>
 */
@Repository
public interface RolPermisoRepository extends JpaRepository<RolPermiso, RolPermisoId> {

    /**
     * Lista las asignaciones de un permiso concreto.
     *
     * @param permisoId identificador del permiso
     * @return asignaciones del permiso
     */
    List<RolPermiso> findByPermisoIdId(java.util.UUID permisoId);

    /**
     * Lista las asignaciones de un rol concreto.
     *
     * @param rol nombre del rol
     * @return asignaciones del rol
     */
    List<RolPermiso> findByRol(String rol);
}
