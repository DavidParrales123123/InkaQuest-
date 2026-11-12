package com.inkaquest.modules.evaluaciones.entity;

import com.inkaquest.modules.identidad.entity.Perfil;
import com.inkaquest.shared.enums.EstadoIntento;
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
 * Entidad JPA de la tabla {@code public.intento_evaluacion}.
 *
 * <p>Mapeo derivado del esquema real de PostgreSQL (proyecto
 * {@code nrfdifzechrjikrvzhdl}). La tabla pertenece al modulo
 * {@code evaluaciones} y esta protegida por RLS: el acceso real depende
 * del contexto de autorizacion de la transaccion.</p>
 *
 * <p>El esquema de la base de datos es propiedad de las migraciones SQL
 * ({@code supabase/migrations}). Esta entidad NO genera el esquema: la
 * propiedad {@code ddl-auto} se fija en {@code none}.</p>
 */
@Entity
@Table(name = "intento_evaluacion")
public class IntentoEvaluacion implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evaluacion_id", referencedColumnName = "id")
    private Evaluacion evaluacionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "examen_id", referencedColumnName = "id")
    private Examen examenId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "estudiante_id", referencedColumnName = "id")
    private Perfil estudianteId;

    @Column(name = "numero", nullable = false)
    private Integer numero;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "estado", columnDefinition = "estado_intento", nullable = false)
    private EstadoIntento estado;

    @Column(name = "puntaje", precision = 8, scale = 2, nullable = false)
    private BigDecimal puntaje;

    @Column(name = "puntaje_maximo", precision = 8, scale = 2, nullable = false)
    private BigDecimal puntajeMaximo;

    @Column(name = "aprobado", nullable = true)
    private Boolean aprobado;

    @Column(name = "tiempo_inicio", nullable = false)
    private Instant tiempoInicio;

    @Column(name = "tiempo_fin", nullable = true)
    private Instant tiempoFin;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    @UpdateTimestamp
    @Column(name = "actualizado_en", nullable = false)
    private Instant actualizadoEn;

    /** Constructor vacoto requerido por JPA. */
    public IntentoEvaluacion() {
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
    public Evaluacion getEvaluacionId() {
        return evaluacionId;
    }

    /** Establece la entidad relacionada. */
    public void setEvaluacionId(Evaluacion evaluacionId) {
        this.evaluacionId = evaluacionId;
    }

    /** Obtiene la entidad relacionada. */
    public Examen getExamenId() {
        return examenId;
    }

    /** Establece la entidad relacionada. */
    public void setExamenId(Examen examenId) {
        this.examenId = examenId;
    }

    /** Obtiene la entidad relacionada. */
    public Perfil getEstudianteId() {
        return estudianteId;
    }

    /** Establece la entidad relacionada. */
    public void setEstudianteId(Perfil estudianteId) {
        this.estudianteId = estudianteId;
    }

    /** Obtiene la columna {@code numero}. */
    public Integer getNumero() {
        return numero;
    }

    /** Establece la columna {@code numero}. */
    public void setNumero(Integer numero) {
        this.numero = numero;
    }

    /** Obtiene la columna {@code estado}. */
    public EstadoIntento getEstado() {
        return estado;
    }

    /** Establece la columna {@code estado}. */
    public void setEstado(EstadoIntento estado) {
        this.estado = estado;
    }

    /** Obtiene la columna {@code puntaje}. */
    public BigDecimal getPuntaje() {
        return puntaje;
    }

    /** Establece la columna {@code puntaje}. */
    public void setPuntaje(BigDecimal puntaje) {
        this.puntaje = puntaje;
    }

    /** Obtiene la columna {@code puntaje_maximo}. */
    public BigDecimal getPuntajeMaximo() {
        return puntajeMaximo;
    }

    /** Establece la columna {@code puntaje_maximo}. */
    public void setPuntajeMaximo(BigDecimal puntajeMaximo) {
        this.puntajeMaximo = puntajeMaximo;
    }

    /** Obtiene la columna {@code aprobado}. */
    public Boolean getAprobado() {
        return aprobado;
    }

    /** Establece la columna {@code aprobado}. */
    public void setAprobado(Boolean aprobado) {
        this.aprobado = aprobado;
    }

    /** Obtiene la columna {@code tiempo_inicio}. */
    public Instant getTiempoInicio() {
        return tiempoInicio;
    }

    /** Establece la columna {@code tiempo_inicio}. */
    public void setTiempoInicio(Instant tiempoInicio) {
        this.tiempoInicio = tiempoInicio;
    }

    /** Obtiene la columna {@code tiempo_fin}. */
    public Instant getTiempoFin() {
        return tiempoFin;
    }

    /** Establece la columna {@code tiempo_fin}. */
    public void setTiempoFin(Instant tiempoFin) {
        this.tiempoFin = tiempoFin;
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
        if (!(o instanceof IntentoEvaluacion other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
