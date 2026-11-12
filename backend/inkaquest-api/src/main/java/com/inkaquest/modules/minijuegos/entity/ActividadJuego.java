package com.inkaquest.modules.minijuegos.entity;

import com.inkaquest.modules.academico.entity.Curso;
import com.inkaquest.modules.academico.entity.Leccion;
import com.inkaquest.modules.evaluaciones.entity.Actividad;
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
 * Entidad JPA de la tabla {@code public.actividad_juego}.
 *
 * <p>Mapeo derivado del esquema real de PostgreSQL (proyecto
 * {@code nrfdifzechrjikrvzhdl}). La tabla pertenece al modulo
 * {@code minijuegos} y esta protegida por RLS: el acceso real depende
 * del contexto de autorizacion de la transaccion.</p>
 *
 * <p>El esquema de la base de datos es propiedad de las migraciones SQL
 * ({@code supabase/migrations}). Esta entidad NO genera el esquema: la
 * propiedad {@code ddl-auto} se fija en {@code none}.</p>
 */
@Entity
@Table(name = "actividad_juego")
public class ActividadJuego implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "juego_id", referencedColumnName = "id")
    private Juego juegoId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "leccion_id", referencedColumnName = "id")
    private Leccion leccionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "curso_id", referencedColumnName = "id")
    private Curso cursoId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actividad_id", referencedColumnName = "id")
    private Actividad actividadId;

    @Column(name = "titulo", nullable = false)
    private String titulo;

    @Column(name = "descripcion", nullable = true)
    private String descripcion;

    @Column(name = "orden", nullable = false)
    private Integer orden;

    @Column(name = "puntos", precision = 8, scale = 2, nullable = false)
    private BigDecimal puntos;

    @Column(name = "xp_otorgado", nullable = false)
    private Integer xpOtorgado;

    @Column(name = "intentos_permitidos", nullable = false)
    private Integer intentosPermitidos;

    @Column(name = "publicado", nullable = false)
    private Boolean publicado;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    @UpdateTimestamp
    @Column(name = "actualizado_en", nullable = false)
    private Instant actualizadoEn;

    /** Constructor vacoto requerido por JPA. */
    public ActividadJuego() {
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
    public Juego getJuegoId() {
        return juegoId;
    }

    /** Establece la entidad relacionada. */
    public void setJuegoId(Juego juegoId) {
        this.juegoId = juegoId;
    }

    /** Obtiene la entidad relacionada. */
    public Leccion getLeccionId() {
        return leccionId;
    }

    /** Establece la entidad relacionada. */
    public void setLeccionId(Leccion leccionId) {
        this.leccionId = leccionId;
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

    /** Obtiene la columna {@code orden}. */
    public Integer getOrden() {
        return orden;
    }

    /** Establece la columna {@code orden}. */
    public void setOrden(Integer orden) {
        this.orden = orden;
    }

    /** Obtiene la columna {@code puntos}. */
    public BigDecimal getPuntos() {
        return puntos;
    }

    /** Establece la columna {@code puntos}. */
    public void setPuntos(BigDecimal puntos) {
        this.puntos = puntos;
    }

    /** Obtiene la columna {@code xp_otorgado}. */
    public Integer getXpOtorgado() {
        return xpOtorgado;
    }

    /** Establece la columna {@code xp_otorgado}. */
    public void setXpOtorgado(Integer xpOtorgado) {
        this.xpOtorgado = xpOtorgado;
    }

    /** Obtiene la columna {@code intentos_permitidos}. */
    public Integer getIntentosPermitidos() {
        return intentosPermitidos;
    }

    /** Establece la columna {@code intentos_permitidos}. */
    public void setIntentosPermitidos(Integer intentosPermitidos) {
        this.intentosPermitidos = intentosPermitidos;
    }

    /** Obtiene la columna {@code publicado}. */
    public Boolean getPublicado() {
        return publicado;
    }

    /** Establece la columna {@code publicado}. */
    public void setPublicado(Boolean publicado) {
        this.publicado = publicado;
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
        if (!(o instanceof ActividadJuego other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
