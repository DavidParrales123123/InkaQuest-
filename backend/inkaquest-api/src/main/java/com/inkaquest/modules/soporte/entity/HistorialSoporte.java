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
 * Entidad JPA de la tabla {@code public.historial_soporte}.
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
@Table(name = "historial_soporte")
public class HistorialSoporte implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ticket_id", referencedColumnName = "id")
    private Ticket ticketId;

    @Column(name = "evento", nullable = false)
    private String evento;

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
    public HistorialSoporte() {
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
    public Ticket getTicketId() {
        return ticketId;
    }

    /** Establece la entidad relacionada. */
    public void setTicketId(Ticket ticketId) {
        this.ticketId = ticketId;
    }

    /** Obtiene la columna {@code evento}. */
    public String getEvento() {
        return evento;
    }

    /** Establece la columna {@code evento}. */
    public void setEvento(String evento) {
        this.evento = evento;
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
        if (!(o instanceof HistorialSoporte other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
