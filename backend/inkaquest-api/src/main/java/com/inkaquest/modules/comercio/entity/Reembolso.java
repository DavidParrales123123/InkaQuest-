package com.inkaquest.modules.comercio.entity;

import com.inkaquest.modules.identidad.entity.Perfil;
import com.inkaquest.shared.enums.EstadoReembolso;
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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;
import jakarta.persistence.GenerationType;

/**
 * Entidad JPA de la tabla {@code public.reembolso}.
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
@Table(name = "reembolso")
public class Reembolso implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transaccion_id", referencedColumnName = "id")
    private Transaccion transaccionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pedido_id", referencedColumnName = "id")
    private Pedido pedidoId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", referencedColumnName = "id")
    private Perfil usuarioId;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "estado", columnDefinition = "estado_reembolso", nullable = false)
    private EstadoReembolso estado;

    @Column(name = "monto", precision = 10, scale = 2, nullable = false)
    private BigDecimal monto;

    @Column(name = "moneda", nullable = false)
    private String moneda;

    @Column(name = "motivo", nullable = true)
    private String motivo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "solicitado_por", referencedColumnName = "id")
    private Perfil solicitadoPor;

    @Column(name = "referencia_proveedor", nullable = true)
    private String referenciaProveedor;

    @Column(name = "procesado_en", nullable = true)
    private Instant procesadoEn;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    @UpdateTimestamp
    @Column(name = "actualizado_en", nullable = false)
    private Instant actualizadoEn;

    /** Constructor vacoto requerido por JPA. */
    public Reembolso() {
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
    public Transaccion getTransaccionId() {
        return transaccionId;
    }

    /** Establece la entidad relacionada. */
    public void setTransaccionId(Transaccion transaccionId) {
        this.transaccionId = transaccionId;
    }

    /** Obtiene la entidad relacionada. */
    public Pedido getPedidoId() {
        return pedidoId;
    }

    /** Establece la entidad relacionada. */
    public void setPedidoId(Pedido pedidoId) {
        this.pedidoId = pedidoId;
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
    public EstadoReembolso getEstado() {
        return estado;
    }

    /** Establece la columna {@code estado}. */
    public void setEstado(EstadoReembolso estado) {
        this.estado = estado;
    }

    /** Obtiene la columna {@code monto}. */
    public BigDecimal getMonto() {
        return monto;
    }

    /** Establece la columna {@code monto}. */
    public void setMonto(BigDecimal monto) {
        this.monto = monto;
    }

    /** Obtiene la columna {@code moneda}. */
    public String getMoneda() {
        return moneda;
    }

    /** Establece la columna {@code moneda}. */
    public void setMoneda(String moneda) {
        this.moneda = moneda;
    }

    /** Obtiene la columna {@code motivo}. */
    public String getMotivo() {
        return motivo;
    }

    /** Establece la columna {@code motivo}. */
    public void setMotivo(String motivo) {
        this.motivo = motivo;
    }

    /** Obtiene la entidad relacionada. */
    public Perfil getSolicitadoPor() {
        return solicitadoPor;
    }

    /** Establece la entidad relacionada. */
    public void setSolicitadoPor(Perfil solicitadoPor) {
        this.solicitadoPor = solicitadoPor;
    }

    /** Obtiene la columna {@code referencia_proveedor}. */
    public String getReferenciaProveedor() {
        return referenciaProveedor;
    }

    /** Establece la columna {@code referencia_proveedor}. */
    public void setReferenciaProveedor(String referenciaProveedor) {
        this.referenciaProveedor = referenciaProveedor;
    }

    /** Obtiene la columna {@code procesado_en}. */
    public Instant getProcesadoEn() {
        return procesadoEn;
    }

    /** Establece la columna {@code procesado_en}. */
    public void setProcesadoEn(Instant procesadoEn) {
        this.procesadoEn = procesadoEn;
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
        if (!(o instanceof Reembolso other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
