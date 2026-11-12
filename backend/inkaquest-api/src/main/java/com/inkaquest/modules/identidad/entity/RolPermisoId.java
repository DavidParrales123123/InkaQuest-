package com.inkaquest.modules.identidad.entity;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

/**
 * Clave primaria compuesta de la entidad {@link RolPermiso}.
 *
 * <p>La tabla {@code public.rol_permiso} relaciona un rol con un permiso. Su
 * clave primaria es el par {@code (rol, permiso_id)}, por lo que se declara
 * como {@code @IdClass} en lugar de una clave {@code id} surrogate.</p>
 */
public class RolPermisoId implements Serializable {

    /** Rol al que se concede el permiso. */
    private String rol;

    /** Permiso concedido. */
    private UUID permisoId;

    /** Constructor vacoto requerido por JPA. */
    protected RolPermisoId() {
        // Requerido por el framework de persistencia.
    }

    /**
     * Constructor con los componentes de la clave.
     *
     * @param rol       rol al que se concede el permiso
     * @param permisoId identificador del permiso
     */
    public RolPermisoId(String rol, UUID permisoId) {
        this.rol = rol;
        this.permisoId = permisoId;
    }

    /** Obtiene el valor de {@code rol}. */
    public String getRol() {
        return rol;
    }

    /** Establece el valor de {@code rol}. */
    public void setRol(String rol) {
        this.rol = rol;
    }

    /** Obtiene el valor de {@code permiso_id}. */
    public UUID getPermisoId() {
        return permisoId;
    }

    /** Establece el valor de {@code permiso_id}. */
    public void setPermisoId(UUID permisoId) {
        this.permisoId = permisoId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof RolPermisoId other)) {
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
