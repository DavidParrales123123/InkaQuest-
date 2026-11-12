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
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;
import jakarta.persistence.GenerationType;

/**
 * Entidad JPA de la tabla {@code public.solicitud_docente}.
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
@Table(name = "solicitud_docente")
public class SolicitudDocente implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", referencedColumnName = "id")
    private Perfil usuarioId;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "estado", columnDefinition = "estado_solicitud_docente", nullable = false)
    private EstadoSolicitudDocente estado;

    @Column(name = "institucion", nullable = true)
    private String institucion;

    @Column(name = "especialidad", nullable = true)
    private String especialidad;

    @Column(name = "codigo_docente", nullable = true)
    private String codigoDocente;

    @Column(name = "motivo", nullable = false)
    private String motivo;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "documentos_adjuntos", columnDefinition = "jsonb", nullable = false)
    private Map<String, Object> documentosAdjuntos;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "revisado_por", referencedColumnName = "id")
    private Perfil revisadoPor;

    @Column(name = "revisado_en", nullable = true)
    private Instant revisadoEn;

    @Column(name = "motivo_revision", nullable = true)
    private String motivoRevision;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    @UpdateTimestamp
    @Column(name = "actualizado_en", nullable = false)
    private Instant actualizadoEn;

    /** Constructor vacoto requerido por JPA. */
    public SolicitudDocente() {
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
    public Perfil getUsuarioId() {
        return usuarioId;
    }

    /** Establece la entidad relacionada. */
    public void setUsuarioId(Perfil usuarioId) {
        this.usuarioId = usuarioId;
    }

    /** Obtiene la columna {@code estado}. */
    public EstadoSolicitudDocente getEstado() {
        return estado;
    }

    /** Establece la columna {@code estado}. */
    public void setEstado(EstadoSolicitudDocente estado) {
        this.estado = estado;
    }

    /** Obtiene la columna {@code institucion}. */
    public String getInstitucion() {
        return institucion;
    }

    /** Establece la columna {@code institucion}. */
    public void setInstitucion(String institucion) {
        this.institucion = institucion;
    }

    /** Obtiene la columna {@code especialidad}. */
    public String getEspecialidad() {
        return especialidad;
    }

    /** Establece la columna {@code especialidad}. */
    public void setEspecialidad(String especialidad) {
        this.especialidad = especialidad;
    }

    /** Obtiene la columna {@code codigo_docente}. */
    public String getCodigoDocente() {
        return codigoDocente;
    }

    /** Establece la columna {@code codigo_docente}. */
    public void setCodigoDocente(String codigoDocente) {
        this.codigoDocente = codigoDocente;
    }

    /** Obtiene la columna {@code motivo}. */
    public String getMotivo() {
        return motivo;
    }

    /** Establece la columna {@code motivo}. */
    public void setMotivo(String motivo) {
        this.motivo = motivo;
    }

    /** Obtiene la columna {@code documentos_adjuntos}. */
    public Map<String, Object> getDocumentosAdjuntos() {
        return documentosAdjuntos;
    }

    /** Establece la columna {@code documentos_adjuntos}. */
    public void setDocumentosAdjuntos(Map<String, Object> documentosAdjuntos) {
        this.documentosAdjuntos = documentosAdjuntos;
    }

    /** Obtiene la entidad relacionada. */
    public Perfil getRevisadoPor() {
        return revisadoPor;
    }

    /** Establece la entidad relacionada. */
    public void setRevisadoPor(Perfil revisadoPor) {
        this.revisadoPor = revisadoPor;
    }

    /** Obtiene la columna {@code revisado_en}. */
    public Instant getRevisadoEn() {
        return revisadoEn;
    }

    /** Establece la columna {@code revisado_en}. */
    public void setRevisadoEn(Instant revisadoEn) {
        this.revisadoEn = revisadoEn;
    }

    /** Obtiene la columna {@code motivo_revision}. */
    public String getMotivoRevision() {
        return motivoRevision;
    }

    /** Establece la columna {@code motivo_revision}. */
    public void setMotivoRevision(String motivoRevision) {
        this.motivoRevision = motivoRevision;
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
        if (!(o instanceof SolicitudDocente other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
