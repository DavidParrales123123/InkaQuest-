package com.inkaquest.modules.minijuegos.entity;

import com.inkaquest.modules.academico.entity.Curso;
import com.inkaquest.modules.identidad.entity.Perfil;
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
 * Entidad JPA de la tabla {@code public.motor_curso}.
 *
 * <p>Mapeo derivado del esquema real de PostgreSQL (proyecto
 * {@code nrfdifzechrjikrvzhdl}). La tabla pertenece al modulo
 * {@code minijuegos} y esta protegida por RLS: el acceso real depende
 * del contexto de autorizacion de la transaccion.</p>
 *
 * <p>El esquema de la base de datos es propiedad de las migraciones SQL
 * ({@code supabase/migrations}). Esta entidad NO genera el esquema: la
 * propiedad {@code ddl-auto} se fija en {@code none}.</p>
 */
@Entity
@Table(name = "motor_curso")
public class MotorCurso implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "motor_id", referencedColumnName = "id")
    private Motor motorId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "curso_id", referencedColumnName = "id")
    private Curso cursoId;

    @Column(name = "es_comun", nullable = false)
    private Boolean esComun;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "version_motor_id", referencedColumnName = "id")
    private VersionMotor versionMotorId;

    @Column(name = "activo", nullable = false)
    private Boolean activo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "asignado_por", referencedColumnName = "id")
    private Perfil asignadoPor;

    @Column(name = "asignado_en", nullable = false)
    private Instant asignadoEn;

    @UpdateTimestamp
    @Column(name = "actualizado_en", nullable = false)
    private Instant actualizadoEn;

    /** Constructor vacoto requerido por JPA. */
    public MotorCurso() {
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
    public Motor getMotorId() {
        return motorId;
    }

    /** Establece la entidad relacionada. */
    public void setMotorId(Motor motorId) {
        this.motorId = motorId;
    }

    /** Obtiene la entidad relacionada. */
    public Curso getCursoId() {
        return cursoId;
    }

    /** Establece la entidad relacionada. */
    public void setCursoId(Curso cursoId) {
        this.cursoId = cursoId;
    }

    /** Obtiene la columna {@code es_comun}. */
    public Boolean getEsComun() {
        return esComun;
    }

    /** Establece la columna {@code es_comun}. */
    public void setEsComun(Boolean esComun) {
        this.esComun = esComun;
    }

    /** Obtiene la entidad relacionada. */
    public VersionMotor getVersionMotorId() {
        return versionMotorId;
    }

    /** Establece la entidad relacionada. */
    public void setVersionMotorId(VersionMotor versionMotorId) {
        this.versionMotorId = versionMotorId;
    }

    /** Obtiene la columna {@code activo}. */
    public Boolean getActivo() {
        return activo;
    }

    /** Establece la columna {@code activo}. */
    public void setActivo(Boolean activo) {
        this.activo = activo;
    }

    /** Obtiene la entidad relacionada. */
    public Perfil getAsignadoPor() {
        return asignadoPor;
    }

    /** Establece la entidad relacionada. */
    public void setAsignadoPor(Perfil asignadoPor) {
        this.asignadoPor = asignadoPor;
    }

    /** Obtiene la columna {@code asignado_en}. */
    public Instant getAsignadoEn() {
        return asignadoEn;
    }

    /** Establece la columna {@code asignado_en}. */
    public void setAsignadoEn(Instant asignadoEn) {
        this.asignadoEn = asignadoEn;
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
        if (!(o instanceof MotorCurso other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
