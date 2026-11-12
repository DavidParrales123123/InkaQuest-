package com.inkaquest.modules.minijuegos.entity;

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
 * Entidad JPA de la tabla {@code public.puntuacion_juego}.
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
@Table(name = "puntuacion_juego")
public class PuntuacionJuego implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "juego_id", referencedColumnName = "id")
    private Juego juegoId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", referencedColumnName = "id")
    private Perfil usuarioId;

    @Column(name = "mejor_puntaje", precision = 10, scale = 2, nullable = false)
    private BigDecimal mejorPuntaje;

    @Column(name = "partidas", nullable = false)
    private Integer partidas;

    @Column(name = "victorias", nullable = false)
    private Integer victorias;

    @Column(name = "mejor_tiempo_ms", nullable = true)
    private Integer mejorTiempoMs;

    @UpdateTimestamp
    @Column(name = "actualizado_en", nullable = false)
    private Instant actualizadoEn;

    /** Constructor vacoto requerido por JPA. */
    public PuntuacionJuego() {
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
    public Perfil getUsuarioId() {
        return usuarioId;
    }

    /** Establece la entidad relacionada. */
    public void setUsuarioId(Perfil usuarioId) {
        this.usuarioId = usuarioId;
    }

    /** Obtiene la columna {@code mejor_puntaje}. */
    public BigDecimal getMejorPuntaje() {
        return mejorPuntaje;
    }

    /** Establece la columna {@code mejor_puntaje}. */
    public void setMejorPuntaje(BigDecimal mejorPuntaje) {
        this.mejorPuntaje = mejorPuntaje;
    }

    /** Obtiene la columna {@code partidas}. */
    public Integer getPartidas() {
        return partidas;
    }

    /** Establece la columna {@code partidas}. */
    public void setPartidas(Integer partidas) {
        this.partidas = partidas;
    }

    /** Obtiene la columna {@code victorias}. */
    public Integer getVictorias() {
        return victorias;
    }

    /** Establece la columna {@code victorias}. */
    public void setVictorias(Integer victorias) {
        this.victorias = victorias;
    }

    /** Obtiene la columna {@code mejor_tiempo_ms}. */
    public Integer getMejorTiempoMs() {
        return mejorTiempoMs;
    }

    /** Establece la columna {@code mejor_tiempo_ms}. */
    public void setMejorTiempoMs(Integer mejorTiempoMs) {
        this.mejorTiempoMs = mejorTiempoMs;
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
        if (!(o instanceof PuntuacionJuego other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
