package com.inkaquest.modules.gamificacion.entity;

import com.inkaquest.modules.identidad.entity.Perfil;
import com.inkaquest.shared.enums.EstadoMision;
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
 * Entidad JPA de la tabla {@code public.mision_usuario}.
 *
 * <p>Mapeo derivado del esquema real de PostgreSQL (proyecto
 * {@code nrfdifzechrjikrvzhdl}). La tabla pertenece al modulo
 * {@code gamificacion} y esta protegida por RLS: el acceso real depende
 * del contexto de autorizacion de la transaccion.</p>
 *
 * <p>El esquema de la base de datos es propiedad de las migraciones SQL
 * ({@code supabase/migrations}). Esta entidad NO genera el esquema: la
 * propiedad {@code ddl-auto} se fija en {@code none}.</p>
 */
@Entity
@Table(name = "mision_usuario")
public class MisionUsuario implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mision_id", referencedColumnName = "id")
    private Mision misionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", referencedColumnName = "id")
    private Perfil usuarioId;

    @Column(name = "progreso", nullable = false)
    private Integer progreso;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "estado", columnDefinition = "estado_mision", nullable = false)
    private EstadoMision estado;

    @Column(name = "recompensa_otorgada", nullable = false)
    private Boolean recompensaOtorgada;

    @Column(name = "completado_en", nullable = true)
    private Instant completadoEn;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    @UpdateTimestamp
    @Column(name = "actualizado_en", nullable = false)
    private Instant actualizadoEn;

    /** Constructor vacoto requerido por JPA. */
    public MisionUsuario() {
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
    public Mision getMisionId() {
        return misionId;
    }

    /** Establece la entidad relacionada. */
    public void setMisionId(Mision misionId) {
        this.misionId = misionId;
    }

    /** Obtiene la entidad relacionada. */
    public Perfil getUsuarioId() {
        return usuarioId;
    }

    /** Establece la entidad relacionada. */
    public void setUsuarioId(Perfil usuarioId) {
        this.usuarioId = usuarioId;
    }

    /** Obtiene la columna {@code progreso}. */
    public Integer getProgreso() {
        return progreso;
    }

    /** Establece la columna {@code progreso}. */
    public void setProgreso(Integer progreso) {
        this.progreso = progreso;
    }

    /** Obtiene la columna {@code estado}. */
    public EstadoMision getEstado() {
        return estado;
    }

    /** Establece la columna {@code estado}. */
    public void setEstado(EstadoMision estado) {
        this.estado = estado;
    }

    /** Obtiene la columna {@code recompensa_otorgada}. */
    public Boolean getRecompensaOtorgada() {
        return recompensaOtorgada;
    }

    /** Establece la columna {@code recompensa_otorgada}. */
    public void setRecompensaOtorgada(Boolean recompensaOtorgada) {
        this.recompensaOtorgada = recompensaOtorgada;
    }

    /** Obtiene la columna {@code completado_en}. */
    public Instant getCompletadoEn() {
        return completadoEn;
    }

    /** Establece la columna {@code completado_en}. */
    public void setCompletadoEn(Instant completadoEn) {
        this.completadoEn = completadoEn;
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
        if (!(o instanceof MisionUsuario other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
