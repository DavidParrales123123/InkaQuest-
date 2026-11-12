package com.inkaquest.modules.evaluaciones.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import jakarta.persistence.GenerationType;

/**
 * Entidad JPA de la tabla {@code public.evaluacion}.
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
@Table(name = "evaluacion")
public class Evaluacion implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actividad_id", referencedColumnName = "id")
    private Actividad actividadId;

    @Column(name = "titulo", nullable = false)
    private String titulo;

    @Column(name = "descripcion", nullable = true)
    private String descripcion;

    @Column(name = "nota_maxima", precision = 8, scale = 2, nullable = false)
    private BigDecimal notaMaxima;

    @Column(name = "porcentaje_aprobacion", precision = 5, scale = 2, nullable = false)
    private BigDecimal porcentajeAprobacion;

    @Column(name = "intentos_permitidos", nullable = false)
    private Integer intentosPermitidos;

    @Column(name = "aleatorizar_preguntas", nullable = false)
    private Boolean aleatorizarPreguntas;

    @Column(name = "mostrar_resultado_inmediato", nullable = false)
    private Boolean mostrarResultadoInmediato;

    @Column(name = "duracion_minutos", nullable = true)
    private Integer duracionMinutos;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    @UpdateTimestamp
    @Column(name = "actualizado_en", nullable = false)
    private Instant actualizadoEn;

    /** Constructor vacoto requerido por JPA. */
    public Evaluacion() {
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
    public Actividad getActividadId() {
        return actividadId;
    }

    /** Establece la entidad relacionada. */
    public void setActividadId(Actividad actividadId) {
        this.actividadId = actividadId;
    }

    /** Obtiene la columna {@code titulo}. */
    public String getTitulo() {
        return titulo;
    }

    /** Establece la columna {@code titulo}. */
    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    /** Obtiene la columna {@code descripcion}. */
    public String getDescripcion() {
        return descripcion;
    }

    /** Establece la columna {@code descripcion}. */
    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    /** Obtiene la columna {@code nota_maxima}. */
    public BigDecimal getNotaMaxima() {
        return notaMaxima;
    }

    /** Establece la columna {@code nota_maxima}. */
    public void setNotaMaxima(BigDecimal notaMaxima) {
        this.notaMaxima = notaMaxima;
    }

    /** Obtiene la columna {@code porcentaje_aprobacion}. */
    public BigDecimal getPorcentajeAprobacion() {
        return porcentajeAprobacion;
    }

    /** Establece la columna {@code porcentaje_aprobacion}. */
    public void setPorcentajeAprobacion(BigDecimal porcentajeAprobacion) {
        this.porcentajeAprobacion = porcentajeAprobacion;
    }

    /** Obtiene la columna {@code intentos_permitidos}. */
    public Integer getIntentosPermitidos() {
        return intentosPermitidos;
    }

    /** Establece la columna {@code intentos_permitidos}. */
    public void setIntentosPermitidos(Integer intentosPermitidos) {
        this.intentosPermitidos = intentosPermitidos;
    }

    /** Obtiene la columna {@code aleatorizar_preguntas}. */
    public Boolean getAleatorizarPreguntas() {
        return aleatorizarPreguntas;
    }

    /** Establece la columna {@code aleatorizar_preguntas}. */
    public void setAleatorizarPreguntas(Boolean aleatorizarPreguntas) {
        this.aleatorizarPreguntas = aleatorizarPreguntas;
    }

    /** Obtiene la columna {@code mostrar_resultado_inmediato}. */
    public Boolean getMostrarResultadoInmediato() {
        return mostrarResultadoInmediato;
    }

    /** Establece la columna {@code mostrar_resultado_inmediato}. */
    public void setMostrarResultadoInmediato(Boolean mostrarResultadoInmediato) {
        this.mostrarResultadoInmediato = mostrarResultadoInmediato;
    }

    /** Obtiene la columna {@code duracion_minutos}. */
    public Integer getDuracionMinutos() {
        return duracionMinutos;
    }

    /** Establece la columna {@code duracion_minutos}. */
    public void setDuracionMinutos(Integer duracionMinutos) {
        this.duracionMinutos = duracionMinutos;
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
        if (!(o instanceof Evaluacion other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
