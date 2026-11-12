package com.inkaquest.modules.minijuegos.entity;

import com.inkaquest.modules.identidad.entity.Perfil;
import com.inkaquest.shared.enums.EstadoIntentoJuego;
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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;
import jakarta.persistence.GenerationType;

/**
 * Entidad JPA de la tabla {@code public.intento_juego}.
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
@Table(name = "intento_juego")
public class IntentoJuego implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actividad_juego_id", referencedColumnName = "id")
    private ActividadJuego actividadJuegoId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "estudiante_id", referencedColumnName = "id")
    private Perfil estudianteId;

    @Column(name = "numero", nullable = false)
    private Integer numero;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "estado", columnDefinition = "estado_intento_juego", nullable = false)
    private EstadoIntentoJuego estado;

    @Column(name = "clave_idempotencia", nullable = false)
    private String claveIdempotencia;

    @Column(name = "duracion_ms", nullable = true)
    private Integer duracionMs;

    @Column(name = "iniciado_en", nullable = false)
    private Instant iniciadoEn;

    @Column(name = "finalizado_en", nullable = true)
    private Instant finalizadoEn;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    @UpdateTimestamp
    @Column(name = "actualizado_en", nullable = false)
    private Instant actualizadoEn;

    /** Constructor vacoto requerido por JPA. */
    public IntentoJuego() {
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
    public ActividadJuego getActividadJuegoId() {
        return actividadJuegoId;
    }

    /** Establece la entidad relacionada. */
    public void setActividadJuegoId(ActividadJuego actividadJuegoId) {
        this.actividadJuegoId = actividadJuegoId;
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
    public EstadoIntentoJuego getEstado() {
        return estado;
    }

    /** Establece la columna {@code estado}. */
    public void setEstado(EstadoIntentoJuego estado) {
        this.estado = estado;
    }

    /** Obtiene la columna {@code clave_idempotencia}. */
    public String getClaveIdempotencia() {
        return claveIdempotencia;
    }

    /** Establece la columna {@code clave_idempotencia}. */
    public void setClaveIdempotencia(String claveIdempotencia) {
        this.claveIdempotencia = claveIdempotencia;
    }

    /** Obtiene la columna {@code duracion_ms}. */
    public Integer getDuracionMs() {
        return duracionMs;
    }

    /** Establece la columna {@code duracion_ms}. */
    public void setDuracionMs(Integer duracionMs) {
        this.duracionMs = duracionMs;
    }

    /** Obtiene la columna {@code iniciado_en}. */
    public Instant getIniciadoEn() {
        return iniciadoEn;
    }

    /** Establece la columna {@code iniciado_en}. */
    public void setIniciadoEn(Instant iniciadoEn) {
        this.iniciadoEn = iniciadoEn;
    }

    /** Obtiene la columna {@code finalizado_en}. */
    public Instant getFinalizadoEn() {
        return finalizadoEn;
    }

    /** Establece la columna {@code finalizado_en}. */
    public void setFinalizadoEn(Instant finalizadoEn) {
        this.finalizadoEn = finalizadoEn;
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
        if (!(o instanceof IntentoJuego other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
