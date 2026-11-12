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
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import jakarta.persistence.GenerationType;

/**
 * Entidad JPA de la tabla {@code public.retroalimentacion}.
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
@Table(name = "retroalimentacion")
public class Retroalimentacion implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "calificacion_id", referencedColumnName = "id")
    private Calificacion calificacionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "intento_id", referencedColumnName = "id")
    private IntentoEvaluacion intentoId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entrega_id", referencedColumnName = "id")
    private Entrega entregaId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "autor_id", referencedColumnName = "id")
    private Perfil autorId;

    @Column(name = "mensaje", nullable = false)
    private String mensaje;

    @Column(name = "visible_estudiante", nullable = false)
    private Boolean visibleEstudiante;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    /** Constructor vacoto requerido por JPA. */
    public Retroalimentacion() {
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
    public Calificacion getCalificacionId() {
        return calificacionId;
    }

    /** Establece la entidad relacionada. */
    public void setCalificacionId(Calificacion calificacionId) {
        this.calificacionId = calificacionId;
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
    public Entrega getEntregaId() {
        return entregaId;
    }

    /** Establece la entidad relacionada. */
    public void setEntregaId(Entrega entregaId) {
        this.entregaId = entregaId;
    }

    /** Obtiene la entidad relacionada. */
    public Perfil getAutorId() {
        return autorId;
    }

    /** Establece la entidad relacionada. */
    public void setAutorId(Perfil autorId) {
        this.autorId = autorId;
    }

    /** Obtiene la columna {@code mensaje}. */
    public String getMensaje() {
        return mensaje;
    }

    /** Establece la columna {@code mensaje}. */
    public void setMensaje(String mensaje) {
        this.mensaje = mensaje;
    }

    /** Obtiene la columna {@code visible_estudiante}. */
    public Boolean getVisibleEstudiante() {
        return visibleEstudiante;
    }

    /** Establece la columna {@code visible_estudiante}. */
    public void setVisibleEstudiante(Boolean visibleEstudiante) {
        this.visibleEstudiante = visibleEstudiante;
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
        if (!(o instanceof Retroalimentacion other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
