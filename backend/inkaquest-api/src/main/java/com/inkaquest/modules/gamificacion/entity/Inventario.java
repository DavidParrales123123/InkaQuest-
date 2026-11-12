package com.inkaquest.modules.gamificacion.entity;

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
import java.util.Objects;
import java.util.UUID;
import jakarta.persistence.GenerationType;

/**
 * Entidad JPA de la tabla {@code public.inventario}.
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
@Table(name = "inventario")
public class Inventario implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", referencedColumnName = "id")
    private Perfil usuarioId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tienda_item_id", referencedColumnName = "id")
    private TiendaItem tiendaItemId;

    @Column(name = "cantidad", nullable = false)
    private Integer cantidad;

    @Column(name = "clave_idempotencia", nullable = true)
    private String claveIdempotencia;

    @Column(name = "referencia_tipo", nullable = true)
    private String referenciaTipo;

    @Column(name = "referencia_id", nullable = true)
    private UUID referenciaId;

    @Column(name = "adquirido_en", nullable = false)
    private Instant adquiridoEn;

    /** Constructor vacoto requerido por JPA. */
    public Inventario() {
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

    /** Obtiene la entidad relacionada. */
    public TiendaItem getTiendaItemId() {
        return tiendaItemId;
    }

    /** Establece la entidad relacionada. */
    public void setTiendaItemId(TiendaItem tiendaItemId) {
        this.tiendaItemId = tiendaItemId;
    }

    /** Obtiene la columna {@code cantidad}. */
    public Integer getCantidad() {
        return cantidad;
    }

    /** Establece la columna {@code cantidad}. */
    public void setCantidad(Integer cantidad) {
        this.cantidad = cantidad;
    }

    /** Obtiene la columna {@code clave_idempotencia}. */
    public String getClaveIdempotencia() {
        return claveIdempotencia;
    }

    /** Establece la columna {@code clave_idempotencia}. */
    public void setClaveIdempotencia(String claveIdempotencia) {
        this.claveIdempotencia = claveIdempotencia;
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

    /** Obtiene la columna {@code adquirido_en}. */
    public Instant getAdquiridoEn() {
        return adquiridoEn;
    }

    /** Establece la columna {@code adquirido_en}. */
    public void setAdquiridoEn(Instant adquiridoEn) {
        this.adquiridoEn = adquiridoEn;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof Inventario other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
