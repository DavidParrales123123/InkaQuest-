package com.inkaquest.modules.comercio.entity;

import com.inkaquest.modules.identidad.entity.Perfil;
import com.inkaquest.shared.enums.EstadoPedido;
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
 * Entidad JPA de la tabla {@code public.pedido}.
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
@Table(name = "pedido")
public class Pedido implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", referencedColumnName = "id")
    private Perfil usuarioId;

    @Column(name = "numero", nullable = false)
    private String numero;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "estado", columnDefinition = "estado_pedido", nullable = false)
    private EstadoPedido estado;

    @Column(name = "subtotal", precision = 10, scale = 2, nullable = false)
    private BigDecimal subtotal;

    @Column(name = "descuento", precision = 10, scale = 2, nullable = false)
    private BigDecimal descuento;

    @Column(name = "total", precision = 10, scale = 2, nullable = false)
    private BigDecimal total;

    @Column(name = "moneda", nullable = false)
    private String moneda;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cupon_id", referencedColumnName = "id")
    private Cupon cuponId;

    @Column(name = "clave_idempotencia", nullable = true)
    private String claveIdempotencia;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    @UpdateTimestamp
    @Column(name = "actualizado_en", nullable = false)
    private Instant actualizadoEn;

    /** Constructor vacoto requerido por JPA. */
    public Pedido() {
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

    /** Obtiene la columna {@code numero}. */
    public String getNumero() {
        return numero;
    }

    /** Establece la columna {@code numero}. */
    public void setNumero(String numero) {
        this.numero = numero;
    }

    /** Obtiene la columna {@code estado}. */
    public EstadoPedido getEstado() {
        return estado;
    }

    /** Establece la columna {@code estado}. */
    public void setEstado(EstadoPedido estado) {
        this.estado = estado;
    }

    /** Obtiene la columna {@code subtotal}. */
    public BigDecimal getSubtotal() {
        return subtotal;
    }

    /** Establece la columna {@code subtotal}. */
    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }

    /** Obtiene la columna {@code descuento}. */
    public BigDecimal getDescuento() {
        return descuento;
    }

    /** Establece la columna {@code descuento}. */
    public void setDescuento(BigDecimal descuento) {
        this.descuento = descuento;
    }

    /** Obtiene la columna {@code total}. */
    public BigDecimal getTotal() {
        return total;
    }

    /** Establece la columna {@code total}. */
    public void setTotal(BigDecimal total) {
        this.total = total;
    }

    /** Obtiene la columna {@code moneda}. */
    public String getMoneda() {
        return moneda;
    }

    /** Establece la columna {@code moneda}. */
    public void setMoneda(String moneda) {
        this.moneda = moneda;
    }

    /** Obtiene la entidad relacionada. */
    public Cupon getCuponId() {
        return cuponId;
    }

    /** Establece la entidad relacionada. */
    public void setCuponId(Cupon cuponId) {
        this.cuponId = cuponId;
    }

    /** Obtiene la columna {@code clave_idempotencia}. */
    public String getClaveIdempotencia() {
        return claveIdempotencia;
    }

    /** Establece la columna {@code clave_idempotencia}. */
    public void setClaveIdempotencia(String claveIdempotencia) {
        this.claveIdempotencia = claveIdempotencia;
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
        if (!(o instanceof Pedido other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
