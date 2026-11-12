package com.inkaquest.modules.auditoria.entity;

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
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;
import jakarta.persistence.GenerationType;

/**
 * Entidad JPA de la tabla {@code public.historial_modificacion}.
 *
 * <p>Mapeo derivado del esquema real de PostgreSQL (proyecto
 * {@code nrfdifzechrjikrvzhdl}). La tabla pertenece al modulo
 * {@code auditoria} y esta protegida por RLS: el acceso real depende
 * del contexto de autorizacion de la transaccion.</p>
 *
 * <p>El esquema de la base de datos es propiedad de las migraciones SQL
 * ({@code supabase/migrations}). Esta entidad NO genera el esquema: la
 * propiedad {@code ddl-auto} se fija en {@code none}.</p>
 */
@Entity
@Table(name = "historial_modificacion")
public class HistorialModificacion implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @Column(name = "entidad_tipo", nullable = false)
    private String entidadTipo;

    @Column(name = "entidad_id", nullable = false)
    private UUID entidadId;

    @Column(name = "campo", nullable = false)
    private String campo;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "valor_anterior", columnDefinition = "jsonb", nullable = true)
    private Map<String, Object> valorAnterior;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "valor_nuevo", columnDefinition = "jsonb", nullable = true)
    private Map<String, Object> valorNuevo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_id", referencedColumnName = "id")
    private Perfil actorId;

    @Column(name = "origen", nullable = false)
    private String origen;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    /** Constructor vacoto requerido por JPA. */
    public HistorialModificacion() {
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

    /** Obtiene la columna {@code entidad_tipo}. */
    public String getEntidadTipo() {
        return entidadTipo;
    }

    /** Establece la columna {@code entidad_tipo}. */
    public void setEntidadTipo(String entidadTipo) {
        this.entidadTipo = entidadTipo;
    }

    /** Obtiene la columna {@code entidad_id}. */
    public UUID getEntidadId() {
        return entidadId;
    }

    /** Establece la columna {@code entidad_id}. */
    public void setEntidadId(UUID entidadId) {
        this.entidadId = entidadId;
    }

    /** Obtiene la columna {@code campo}. */
    public String getCampo() {
        return campo;
    }

    /** Establece la columna {@code campo}. */
    public void setCampo(String campo) {
        this.campo = campo;
    }

    /** Obtiene la columna {@code valor_anterior}. */
    public Map<String, Object> getValorAnterior() {
        return valorAnterior;
    }

    /** Establece la columna {@code valor_anterior}. */
    public void setValorAnterior(Map<String, Object> valorAnterior) {
        this.valorAnterior = valorAnterior;
    }

    /** Obtiene la columna {@code valor_nuevo}. */
    public Map<String, Object> getValorNuevo() {
        return valorNuevo;
    }

    /** Establece la columna {@code valor_nuevo}. */
    public void setValorNuevo(Map<String, Object> valorNuevo) {
        this.valorNuevo = valorNuevo;
    }

    /** Obtiene la entidad relacionada. */
    public Perfil getActorId() {
        return actorId;
    }

    /** Establece la entidad relacionada. */
    public void setActorId(Perfil actorId) {
        this.actorId = actorId;
    }

    /** Obtiene la columna {@code origen}. */
    public String getOrigen() {
        return origen;
    }

    /** Establece la columna {@code origen}. */
    public void setOrigen(String origen) {
        this.origen = origen;
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
        if (!(o instanceof HistorialModificacion other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
