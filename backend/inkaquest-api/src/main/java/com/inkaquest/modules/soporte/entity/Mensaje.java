package com.inkaquest.modules.soporte.entity;

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
 * Entidad JPA de la tabla {@code public.mensaje}.
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
@Table(name = "mensaje")
public class Mensaje implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "emisor_id", referencedColumnName = "id")
    private Perfil emisorId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "destinatario_id", referencedColumnName = "id")
    private Perfil destinatarioId;

    @Column(name = "hilo_id", nullable = false)
    private UUID hiloId;

    @Column(name = "asunto", nullable = true)
    private String asunto;

    @Column(name = "cuerpo", nullable = false)
    private String cuerpo;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "adjuntos", columnDefinition = "jsonb", nullable = false)
    private Map<String, Object> adjuntos;

    @Column(name = "leido_en", nullable = true)
    private Instant leidoEn;

    @Column(name = "borrado_por_emisor", nullable = false)
    private Boolean borradoPorEmisor;

    @Column(name = "borrado_por_destinatario", nullable = false)
    private Boolean borradoPorDestinatario;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    @UpdateTimestamp
    @Column(name = "actualizado_en", nullable = false)
    private Instant actualizadoEn;

    /** Constructor vacoto requerido por JPA. */
    public Mensaje() {
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
    public Perfil getEmisorId() {
        return emisorId;
    }

    /** Establece la entidad relacionada. */
    public void setEmisorId(Perfil emisorId) {
        this.emisorId = emisorId;
    }

    /** Obtiene la entidad relacionada. */
    public Perfil getDestinatarioId() {
        return destinatarioId;
    }

    /** Establece la entidad relacionada. */
    public void setDestinatarioId(Perfil destinatarioId) {
        this.destinatarioId = destinatarioId;
    }

    /** Obtiene la columna {@code hilo_id}. */
    public UUID getHiloId() {
        return hiloId;
    }

    /** Establece la columna {@code hilo_id}. */
    public void setHiloId(UUID hiloId) {
        this.hiloId = hiloId;
    }

    /** Obtiene la columna {@code asunto}. */
    public String getAsunto() {
        return asunto;
    }

    /** Establece la columna {@code asunto}. */
    public void setAsunto(String asunto) {
        this.asunto = asunto;
    }

    /** Obtiene la columna {@code cuerpo}. */
    public String getCuerpo() {
        return cuerpo;
    }

    /** Establece la columna {@code cuerpo}. */
    public void setCuerpo(String cuerpo) {
        this.cuerpo = cuerpo;
    }

    /** Obtiene la columna {@code adjuntos}. */
    public Map<String, Object> getAdjuntos() {
        return adjuntos;
    }

    /** Establece la columna {@code adjuntos}. */
    public void setAdjuntos(Map<String, Object> adjuntos) {
        this.adjuntos = adjuntos;
    }

    /** Obtiene la columna {@code leido_en}. */
    public Instant getLeidoEn() {
        return leidoEn;
    }

    /** Establece la columna {@code leido_en}. */
    public void setLeidoEn(Instant leidoEn) {
        this.leidoEn = leidoEn;
    }

    /** Obtiene la columna {@code borrado_por_emisor}. */
    public Boolean getBorradoPorEmisor() {
        return borradoPorEmisor;
    }

    /** Establece la columna {@code borrado_por_emisor}. */
    public void setBorradoPorEmisor(Boolean borradoPorEmisor) {
        this.borradoPorEmisor = borradoPorEmisor;
    }

    /** Obtiene la columna {@code borrado_por_destinatario}. */
    public Boolean getBorradoPorDestinatario() {
        return borradoPorDestinatario;
    }

    /** Establece la columna {@code borrado_por_destinatario}. */
    public void setBorradoPorDestinatario(Boolean borradoPorDestinatario) {
        this.borradoPorDestinatario = borradoPorDestinatario;
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
        if (!(o instanceof Mensaje other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
