package com.inkaquest.modules.matriculas.entity;

import com.inkaquest.modules.academico.entity.Curso;
import com.inkaquest.modules.identidad.entity.Perfil;
import com.inkaquest.shared.enums.EstadoMatricula;
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
 * Entidad JPA de la tabla {@code public.matricula}.
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
@Table(name = "matricula")
public class Matricula implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "estudiante_id", referencedColumnName = "id")
    private Perfil estudianteId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "curso_id", referencedColumnName = "id")
    private Curso cursoId;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "estado", columnDefinition = "estado_matricula", nullable = false)
    private EstadoMatricula estado;

    @Column(name = "precio_pagado", precision = 10, scale = 2, nullable = false)
    private BigDecimal precioPagado;

    @Column(name = "moneda", nullable = false)
    private String moneda;

    @Column(name = "porcentaje_progreso", precision = 5, scale = 2, nullable = false)
    private BigDecimal porcentajeProgreso;

    @Column(name = "xp_ganado", nullable = false)
    private Integer xpGanado;

    @Column(name = "matriculado_en", nullable = true)
    private Instant matriculadoEn;

    @Column(name = "completado_en", nullable = true)
    private Instant completadoEn;

    @Column(name = "cancelado_en", nullable = true)
    private Instant canceladoEn;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    @UpdateTimestamp
    @Column(name = "actualizado_en", nullable = false)
    private Instant actualizadoEn;

    /** Constructor vacoto requerido por JPA. */
    public Matricula() {
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
    public Perfil getEstudianteId() {
        return estudianteId;
    }

    /** Establece la entidad relacionada. */
    public void setEstudianteId(Perfil estudianteId) {
        this.estudianteId = estudianteId;
    }

    /** Obtiene la entidad relacionada. */
    public Curso getCursoId() {
        return cursoId;
    }

    /** Establece la entidad relacionada. */
    public void setCursoId(Curso cursoId) {
        this.cursoId = cursoId;
    }

    /** Obtiene la columna {@code estado}. */
    public EstadoMatricula getEstado() {
        return estado;
    }

    /** Establece la columna {@code estado}. */
    public void setEstado(EstadoMatricula estado) {
        this.estado = estado;
    }

    /** Obtiene la columna {@code precio_pagado}. */
    public BigDecimal getPrecioPagado() {
        return precioPagado;
    }

    /** Establece la columna {@code precio_pagado}. */
    public void setPrecioPagado(BigDecimal precioPagado) {
        this.precioPagado = precioPagado;
    }

    /** Obtiene la columna {@code moneda}. */
    public String getMoneda() {
        return moneda;
    }

    /** Establece la columna {@code moneda}. */
    public void setMoneda(String moneda) {
        this.moneda = moneda;
    }

    /** Obtiene la columna {@code porcentaje_progreso}. */
    public BigDecimal getPorcentajeProgreso() {
        return porcentajeProgreso;
    }

    /** Establece la columna {@code porcentaje_progreso}. */
    public void setPorcentajeProgreso(BigDecimal porcentajeProgreso) {
        this.porcentajeProgreso = porcentajeProgreso;
    }

    /** Obtiene la columna {@code xp_ganado}. */
    public Integer getXpGanado() {
        return xpGanado;
    }

    /** Establece la columna {@code xp_ganado}. */
    public void setXpGanado(Integer xpGanado) {
        this.xpGanado = xpGanado;
    }

    /** Obtiene la columna {@code matriculado_en}. */
    public Instant getMatriculadoEn() {
        return matriculadoEn;
    }

    /** Establece la columna {@code matriculado_en}. */
    public void setMatriculadoEn(Instant matriculadoEn) {
        this.matriculadoEn = matriculadoEn;
    }

    /** Obtiene la columna {@code completado_en}. */
    public Instant getCompletadoEn() {
        return completadoEn;
    }

    /** Establece la columna {@code completado_en}. */
    public void setCompletadoEn(Instant completadoEn) {
        this.completadoEn = completadoEn;
    }

    /** Obtiene la columna {@code cancelado_en}. */
    public Instant getCanceladoEn() {
        return canceladoEn;
    }

    /** Establece la columna {@code cancelado_en}. */
    public void setCanceladoEn(Instant canceladoEn) {
        this.canceladoEn = canceladoEn;
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
        if (!(o instanceof Matricula other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
