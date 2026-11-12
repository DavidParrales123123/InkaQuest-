package com.inkaquest.modules.evaluaciones.entity;

import com.inkaquest.shared.enums.TipoPregunta;
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
 * Entidad JPA de la tabla {@code public.pregunta}.
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
@Table(name = "pregunta")
public class Pregunta implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evaluacion_id", referencedColumnName = "id")
    private Evaluacion evaluacionId;

    @Column(name = "orden", nullable = false)
    private Integer orden;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "tipo", columnDefinition = "tipo_pregunta", nullable = false)
    private TipoPregunta tipo;

    @Column(name = "enunciado", nullable = false)
    private String enunciado;

    @Column(name = "descripcion", nullable = true)
    private String descripcion;

    @Column(name = "puntos", precision = 8, scale = 2, nullable = false)
    private BigDecimal puntos;

    @Column(name = "es_privada", nullable = false)
    private Boolean esPrivada;

    @Column(name = "requiere_revision", nullable = false)
    private Boolean requiereRevision;

    @Column(name = "retroalimentacion", nullable = true)
    private String retroalimentacion;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    @UpdateTimestamp
    @Column(name = "actualizado_en", nullable = false)
    private Instant actualizadoEn;

    /** Constructor vacoto requerido por JPA. */
    public Pregunta() {
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

    /** Obtiene la columna {@code orden}. */
    public Integer getOrden() {
        return orden;
    }

    /** Establece la columna {@code orden}. */
    public void setOrden(Integer orden) {
        this.orden = orden;
    }

    /** Obtiene la columna {@code tipo}. */
    public TipoPregunta getTipo() {
        return tipo;
    }

    /** Establece la columna {@code tipo}. */
    public void setTipo(TipoPregunta tipo) {
        this.tipo = tipo;
    }

    /** Obtiene la columna {@code enunciado}. */
    public String getEnunciado() {
        return enunciado;
    }

    /** Establece la columna {@code enunciado}. */
    public void setEnunciado(String enunciado) {
        this.enunciado = enunciado;
    }

    /** Obtiene la columna {@code descripcion}. */
    public String getDescripcion() {
        return descripcion;
    }

    /** Establece la columna {@code descripcion}. */
    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    /** Obtiene la columna {@code puntos}. */
    public BigDecimal getPuntos() {
        return puntos;
    }

    /** Establece la columna {@code puntos}. */
    public void setPuntos(BigDecimal puntos) {
        this.puntos = puntos;
    }

    /** Obtiene la columna {@code es_privada}. */
    public Boolean getEsPrivada() {
        return esPrivada;
    }

    /** Establece la columna {@code es_privada}. */
    public void setEsPrivada(Boolean esPrivada) {
        this.esPrivada = esPrivada;
    }

    /** Obtiene la columna {@code requiere_revision}. */
    public Boolean getRequiereRevision() {
        return requiereRevision;
    }

    /** Establece la columna {@code requiere_revision}. */
    public void setRequiereRevision(Boolean requiereRevision) {
        this.requiereRevision = requiereRevision;
    }

    /** Obtiene la columna {@code retroalimentacion}. */
    public String getRetroalimentacion() {
        return retroalimentacion;
    }

    /** Establece la columna {@code retroalimentacion}. */
    public void setRetroalimentacion(String retroalimentacion) {
        this.retroalimentacion = retroalimentacion;
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
        if (!(o instanceof Pregunta other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
