package com.inkaquest.modules.comercio.entity;

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
 * Entidad JPA de la tabla {@code public.evento_plataforma}.
 *
 * <p>Mapeo derivado del esquema real de PostgreSQL (proyecto
 * {@code nrfdifzechrjikrvzhdl}). La tabla pertenece al modulo
 * {@code comercio} y esta protegida por RLS: el acceso real depende
 * del contexto de autorizacion de la transaccion.</p>
 *
 * <p>El esquema de la base de datos es propiedad de las migraciones SQL
 * ({@code supabase/migrations}). Esta entidad NO genera el esquema: la
 * propiedad {@code ddl-auto} se fija en {@code none}.</p>
 */
@Entity
@Table(name = "evento_plataforma")
public class EventoPlataforma implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @Column(name = "tipo", nullable = false)
    private String tipo;

    @Column(name = "entidad", nullable = true)
    private String entidad;

    @Column(name = "entidad_id", nullable = true)
    private UUID entidadId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_id", referencedColumnName = "id")
    private Perfil actorId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "datos", columnDefinition = "jsonb", nullable = false)
    private Map<String, Object> datos;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    /** Constructor vacoto requerido por JPA. */
    public EventoPlataforma() {
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

    /** Obtiene la columna {@code tipo}. */
    public String getTipo() {
        return tipo;
    }

    /** Establece la columna {@code tipo}. */
    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    /** Obtiene la columna {@code entidad}. */
    public String getEntidad() {
        return entidad;
    }

    /** Establece la columna {@code entidad}. */
    public void setEntidad(String entidad) {
        this.entidad = entidad;
    }

    /** Obtiene la columna {@code entidad_id}. */
    public UUID getEntidadId() {
        return entidadId;
    }

    /** Establece la columna {@code entidad_id}. */
    public void setEntidadId(UUID entidadId) {
        this.entidadId = entidadId;
    }

    /** Obtiene la entidad relacionada. */
    public Perfil getActorId() {
        return actorId;
    }

    /** Establece la entidad relacionada. */
    public void setActorId(Perfil actorId) {
        this.actorId = actorId;
    }

    /** Obtiene la columna {@code datos}. */
    public Map<String, Object> getDatos() {
        return datos;
    }

    /** Establece la columna {@code datos}. */
    public void setDatos(Map<String, Object> datos) {
        this.datos = datos;
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
        if (!(o instanceof EventoPlataforma other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
