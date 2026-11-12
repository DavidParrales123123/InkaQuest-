package com.inkaquest.modules.progreso.entity;

import com.inkaquest.modules.academico.entity.Curso;
import com.inkaquest.modules.academico.entity.Leccion;
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
import jakarta.persistence.GenerationType;

/**
 * Entidad JPA de la tabla {@code public.actividad_completada}.
 *
 * <p>Mapeo derivado del esquema real de PostgreSQL (proyecto
 * {@code nrfdifzechrjikrvzhdl}). La tabla pertenece al modulo
 * {@code progreso} y esta protegida por RLS: el acceso real depende
 * del contexto de autorizacion de la transaccion.</p>
 *
 * <p>El esquema de la base de datos es propiedad de las migraciones SQL
 * ({@code supabase/migrations}). Esta entidad NO genera el esquema: la
 * propiedad {@code ddl-auto} se fija en {@code none}.</p>
 */
@Entity
@Table(name = "actividad_completada")
public class ActividadCompletada implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "estudiante_id", referencedColumnName = "id")
    private Perfil estudianteId;

    @Column(name = "actividad_id", nullable = false)
    private UUID actividadId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "curso_id", referencedColumnName = "id")
    private Curso cursoId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "leccion_id", referencedColumnName = "id")
    private Leccion leccionId;

    @Column(name = "xp_obtenido", nullable = false)
    private Integer xpObtenido;

    @Column(name = "porcentaje", precision = 5, scale = 2, nullable = false)
    private BigDecimal porcentaje;

    @Column(name = "completado_en", nullable = false)
    private Instant completadoEn;

    /** Constructor vacoto requerido por JPA. */
    public ActividadCompletada() {
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

    /** Obtiene la columna {@code actividad_id}. */
    public UUID getActividadId() {
        return actividadId;
    }

    /** Establece la columna {@code actividad_id}. */
    public void setActividadId(UUID actividadId) {
        this.actividadId = actividadId;
    }

    /** Obtiene la entidad relacionada. */
    public Curso getCursoId() {
        return cursoId;
    }

    /** Establece la entidad relacionada. */
    public void setCursoId(Curso cursoId) {
        this.cursoId = cursoId;
    }

    /** Obtiene la entidad relacionada. */
    public Leccion getLeccionId() {
        return leccionId;
    }

    /** Establece la entidad relacionada. */
    public void setLeccionId(Leccion leccionId) {
        this.leccionId = leccionId;
    }

    /** Obtiene la columna {@code xp_obtenido}. */
    public Integer getXpObtenido() {
        return xpObtenido;
    }

    /** Establece la columna {@code xp_obtenido}. */
    public void setXpObtenido(Integer xpObtenido) {
        this.xpObtenido = xpObtenido;
    }

    /** Obtiene la columna {@code porcentaje}. */
    public BigDecimal getPorcentaje() {
        return porcentaje;
    }

    /** Establece la columna {@code porcentaje}. */
    public void setPorcentaje(BigDecimal porcentaje) {
        this.porcentaje = porcentaje;
    }

    /** Obtiene la columna {@code completado_en}. */
    public Instant getCompletadoEn() {
        return completadoEn;
    }

    /** Establece la columna {@code completado_en}. */
    public void setCompletadoEn(Instant completadoEn) {
        this.completadoEn = completadoEn;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof ActividadCompletada other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
