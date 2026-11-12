package com.inkaquest.modules.academico.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import jakarta.persistence.GenerationType;

/**
 * Entidad JPA de la tabla {@code public.categoria}.
 *
 * <p>Mapeo derivado del esquema real de PostgreSQL (proyecto
 * {@code nrfdifzechrjikrvzhdl}). La tabla pertenece al modulo
 * {@code academico} y esta protegida por RLS: el acceso real depende
 * del contexto de autorizacion de la transaccion.</p>
 *
 * <p>El esquema de la base de datos es propiedad de las migraciones SQL
 * ({@code supabase/migrations}). Esta entidad NO genera el esquema: la
 * propiedad {@code ddl-auto} se fija en {@code none}.</p>
 */
@Entity
@Table(name = "categoria")
public class Categoria implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @Column(name = "nombre", nullable = false)
    private String nombre;

    @Column(name = "slug", nullable = false)
    private String slug;

    @Column(name = "descripcion", nullable = true)
    private String descripcion;

    @Column(name = "icono", nullable = true)
    private String icono;

    @Column(name = "orden", nullable = false)
    private Integer orden;

    @Column(name = "activo", nullable = false)
    private Boolean activo;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    @UpdateTimestamp
    @Column(name = "actualizado_en", nullable = false)
    private Instant actualizadoEn;

    /** Constructor vacoto requerido por JPA. */
    public Categoria() {
        // Requerido por el framework de persistencia.
    }

    /** Obtiene la columna {@code id}. */
    public UUID getId() {
        return id;
    }

    /** Establece la columna {@code id}. */
    public void setId(UUID id) {
        this.id = id;
    }

    /** Obtiene la columna {@code nombre}. */
    public String getNombre() {
        return nombre;
    }

    /** Establece la columna {@code nombre}. */
    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    /** Obtiene la columna {@code slug}. */
    public String getSlug() {
        return slug;
    }

    /** Establece la columna {@code slug}. */
    public void setSlug(String slug) {
        this.slug = slug;
    }

    /** Obtiene la columna {@code descripcion}. */
    public String getDescripcion() {
        return descripcion;
    }

    /** Establece la columna {@code descripcion}. */
    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    /** Obtiene la columna {@code icono}. */
    public String getIcono() {
        return icono;
    }

    /** Establece la columna {@code icono}. */
    public void setIcono(String icono) {
        this.icono = icono;
    }

    /** Obtiene la columna {@code orden}. */
    public Integer getOrden() {
        return orden;
    }

    /** Establece la columna {@code orden}. */
    public void setOrden(Integer orden) {
        this.orden = orden;
    }

    /** Obtiene la columna {@code activo}. */
    public Boolean getActivo() {
        return activo;
    }

    /** Establece la columna {@code activo}. */
    public void setActivo(Boolean activo) {
        this.activo = activo;
    }

    /** Obtiene la columna {@code creado_en}. */
    public Instant getCreadoEn() {
        return creadoEn;
    }

    /** Establece la columna {@code creado_en}. */
    public void setCreadoEn(Instant creadoEn) {
        this.creadoEn = creadoEn;
    }

    /** Obtiene la columna {@code actualizado_en}. */
    public Instant getActualizadoEn() {
        return actualizadoEn;
    }

    /** Establece la columna {@code actualizado_en}. */
    public void setActualizadoEn(Instant actualizadoEn) {
        this.actualizadoEn = actualizadoEn;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof Categoria other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
