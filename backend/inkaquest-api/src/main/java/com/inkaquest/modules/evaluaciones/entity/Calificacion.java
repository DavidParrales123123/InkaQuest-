package com.inkaquest.modules.evaluaciones.entity;

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
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import jakarta.persistence.GenerationType;

/**
 * Entidad JPA de la tabla {@code public.calificacion}.
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
@Table(name = "calificacion")
public class Calificacion implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entrega_id", referencedColumnName = "id")
    private Entrega entregaId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "intento_id", referencedColumnName = "id")
    private IntentoEvaluacion intentoId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "estudiante_id", referencedColumnName = "id")
    private Perfil estudianteId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "docente_id", referencedColumnName = "id")
    private Perfil docenteId;

    @Column(name = "nota", precision = 8, scale = 2, nullable = false)
    private BigDecimal nota;

    @Column(name = "nota_maxima", precision = 8, scale = 2, nullable = false)
    private BigDecimal notaMaxima;

    @Column(name = "aprobado", nullable = true)
    private Boolean aprobado;

    @Column(name = "comentario", nullable = true)
    private String comentario;

    @Column(name = "calificado_en", nullable = false)
    private Instant calificadoEn;

    @UpdateTimestamp
    @Column(name = "actualizado_en", nullable = false)
    private Instant actualizadoEn;

    /** Constructor vacoto requerido por JPA. */
    public Calificacion() {
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
    public Entrega getEntregaId() {
        return entregaId;
    }

    /** Establece la entidad relacionada. */
    public void setEntregaId(Entrega entregaId) {
        this.entregaId = entregaId;
    }

    /** Obtiene la entidad relacionada. */
    public IntentoEvaluacion getIntentoId() {
        return intentoId;
    }

    /** Establece la entidad relacionada. */
    public void setIntentoId(IntentoEvaluacion intentoId) {
        this.intentoId = intentoId;
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
    public Perfil getDocenteId() {
        return docenteId;
    }

    /** Establece la entidad relacionada. */
    public void setDocenteId(Perfil docenteId) {
        this.docenteId = docenteId;
    }

    /** Obtiene la columna {@code nota}. */
    public BigDecimal getNota() {
        return nota;
    }

    /** Establece la columna {@code nota}. */
    public void setNota(BigDecimal nota) {
        this.nota = nota;
    }

    /** Obtiene la columna {@code nota_maxima}. */
    public BigDecimal getNotaMaxima() {
        return notaMaxima;
    }

    /** Establece la columna {@code nota_maxima}. */
    public void setNotaMaxima(BigDecimal notaMaxima) {
        this.notaMaxima = notaMaxima;
    }

    /** Obtiene la columna {@code aprobado}. */
    public Boolean getAprobado() {
        return aprobado;
    }

    /** Establece la columna {@code aprobado}. */
    public void setAprobado(Boolean aprobado) {
        this.aprobado = aprobado;
    }

    /** Obtiene la columna {@code comentario}. */
    public String getComentario() {
        return comentario;
    }

    /** Establece la columna {@code comentario}. */
    public void setComentario(String comentario) {
        this.comentario = comentario;
    }

    /** Obtiene la columna {@code calificado_en}. */
    public Instant getCalificadoEn() {
        return calificadoEn;
    }

    /** Establece la columna {@code calificado_en}. */
    public void setCalificadoEn(Instant calificadoEn) {
        this.calificadoEn = calificadoEn;
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
        if (!(o instanceof Calificacion other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
