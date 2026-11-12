package com.inkaquest.modules.matriculas.entity;

import com.inkaquest.modules.comercio.entity.Transaccion;
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
import java.time.LocalDate;
import java.util.Objects;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import jakarta.persistence.GenerationType;

/**
 * Entidad JPA de la tabla {@code public.renovacion_matricula}.
 *
 * <p>Mapeo derivado del esquema real de PostgreSQL (proyecto
 * {@code nrfdifzechrjikrvzhdl}). La tabla pertenece al modulo
 * {@code matriculas} y esta protegida por RLS: el acceso real depende
 * del contexto de autorizacion de la transaccion.</p>
 *
 * <p>El esquema de la base de datos es propiedad de las migraciones SQL
 * ({@code supabase/migrations}). Esta entidad NO genera el esquema: la
 * propiedad {@code ddl-auto} se fija en {@code none}.</p>
 */
@Entity
@Table(name = "renovacion_matricula")
public class RenovacionMatricula implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "matricula_id", referencedColumnName = "id")
    private Matricula matriculaId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pago_id", referencedColumnName = "id")
    private Transaccion pagoId;

    @Column(name = "monto", precision = 10, scale = 2, nullable = false)
    private BigDecimal monto;

    @Column(name = "moneda", nullable = false)
    private String moneda;

    @Column(name = "desde", nullable = false)
    private LocalDate desde;

    @Column(name = "hasta", nullable = false)
    private LocalDate hasta;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    /** Constructor vacoto requerido por JPA. */
    public RenovacionMatricula() {
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
    public Matricula getMatriculaId() {
        return matriculaId;
    }

    /** Establece la entidad relacionada. */
    public void setMatriculaId(Matricula matriculaId) {
        this.matriculaId = matriculaId;
    }

    /** Obtiene la entidad relacionada. */
    public Transaccion getPagoId() {
        return pagoId;
    }

    /** Establece la entidad relacionada. */
    public void setPagoId(Transaccion pagoId) {
        this.pagoId = pagoId;
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

    /** Obtiene la columna {@code desde}. */
    public LocalDate getDesde() {
        return desde;
    }

    /** Establece la columna {@code desde}. */
    public void setDesde(LocalDate desde) {
        this.desde = desde;
    }

    /** Obtiene la columna {@code hasta}. */
    public LocalDate getHasta() {
        return hasta;
    }

    /** Establece la columna {@code hasta}. */
    public void setHasta(LocalDate hasta) {
        this.hasta = hasta;
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
        if (!(o instanceof RenovacionMatricula other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
