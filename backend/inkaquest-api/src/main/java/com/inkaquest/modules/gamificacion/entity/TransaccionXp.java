package com.inkaquest.modules.gamificacion.entity;

import com.inkaquest.modules.identidad.entity.Perfil;
import com.inkaquest.shared.enums.ConceptoXp;
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
 * Entidad JPA de la tabla {@code public.transaccion_xp}.
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
@Table(name = "transaccion_xp")
public class TransaccionXp implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", referencedColumnName = "id")
    private Perfil usuarioId;

    @Column(name = "xp", nullable = false)
    private Integer xp;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "concepto", columnDefinition = "concepto_xp", nullable = false)
    private ConceptoXp concepto;

    @Column(name = "referencia_tipo", nullable = true)
    private String referenciaTipo;

    @Column(name = "referencia_id", nullable = true)
    private UUID referenciaId;

    @Column(name = "descripcion", nullable = true)
    private String descripcion;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    /** Constructor vacoto requerido por JPA. */
    public TransaccionXp() {
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

    /** Obtiene la columna {@code xp}. */
    public Integer getXp() {
        return xp;
    }

    /** Establece la columna {@code xp}. */
    public void setXp(Integer xp) {
        this.xp = xp;
    }

    /** Obtiene la columna {@code concepto}. */
    public ConceptoXp getConcepto() {
        return concepto;
    }

    /** Establece la columna {@code concepto}. */
    public void setConcepto(ConceptoXp concepto) {
        this.concepto = concepto;
    }

    /** Obtiene la columna {@code referencia_tipo}. */
    public String getReferenciaTipo() {
        return referenciaTipo;
    }

    /** Establece la columna {@code referencia_tipo}. */
    public void setReferenciaTipo(String referenciaTipo) {
        this.referenciaTipo = referenciaTipo;
    }

    /** Obtiene la columna {@code referencia_id}. */
    public UUID getReferenciaId() {
        return referenciaId;
    }

    /** Establece la columna {@code referencia_id}. */
    public void setReferenciaId(UUID referenciaId) {
        this.referenciaId = referenciaId;
    }

    /** Obtiene la columna {@code descripcion}. */
    public String getDescripcion() {
        return descripcion;
    }

    /** Establece la columna {@code descripcion}. */
    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
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
        if (!(o instanceof TransaccionXp other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
