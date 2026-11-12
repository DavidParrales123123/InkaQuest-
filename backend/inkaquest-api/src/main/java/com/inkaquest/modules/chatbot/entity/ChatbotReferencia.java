package com.inkaquest.modules.chatbot.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import jakarta.persistence.GenerationType;

/**
 * Entidad JPA de la tabla {@code public.chatbot_referencia}.
 *
 * <p>Mapeo derivado del esquema real de PostgreSQL (proyecto
 * {@code nrfdifzechrjikrvzhdl}). La tabla pertenece al modulo
 * {@code chatbot} y esta protegida por RLS: el acceso real depende
 * del contexto de autorizacion de la transaccion.</p>
 *
 * <p>El esquema de la base de datos es propiedad de las migraciones SQL
 * ({@code supabase/migrations}). Esta entidad NO genera el esquema: la
 * propiedad {@code ddl-auto} se fija en {@code none}.</p>
 */
@Entity
@Table(name = "chatbot_referencia")
public class ChatbotReferencia implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mensaje_id", referencedColumnName = "id")
    private ChatbotMensaje mensajeId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fragmento_id", referencedColumnName = "id")
    private ChatbotFragmento fragmentoId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "documento_id", referencedColumnName = "id")
    private ChatbotDocumento documentoId;

    @Column(name = "relevancia", precision = 6, scale = 4, nullable = false)
    private BigDecimal relevancia;

    @Column(name = "cita", nullable = true)
    private String cita;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    /** Constructor vacoto requerido por JPA. */
    public ChatbotReferencia() {
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
    public ChatbotMensaje getMensajeId() {
        return mensajeId;
    }

    /** Establece la entidad relacionada. */
    public void setMensajeId(ChatbotMensaje mensajeId) {
        this.mensajeId = mensajeId;
    }

    /** Obtiene la entidad relacionada. */
    public ChatbotFragmento getFragmentoId() {
        return fragmentoId;
    }

    /** Establece la entidad relacionada. */
    public void setFragmentoId(ChatbotFragmento fragmentoId) {
        this.fragmentoId = fragmentoId;
    }

    /** Obtiene la entidad relacionada. */
    public ChatbotDocumento getDocumentoId() {
        return documentoId;
    }

    /** Establece la entidad relacionada. */
    public void setDocumentoId(ChatbotDocumento documentoId) {
        this.documentoId = documentoId;
    }

    /** Obtiene la columna {@code relevancia}. */
    public BigDecimal getRelevancia() {
        return relevancia;
    }

    /** Establece la columna {@code relevancia}. */
    public void setRelevancia(BigDecimal relevancia) {
        this.relevancia = relevancia;
    }

    /** Obtiene la columna {@code cita}. */
    public String getCita() {
        return cita;
    }

    /** Establece la columna {@code cita}. */
    public void setCita(String cita) {
        this.cita = cita;
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
        if (!(o instanceof ChatbotReferencia other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
