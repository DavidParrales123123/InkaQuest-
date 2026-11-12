package com.inkaquest.modules.identidad.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.io.Serializable;
import java.util.Objects;

/**
 * Entidad JPA de la tabla {@code public.rol_permiso}.
 *
 * <p>Tabla puente que asigna permisos a roles. Su clave primaria es compuesta
 * ({@code rol, permiso_id}), declarada con {@link RolPermisoId}.</p>
 *
 * <p>El acceso esta protegido por RLS: solo el administrador puede escribir
 * sobre el catalogo de permisos.</p>
 */
@Entity
@IdClass(RolPermisoId.class)
@Table(name = "rol_permiso")
public class RolPermiso implements Serializable {

    @Id
    @Column(name = "rol", nullable = false)
    private String rol;

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "permiso_id", referencedColumnName = "id")
    private Permiso permisoId;

    /** Constructor vacoto requerido por JPA. */
    protected RolPermiso() {
        // Requerido por el framework de persistencia.
    }

    /** Obtiene el valor de {@code rol}. */
    public String getRol() {
        return rol;
    }

    /** Establece el valor de {@code rol}. */
    public void setRol(String rol) {
        this.rol = rol;
    }

    /** Obtiene la entidad relacionada. */
    public Permiso getPermisoId() {
        return permisoId;
    }

    /** Establece la entidad relacionada. */
    public void setPermisoId(Permiso permisoId) {
        this.permisoId = permisoId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof RolPermiso other)) {
            return false;
        }
        return Objects.equals(rol, other.rol)
                && Objects.equals(permisoId, other.permisoId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(rol, permisoId);
    }
}
