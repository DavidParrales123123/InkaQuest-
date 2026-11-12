package com.inkaquest.modules.comercio.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import jakarta.persistence.GenerationType;

/**
 * Entidad JPA de la tabla {@code public.promocion}.
 *
 * <p>Mapeo derivado del esquema real de PostgreSQL (proyecto
 * {@code nrfdifzechrjikrvzhdl}). La tabla pertenece al modulo
 * {@code comercio} y esta protegida por RLS: el acceso real depende
 * del contexto de autorizacion de la transaccion.</p>
 *
 * <p>El esquema de la base de datos es propiedad de las migraciones SQL
 * ({@code supabase/migrations}). Esta entidad NO genera el esquema: la
 * propiedad {@code ddl-auto} se fija en {@code none}.</p>
 */
@Entity
@Table(name = "promocion")
public class Promocion implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @Column(name = "nombre", nullable = false)
    private String nombre;

    @Column(name = "descripcion", nullable = true)
    private String descripcion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "descuento_id", referencedColumnName = "id")
    private Descuento descuentoId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cupon_id", referencedColumnName = "id")
    private Cupon cuponId;

    @Column(name = "activa", nullable = false)
    private Boolean activa;

    @Column(name = "valido_desde", nullable = true)
    private Instant validoDesde;

    @Column(name = "valido_hasta", nullable = true)
    private Instant validoHasta;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    @UpdateTimestamp
    @Column(name = "actualizado_en", nullable = false)
    private Instant actualizadoEn;

    /** Constructor vacoto requerido por JPA. */
    public Promocion() {
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

    /** Obtiene la columna {@code descripcion}. */
    public String getDescripcion() {
        return descripcion;
    }

    /** Establece la columna {@code descripcion}. */
    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    /** Obtiene la entidad relacionada. */
    public Descuento getDescuentoId() {
        return descuentoId;
    }

    /** Establece la entidad relacionada. */
    public void setDescuentoId(Descuento descuentoId) {
        this.descuentoId = descuentoId;
    }

    /** Obtiene la entidad relacionada. */
    public Cupon getCuponId() {
        return cuponId;
    }

    /** Establece la entidad relacionada. */
    public void setCuponId(Cupon cuponId) {
        this.cuponId = cuponId;
    }

    /** Obtiene la columna {@code activa}. */
    public Boolean getActiva() {
        return activa;
    }

    /** Establece la columna {@code activa}. */
    public void setActiva(Boolean activa) {
        this.activa = activa;
    }

    /** Obtiene la columna {@code valido_desde}. */
    public Instant getValidoDesde() {
        return validoDesde;
    }

    /** Establece la columna {@code valido_desde}. */
    public void setValidoDesde(Instant validoDesde) {
        this.validoDesde = validoDesde;
    }

    /** Obtiene la columna {@code valido_hasta}. */
    public Instant getValidoHasta() {
        return validoHasta;
    }

    /** Establece la columna {@code valido_hasta}. */
    public void setValidoHasta(Instant validoHasta) {
        this.validoHasta = validoHasta;
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
        if (!(o instanceof Promocion other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
