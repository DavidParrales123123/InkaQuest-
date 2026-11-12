package com.inkaquest.modules.comercio.entity;

import com.inkaquest.modules.identidad.entity.Perfil;
import com.inkaquest.shared.enums.EstadoPago;
import com.inkaquest.shared.enums.MetodoPago;
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
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;
import jakarta.persistence.GenerationType;

/**
 * Entidad JPA de la tabla {@code public.transaccion}.
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
@Table(name = "transaccion")
public class Transaccion implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pedido_id", referencedColumnName = "id")
    private Pedido pedidoId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", referencedColumnName = "id")
    private Perfil usuarioId;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "estado", columnDefinition = "estado_pago", nullable = false)
    private EstadoPago estado;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "metodo", columnDefinition = "metodo_pago", nullable = false)
    private MetodoPago metodo;

    @Column(name = "monto", precision = 10, scale = 2, nullable = false)
    private BigDecimal monto;

    @Column(name = "moneda", nullable = false)
    private String moneda;

    @Column(name = "proveedor", nullable = false)
    private String proveedor;

    @Column(name = "referencia", nullable = true)
    private String referencia;

    @Column(name = "codigo_autorizacion", nullable = true)
    private String codigoAutorizacion;

    @Column(name = "clave_idempotencia", nullable = true)
    private String claveIdempotencia;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "datos", columnDefinition = "jsonb", nullable = false)
    private Map<String, Object> datos;

    @Column(name = "autorizado_en", nullable = true)
    private Instant autorizadoEn;

    @Column(name = "capturado_en", nullable = true)
    private Instant capturadoEn;

    @Column(name = "anulado_en", nullable = true)
    private Instant anuladoEn;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    @UpdateTimestamp
    @Column(name = "actualizado_en", nullable = false)
    private Instant actualizadoEn;

    /** Constructor vacoto requerido por JPA. */
    public Transaccion() {
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
    public EstadoPago getEstado() {
        return estado;
    }

    /** Establece la columna {@code estado}. */
    public void setEstado(EstadoPago estado) {
        this.estado = estado;
    }

    /** Obtiene la columna {@code metodo}. */
    public MetodoPago getMetodo() {
        return metodo;
    }

    /** Establece la columna {@code metodo}. */
    public void setMetodo(MetodoPago metodo) {
        this.metodo = metodo;
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

    /** Obtiene la columna {@code proveedor}. */
    public String getProveedor() {
        return proveedor;
    }

    /** Establece la columna {@code proveedor}. */
    public void setProveedor(String proveedor) {
        this.proveedor = proveedor;
    }

    /** Obtiene la columna {@code referencia}. */
    public String getReferencia() {
        return referencia;
    }

    /** Establece la columna {@code referencia}. */
    public void setReferencia(String referencia) {
        this.referencia = referencia;
    }

    /** Obtiene la columna {@code codigo_autorizacion}. */
    public String getCodigoAutorizacion() {
        return codigoAutorizacion;
    }

    /** Establece la columna {@code codigo_autorizacion}. */
    public void setCodigoAutorizacion(String codigoAutorizacion) {
        this.codigoAutorizacion = codigoAutorizacion;
    }

    /** Obtiene la columna {@code clave_idempotencia}. */
    public String getClaveIdempotencia() {
        return claveIdempotencia;
    }

    /** Establece la columna {@code clave_idempotencia}. */
    public void setClaveIdempotencia(String claveIdempotencia) {
        this.claveIdempotencia = claveIdempotencia;
    }

    /** Obtiene la columna {@code datos}. */
    public Map<String, Object> getDatos() {
        return datos;
    }

    /** Establece la columna {@code datos}. */
    public void setDatos(Map<String, Object> datos) {
        this.datos = datos;
    }

    /** Obtiene la columna {@code autorizado_en}. */
    public Instant getAutorizadoEn() {
        return autorizadoEn;
    }

    /** Establece la columna {@code autorizado_en}. */
    public void setAutorizadoEn(Instant autorizadoEn) {
        this.autorizadoEn = autorizadoEn;
    }

    /** Obtiene la columna {@code capturado_en}. */
    public Instant getCapturadoEn() {
        return capturadoEn;
    }

    /** Establece la columna {@code capturado_en}. */
    public void setCapturadoEn(Instant capturadoEn) {
        this.capturadoEn = capturadoEn;
    }

    /** Obtiene la columna {@code anulado_en}. */
    public Instant getAnuladoEn() {
        return anuladoEn;
    }

    /** Establece la columna {@code anulado_en}. */
    public void setAnuladoEn(Instant anuladoEn) {
        this.anuladoEn = anuladoEn;
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
        if (!(o instanceof Transaccion other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
