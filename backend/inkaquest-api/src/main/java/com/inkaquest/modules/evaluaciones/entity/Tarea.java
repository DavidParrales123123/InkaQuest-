package com.inkaquest.modules.evaluaciones.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import jakarta.persistence.GenerationType;

/**
 * Entidad JPA de la tabla {@code public.tarea}.
 *
 * <p>Mapeo derivado del esquema real de PostgreSQL (proyecto
 * {@code nrfdifzechrjikrvzhdl}). La tabla pertenece al modulo
 * {@code evaluaciones} y esta protegida por RLS: el acceso real depende
 * del contexto de autorizacion de la transaccion.</p>
 *
 * <p>El esquema de la base de datos es propiedad de las migraciones SQL
 * ({@code supabase/migrations}). Esta entidad NO genera el esquema: la
 * propiedad {@code ddl-auto} se fija en {@code none}.</p>
 */
@Entity
@Table(name = "tarea")
public class Tarea implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actividad_id", referencedColumnName = "id")
    private Actividad actividadId;

    @Column(name = "fecha_entrega", nullable = true)
    private Instant fechaEntrega;

    @Column(name = "fecha_apertura", nullable = true)
    private Instant fechaApertura;

    @Column(name = "permite_entrega_tardia", nullable = false)
    private Boolean permiteEntregaTardia;

    @Column(name = "penalizacion_tardia", precision = 5, scale = 2, nullable = false)
    private BigDecimal penalizacionTardia;

    @Column(name = "nota_maxima", precision = 8, scale = 2, nullable = false)
    private BigDecimal notaMaxima;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    @UpdateTimestamp
    @Column(name = "actualizado_en", nullable = false)
    private Instant actualizadoEn;

    /** Constructor vacoto requerido por JPA. */
    public Tarea() {
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

    /** Obtiene la entidad relacionada. */
    public Actividad getActividadId() {
        return actividadId;
    }

    /** Establece la entidad relacionada. */
    public void setActividadId(Actividad actividadId) {
        this.actividadId = actividadId;
    }

    /** Obtiene la columna {@code fecha_entrega}. */
    public Instant getFechaEntrega() {
        return fechaEntrega;
    }

    /** Establece la columna {@code fecha_entrega}. */
    public void setFechaEntrega(Instant fechaEntrega) {
        this.fechaEntrega = fechaEntrega;
    }

    /** Obtiene la columna {@code fecha_apertura}. */
    public Instant getFechaApertura() {
        return fechaApertura;
    }

    /** Establece la columna {@code fecha_apertura}. */
    public void setFechaApertura(Instant fechaApertura) {
        this.fechaApertura = fechaApertura;
    }

    /** Obtiene la columna {@code permite_entrega_tardia}. */
    public Boolean getPermiteEntregaTardia() {
        return permiteEntregaTardia;
    }

    /** Establece la columna {@code permite_entrega_tardia}. */
    public void setPermiteEntregaTardia(Boolean permiteEntregaTardia) {
        this.permiteEntregaTardia = permiteEntregaTardia;
    }

    /** Obtiene la columna {@code penalizacion_tardia}. */
    public BigDecimal getPenalizacionTardia() {
        return penalizacionTardia;
    }

    /** Establece la columna {@code penalizacion_tardia}. */
    public void setPenalizacionTardia(BigDecimal penalizacionTardia) {
        this.penalizacionTardia = penalizacionTardia;
    }

    /** Obtiene la columna {@code nota_maxima}. */
    public BigDecimal getNotaMaxima() {
        return notaMaxima;
    }

    /** Establece la columna {@code nota_maxima}. */
    public void setNotaMaxima(BigDecimal notaMaxima) {
        this.notaMaxima = notaMaxima;
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
        if (!(o instanceof Tarea other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
