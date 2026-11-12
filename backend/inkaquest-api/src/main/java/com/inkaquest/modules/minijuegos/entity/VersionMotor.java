package com.inkaquest.modules.minijuegos.entity;

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
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;
import jakarta.persistence.GenerationType;

/**
 * Entidad JPA de la tabla {@code public.version_motor}.
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
@Table(name = "version_motor")
public class VersionMotor implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "motor_id", referencedColumnName = "id")
    private Motor motorId;

    @Column(name = "version", nullable = false)
    private String version;

    @Column(name = "notas", nullable = true)
    private String notas;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "compatibilidad", columnDefinition = "jsonb", nullable = false)
    private Map<String, Object> compatibilidad;

    @Column(name = "publicada_en", nullable = true)
    private Instant publicadaEn;

    @Column(name = "activa", nullable = false)
    private Boolean activa;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    /** Constructor vacoto requerido por JPA. */
    public VersionMotor() {
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

    /** Obtiene la columna {@code version}. */
    public String getVersion() {
        return version;
    }

    /** Establece la columna {@code version}. */
    public void setVersion(String version) {
        this.version = version;
    }

    /** Obtiene la columna {@code notas}. */
    public String getNotas() {
        return notas;
    }

    /** Establece la columna {@code notas}. */
    public void setNotas(String notas) {
        this.notas = notas;
    }

    /** Obtiene la columna {@code compatibilidad}. */
    public Map<String, Object> getCompatibilidad() {
        return compatibilidad;
    }

    /** Establece la columna {@code compatibilidad}. */
    public void setCompatibilidad(Map<String, Object> compatibilidad) {
        this.compatibilidad = compatibilidad;
    }

    /** Obtiene la columna {@code publicada_en}. */
    public Instant getPublicadaEn() {
        return publicadaEn;
    }

    /** Establece la columna {@code publicada_en}. */
    public void setPublicadaEn(Instant publicadaEn) {
        this.publicadaEn = publicadaEn;
    }

    /** Obtiene la columna {@code activa}. */
    public Boolean getActiva() {
        return activa;
    }

    /** Establece la columna {@code activa}. */
    public void setActiva(Boolean activa) {
        this.activa = activa;
    }

    /** Obtiene la columna {@code creado_en}. */
    public Instant getCreadoEn() {
        return creadoEn;
    }

    /** Establece la columna {@code creado_en}. */
    public void setCreadoEn(Instant creadoEn) {
        this.creadoEn = creadoEn;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof VersionMotor other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
