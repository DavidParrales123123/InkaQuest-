package com.inkaquest.modules.soporte.entity;

import com.inkaquest.modules.identidad.entity.Perfil;
import com.inkaquest.shared.enums.CanalNotificacion;
import com.inkaquest.shared.enums.EstadoNotificacion;
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
 * Entidad JPA de la tabla {@code public.notificacion_destinatario}.
 *
 * <p>Mapeo derivado del esquema real de PostgreSQL (proyecto
 * {@code nrfdifzechrjikrvzhdl}). La tabla pertenece al modulo
 * {@code soporte} y esta protegida por RLS: el acceso real depende
 * del contexto de autorizacion de la transaccion.</p>
 *
 * <p>El esquema de la base de datos es propiedad de las migraciones SQL
 * ({@code supabase/migrations}). Esta entidad NO genera el esquema: la
 * propiedad {@code ddl-auto} se fija en {@code none}.</p>
 */
@Entity
@Table(name = "notificacion_destinatario")
public class NotificacionDestinatario implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "notificacion_id", referencedColumnName = "id")
    private Notificacion notificacionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", referencedColumnName = "id")
    private Perfil usuarioId;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "canal", columnDefinition = "canal_notificacion", nullable = false)
    private CanalNotificacion canal;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "estado", columnDefinition = "estado_notificacion", nullable = false)
    private EstadoNotificacion estado;

    @Column(name = "leida_en", nullable = true)
    private Instant leidaEn;

    @Column(name = "enviada_en", nullable = true)
    private Instant enviadaEn;

    @Column(name = "error", nullable = true)
    private String error;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    /** Constructor vacoto requerido por JPA. */
    public NotificacionDestinatario() {
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
    public Notificacion getNotificacionId() {
        return notificacionId;
    }

    /** Establece la entidad relacionada. */
    public void setNotificacionId(Notificacion notificacionId) {
        this.notificacionId = notificacionId;
    }

    /** Obtiene la entidad relacionada. */
    public Perfil getUsuarioId() {
        return usuarioId;
    }

    /** Establece la entidad relacionada. */
    public void setUsuarioId(Perfil usuarioId) {
        this.usuarioId = usuarioId;
    }

    /** Obtiene la columna {@code canal}. */
    public CanalNotificacion getCanal() {
        return canal;
    }

    /** Establece la columna {@code canal}. */
    public void setCanal(CanalNotificacion canal) {
        this.canal = canal;
    }

    /** Obtiene la columna {@code estado}. */
    public EstadoNotificacion getEstado() {
        return estado;
    }

    /** Establece la columna {@code estado}. */
    public void setEstado(EstadoNotificacion estado) {
        this.estado = estado;
    }

    /** Obtiene la columna {@code leida_en}. */
    public Instant getLeidaEn() {
        return leidaEn;
    }

    /** Establece la columna {@code leida_en}. */
    public void setLeidaEn(Instant leidaEn) {
        this.leidaEn = leidaEn;
    }

    /** Obtiene la columna {@code enviada_en}. */
    public Instant getEnviadaEn() {
        return enviadaEn;
    }

    /** Establece la columna {@code enviada_en}. */
    public void setEnviadaEn(Instant enviadaEn) {
        this.enviadaEn = enviadaEn;
    }

    /** Obtiene la columna {@code error}. */
    public String getError() {
        return error;
    }

    /** Establece la columna {@code error}. */
    public void setError(String error) {
        this.error = error;
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
        if (!(o instanceof NotificacionDestinatario other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
