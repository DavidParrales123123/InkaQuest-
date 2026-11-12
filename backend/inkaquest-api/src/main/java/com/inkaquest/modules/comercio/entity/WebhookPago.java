package com.inkaquest.modules.comercio.entity;

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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import jakarta.persistence.GenerationType;

/**
 * Entidad JPA de la tabla {@code public.webhook_pago}.
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
@Table(name = "webhook_pago")
public class WebhookPago implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @Column(name = "evento_id", nullable = false)
    private String eventoId;

    @Column(name = "tipo_evento", nullable = false)
    private String tipoEvento;

    @Column(name = "proveedor", nullable = false)
    private String proveedor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transaccion_id", referencedColumnName = "id")
    private Transaccion transaccionId;

    @Column(name = "recibido_en", nullable = false)
    private Instant recibidoEn;

    @Column(name = "procesado_en", nullable = true)
    private Instant procesadoEn;

    @Column(name = "procesado", nullable = false)
    private Boolean procesado;

    @Column(name = "error", nullable = true)
    private String error;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "payload", columnDefinition = "jsonb", nullable = false)
    private Map<String, Object> payload;

    /** Constructor vacoto requerido por JPA. */
    public WebhookPago() {
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

    /** Obtiene la columna {@code evento_id}. */
    public String getEventoId() {
        return eventoId;
    }

    /** Establece la columna {@code evento_id}. */
    public void setEventoId(String eventoId) {
        this.eventoId = eventoId;
    }

    /** Obtiene la columna {@code tipo_evento}. */
    public String getTipoEvento() {
        return tipoEvento;
    }

    /** Establece la columna {@code tipo_evento}. */
    public void setTipoEvento(String tipoEvento) {
        this.tipoEvento = tipoEvento;
    }

    /** Obtiene la columna {@code proveedor}. */
    public String getProveedor() {
        return proveedor;
    }

    /** Establece la columna {@code proveedor}. */
    public void setProveedor(String proveedor) {
        this.proveedor = proveedor;
    }

    /** Obtiene la entidad relacionada. */
    public Transaccion getTransaccionId() {
        return transaccionId;
    }

    /** Establece la entidad relacionada. */
    public void setTransaccionId(Transaccion transaccionId) {
        this.transaccionId = transaccionId;
    }

    /** Obtiene la columna {@code recibido_en}. */
    public Instant getRecibidoEn() {
        return recibidoEn;
    }

    /** Establece la columna {@code recibido_en}. */
    public void setRecibidoEn(Instant recibidoEn) {
        this.recibidoEn = recibidoEn;
    }

    /** Obtiene la columna {@code procesado_en}. */
    public Instant getProcesadoEn() {
        return procesadoEn;
    }

    /** Establece la columna {@code procesado_en}. */
    public void setProcesadoEn(Instant procesadoEn) {
        this.procesadoEn = procesadoEn;
    }

    /** Obtiene la columna {@code procesado}. */
    public Boolean getProcesado() {
        return procesado;
    }

    /** Establece la columna {@code procesado}. */
    public void setProcesado(Boolean procesado) {
        this.procesado = procesado;
    }

    /** Obtiene la columna {@code error}. */
    public String getError() {
        return error;
    }

    /** Establece la columna {@code error}. */
    public void setError(String error) {
        this.error = error;
    }

    /** Obtiene la columna {@code payload}. */
    public Map<String, Object> getPayload() {
        return payload;
    }

    /** Establece la columna {@code payload}. */
    public void setPayload(Map<String, Object> payload) {
        this.payload = payload;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof WebhookPago other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
