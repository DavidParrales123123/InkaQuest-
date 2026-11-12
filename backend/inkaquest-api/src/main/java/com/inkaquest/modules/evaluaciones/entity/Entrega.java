package com.inkaquest.modules.evaluaciones.entity;

import com.inkaquest.modules.identidad.entity.Perfil;
import com.inkaquest.shared.enums.EstadoEntrega;
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
 * Entidad JPA de la tabla {@code public.entrega}.
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
@Table(name = "entrega")
public class Entrega implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tarea_id", referencedColumnName = "id")
    private Tarea tareaId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "estudiante_id", referencedColumnName = "id")
    private Perfil estudianteId;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "estado", columnDefinition = "estado_entrega", nullable = false)
    private EstadoEntrega estado;

    @Column(name = "contenido", nullable = true)
    private String contenido;

    @Column(name = "nota", precision = 8, scale = 2, nullable = true)
    private BigDecimal nota;

    @Column(name = "enviada_en", nullable = true)
    private Instant enviadaEn;

    @Column(name = "revisada_en", nullable = true)
    private Instant revisadaEn;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    @UpdateTimestamp
    @Column(name = "actualizado_en", nullable = false)
    private Instant actualizadoEn;

    /** Constructor vacoto requerido por JPA. */
    public Entrega() {
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
    public Tarea getTareaId() {
        return tareaId;
    }

    /** Establece la entidad relacionada. */
    public void setTareaId(Tarea tareaId) {
        this.tareaId = tareaId;
    }

    /** Obtiene la entidad relacionada. */
    public Perfil getEstudianteId() {
        return estudianteId;
    }

    /** Establece la entidad relacionada. */
    public void setEstudianteId(Perfil estudianteId) {
        this.estudianteId = estudianteId;
    }

    /** Obtiene la columna {@code estado}. */
    public EstadoEntrega getEstado() {
        return estado;
    }

    /** Establece la columna {@code estado}. */
    public void setEstado(EstadoEntrega estado) {
        this.estado = estado;
    }

    /** Obtiene la columna {@code contenido}. */
    public String getContenido() {
        return contenido;
    }

    /** Establece la columna {@code contenido}. */
    public void setContenido(String contenido) {
        this.contenido = contenido;
    }

    /** Obtiene la columna {@code nota}. */
    public BigDecimal getNota() {
        return nota;
    }

    /** Establece la columna {@code nota}. */
    public void setNota(BigDecimal nota) {
        this.nota = nota;
    }

    /** Obtiene la columna {@code enviada_en}. */
    public Instant getEnviadaEn() {
        return enviadaEn;
    }

    /** Establece la columna {@code enviada_en}. */
    public void setEnviadaEn(Instant enviadaEn) {
        this.enviadaEn = enviadaEn;
    }

    /** Obtiene la columna {@code revisada_en}. */
    public Instant getRevisadaEn() {
        return revisadaEn;
    }

    /** Establece la columna {@code revisada_en}. */
    public void setRevisadaEn(Instant revisadaEn) {
        this.revisadaEn = revisadaEn;
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
        if (!(o instanceof Entrega other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
