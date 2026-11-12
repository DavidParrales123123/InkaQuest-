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
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import jakarta.persistence.GenerationType;

/**
 * Entidad JPA de la tabla {@code public.transaccion_moneda}.
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
@Table(name = "transaccion_moneda")
public class TransaccionMoneda implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", referencedColumnName = "id")
    private Perfil usuarioId;

    @Column(name = "monedas", nullable = false)
    private Integer monedas;

    @Column(name = "saldo_resultante", nullable = false)
    private Integer saldoResultante;

    @Column(name = "concepto", nullable = false)
    private String concepto;

    @Column(name = "referencia_tipo", nullable = true)
    private String referenciaTipo;

    @Column(name = "referencia_id", nullable = true)
    private UUID referenciaId;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    /** Constructor vacoto requerido por JPA. */
    public TransaccionMoneda() {
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

    /** Obtiene la columna {@code monedas}. */
    public Integer getMonedas() {
        return monedas;
    }

    /** Establece la columna {@code monedas}. */
    public void setMonedas(Integer monedas) {
        this.monedas = monedas;
    }

    /** Obtiene la columna {@code saldo_resultante}. */
    public Integer getSaldoResultante() {
        return saldoResultante;
    }

    /** Establece la columna {@code saldo_resultante}. */
    public void setSaldoResultante(Integer saldoResultante) {
        this.saldoResultante = saldoResultante;
    }

    /** Obtiene la columna {@code concepto}. */
    public String getConcepto() {
        return concepto;
    }

    /** Establece la columna {@code concepto}. */
    public void setConcepto(String concepto) {
        this.concepto = concepto;
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
        if (!(o instanceof TransaccionMoneda other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
