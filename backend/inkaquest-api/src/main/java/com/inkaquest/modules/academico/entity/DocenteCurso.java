package com.inkaquest.modules.academico.entity;

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
 * Entidad JPA de la tabla {@code public.docente_curso}.
 *
 * <p>Mapeo derivado del esquema real de PostgreSQL (proyecto
 * {@code nrfdifzechrjikrvzhdl}). La tabla pertenece al modulo
 * {@code academico} y esta protegida por RLS: el acceso real depende
 * del contexto de autorizacion de la transaccion.</p>
 *
 * <p>El esquema de la base de datos es propiedad de las migraciones SQL
 * ({@code supabase/migrations}). Esta entidad NO genera el esquema: la
 * propiedad {@code ddl-auto} se fija en {@code none}.</p>
 */
@Entity
@Table(name = "docente_curso")
public class DocenteCurso implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "curso_id", referencedColumnName = "id")
    private Curso cursoId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "docente_id", referencedColumnName = "id")
    private Perfil docenteId;

    @Column(name = "es_responsable", nullable = false)
    private Boolean esResponsable;

    @Column(name = "activo", nullable = false)
    private Boolean activo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "asignado_por", referencedColumnName = "id")
    private Perfil asignadoPor;

    @Column(name = "asignado_en", nullable = false)
    private Instant asignadoEn;

    /** Constructor vacoto requerido por JPA. */
    public DocenteCurso() {
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
    public Curso getCursoId() {
        return cursoId;
    }

    /** Establece la entidad relacionada. */
    public void setCursoId(Curso cursoId) {
        this.cursoId = cursoId;
    }

    /** Obtiene la entidad relacionada. */
    public Perfil getDocenteId() {
        return docenteId;
    }

    /** Establece la entidad relacionada. */
    public void setDocenteId(Perfil docenteId) {
        this.docenteId = docenteId;
    }

    /** Obtiene la columna {@code es_responsable}. */
    public Boolean getEsResponsable() {
        return esResponsable;
    }

    /** Establece la columna {@code es_responsable}. */
    public void setEsResponsable(Boolean esResponsable) {
        this.esResponsable = esResponsable;
    }

    /** Obtiene la columna {@code activo}. */
    public Boolean getActivo() {
        return activo;
    }

    /** Establece la columna {@code activo}. */
    public void setActivo(Boolean activo) {
        this.activo = activo;
    }

    /** Obtiene la entidad relacionada. */
    public Perfil getAsignadoPor() {
        return asignadoPor;
    }

    /** Establece la entidad relacionada. */
    public void setAsignadoPor(Perfil asignadoPor) {
        this.asignadoPor = asignadoPor;
    }

    /** Obtiene la columna {@code asignado_en}. */
    public Instant getAsignadoEn() {
        return asignadoEn;
    }

    /** Establece la columna {@code asignado_en}. */
    public void setAsignadoEn(Instant asignadoEn) {
        this.asignadoEn = asignadoEn;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof DocenteCurso other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
