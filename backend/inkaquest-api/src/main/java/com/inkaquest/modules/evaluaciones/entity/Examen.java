package com.inkaquest.modules.evaluaciones.entity;

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
 * Entidad JPA de la tabla {@code public.examen}.
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
@Table(name = "examen")
public class Examen implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evaluacion_id", referencedColumnName = "id")
    private Evaluacion evaluacionId;

    @Column(name = "nombre", nullable = false)
    private String nombre;

    @Column(name = "fecha_apertura", nullable = true)
    private Instant fechaApertura;

    @Column(name = "fecha_cierre", nullable = true)
    private Instant fechaCierre;

    @Column(name = "intentos_maximos", nullable = false)
    private Integer intentosMaximos;

    @Column(name = "disponible", nullable = false)
    private Boolean disponible;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    @UpdateTimestamp
    @Column(name = "actualizado_en", nullable = false)
    private Instant actualizadoEn;

    /** Constructor vacoto requerido por JPA. */
    public Examen() {
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
    public Evaluacion getEvaluacionId() {
        return evaluacionId;
    }

    /** Establece la entidad relacionada. */
    public void setEvaluacionId(Evaluacion evaluacionId) {
        this.evaluacionId = evaluacionId;
    }

    /** Obtiene la columna {@code nombre}. */
    public String getNombre() {
        return nombre;
    }

    /** Establece la columna {@code nombre}. */
    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    /** Obtiene la columna {@code fecha_apertura}. */
    public Instant getFechaApertura() {
        return fechaApertura;
    }

    /** Establece la columna {@code fecha_apertura}. */
    public void setFechaApertura(Instant fechaApertura) {
        this.fechaApertura = fechaApertura;
    }

    /** Obtiene la columna {@code fecha_cierre}. */
    public Instant getFechaCierre() {
        return fechaCierre;
    }

    /** Establece la columna {@code fecha_cierre}. */
    public void setFechaCierre(Instant fechaCierre) {
        this.fechaCierre = fechaCierre;
    }

    /** Obtiene la columna {@code intentos_maximos}. */
    public Integer getIntentosMaximos() {
        return intentosMaximos;
    }

    /** Establece la columna {@code intentos_maximos}. */
    public void setIntentosMaximos(Integer intentosMaximos) {
        this.intentosMaximos = intentosMaximos;
    }

    /** Obtiene la columna {@code disponible}. */
    public Boolean getDisponible() {
        return disponible;
    }

    /** Establece la columna {@code disponible}. */
    public void setDisponible(Boolean disponible) {
        this.disponible = disponible;
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
        if (!(o instanceof Examen other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
