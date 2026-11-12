package com.inkaquest.modules.identidad.entity;

import com.inkaquest.shared.enums.EstadoSolicitudDocente;
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
 * Entidad JPA de la tabla {@code public.aprobacion_docente}.
 *
 * <p>Mapeo derivado del esquema real de PostgreSQL (proyecto
 * {@code nrfdifzechrjikrvzhdl}). La tabla pertenece al modulo
 * {@code identidad} y esta protegida por RLS: el acceso real depende
 * del contexto de autorizacion de la transaccion.</p>
 *
 * <p>El esquema de la base de datos es propiedad de las migraciones SQL
 * ({@code supabase/migrations}). Esta entidad NO genera el esquema: la
 * propiedad {@code ddl-auto} se fija en {@code none}.</p>
 */
@Entity
@Table(name = "aprobacion_docente")
public class AprobacionDocente implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "solicitud_id", referencedColumnName = "id")
    private SolicitudDocente solicitudId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", referencedColumnName = "id")
    private Perfil usuarioId;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "decision", columnDefinition = "estado_solicitud_docente", nullable = false)
    private EstadoSolicitudDocente decision;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "decidido_por", referencedColumnName = "id")
    private Perfil decididoPor;

    @Column(name = "motivo", nullable = true)
    private String motivo;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    /** Constructor vacoto requerido por JPA. */
    public AprobacionDocente() {
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
    public SolicitudDocente getSolicitudId() {
        return solicitudId;
    }

    /** Establece la entidad relacionada. */
    public void setSolicitudId(SolicitudDocente solicitudId) {
        this.solicitudId = solicitudId;
    }

    /** Obtiene la entidad relacionada. */
    public Perfil getUsuarioId() {
        return usuarioId;
    }

    /** Establece la entidad relacionada. */
    public void setUsuarioId(Perfil usuarioId) {
        this.usuarioId = usuarioId;
    }

    /** Obtiene la columna {@code decision}. */
    public EstadoSolicitudDocente getDecision() {
        return decision;
    }

    /** Establece la columna {@code decision}. */
    public void setDecision(EstadoSolicitudDocente decision) {
        this.decision = decision;
    }

    /** Obtiene la entidad relacionada. */
    public Perfil getDecididoPor() {
        return decididoPor;
    }

    /** Establece la entidad relacionada. */
    public void setDecididoPor(Perfil decididoPor) {
        this.decididoPor = decididoPor;
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
        if (!(o instanceof AprobacionDocente other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
