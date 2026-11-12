package com.inkaquest.modules.matriculas.entity;

import com.inkaquest.modules.identidad.entity.Perfil;
import com.inkaquest.shared.enums.EstadoMatricula;
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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;
import jakarta.persistence.GenerationType;

/**
 * Entidad JPA de la tabla {@code public.historial_matricula}.
 *
 * <p>Mapeo derivado del esquema real de PostgreSQL (proyecto
 * {@code nrfdifzechrjikrvzhdl}). La tabla pertenece al modulo
 * {@code matriculas} y esta protegida por RLS: el acceso real depende
 * del contexto de autorizacion de la transaccion.</p>
 *
 * <p>El esquema de la base de datos es propiedad de las migraciones SQL
 * ({@code supabase/migrations}). Esta entidad NO genera el esquema: la
 * propiedad {@code ddl-auto} se fija en {@code none}.</p>
 */
@Entity
@Table(name = "historial_matricula")
public class HistorialMatricula implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "matricula_id", referencedColumnName = "id")
    private Matricula matriculaId;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "estado_anterior", columnDefinition = "estado_matricula", nullable = true)
    private EstadoMatricula estadoAnterior;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "estado_nuevo", columnDefinition = "estado_matricula", nullable = false)
    private EstadoMatricula estadoNuevo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_id", referencedColumnName = "id")
    private Perfil actorId;

    @Column(name = "motivo", nullable = true)
    private String motivo;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    /** Constructor vacoto requerido por JPA. */
    public HistorialMatricula() {
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
    public Matricula getMatriculaId() {
        return matriculaId;
    }

    /** Establece la entidad relacionada. */
    public void setMatriculaId(Matricula matriculaId) {
        this.matriculaId = matriculaId;
    }

    /** Obtiene la columna {@code estado_anterior}. */
    public EstadoMatricula getEstadoAnterior() {
        return estadoAnterior;
    }

    /** Establece la columna {@code estado_anterior}. */
    public void setEstadoAnterior(EstadoMatricula estadoAnterior) {
        this.estadoAnterior = estadoAnterior;
    }

    /** Obtiene la columna {@code estado_nuevo}. */
    public EstadoMatricula getEstadoNuevo() {
        return estadoNuevo;
    }

    /** Establece la columna {@code estado_nuevo}. */
    public void setEstadoNuevo(EstadoMatricula estadoNuevo) {
        this.estadoNuevo = estadoNuevo;
    }

    /** Obtiene la entidad relacionada. */
    public Perfil getActorId() {
        return actorId;
    }

    /** Establece la entidad relacionada. */
    public void setActorId(Perfil actorId) {
        this.actorId = actorId;
    }

    /** Obtiene la columna {@code motivo}. */
    public String getMotivo() {
        return motivo;
    }

    /** Establece la columna {@code motivo}. */
    public void setMotivo(String motivo) {
        this.motivo = motivo;
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
        if (!(o instanceof HistorialMatricula other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
