package com.inkaquest.modules.minijuegos.entity;

import com.inkaquest.modules.identidad.entity.Perfil;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;
import jakarta.persistence.GenerationType;

/**
 * Entidad JPA de la tabla {@code public.finalizacion_juego}.
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
@Table(name = "finalizacion_juego")
public class FinalizacionJuego implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "intento_juego_id", referencedColumnName = "id")
    private IntentoJuego intentoJuegoId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", referencedColumnName = "id")
    private Perfil usuarioId;

    @Column(name = "duracion_total_ms", nullable = false)
    private Integer duracionTotalMs;

    @Column(name = "tiempo_activo_ms", nullable = false)
    private Integer tiempoActivoMs;

    @Column(name = "pausas", nullable = false)
    private Integer pausas;

    @Column(name = "motivo_fin", nullable = false)
    private String motivoFin;

    @Column(name = "finalized_en", nullable = false)
    private Instant finalizedEn;

    /** Constructor vacoto requerido por JPA. */
    public FinalizacionJuego() {
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
    public IntentoJuego getIntentoJuegoId() {
        return intentoJuegoId;
    }

    /** Establece la entidad relacionada. */
    public void setIntentoJuegoId(IntentoJuego intentoJuegoId) {
        this.intentoJuegoId = intentoJuegoId;
    }

    /** Obtiene la entidad relacionada. */
    public Perfil getUsuarioId() {
        return usuarioId;
    }

    /** Establece la entidad relacionada. */
    public void setUsuarioId(Perfil usuarioId) {
        this.usuarioId = usuarioId;
    }

    /** Obtiene la columna {@code duracion_total_ms}. */
    public Integer getDuracionTotalMs() {
        return duracionTotalMs;
    }

    /** Establece la columna {@code duracion_total_ms}. */
    public void setDuracionTotalMs(Integer duracionTotalMs) {
        this.duracionTotalMs = duracionTotalMs;
    }

    /** Obtiene la columna {@code tiempo_activo_ms}. */
    public Integer getTiempoActivoMs() {
        return tiempoActivoMs;
    }

    /** Establece la columna {@code tiempo_activo_ms}. */
    public void setTiempoActivoMs(Integer tiempoActivoMs) {
        this.tiempoActivoMs = tiempoActivoMs;
    }

    /** Obtiene la columna {@code pausas}. */
    public Integer getPausas() {
        return pausas;
    }

    /** Establece la columna {@code pausas}. */
    public void setPausas(Integer pausas) {
        this.pausas = pausas;
    }

    /** Obtiene la columna {@code motivo_fin}. */
    public String getMotivoFin() {
        return motivoFin;
    }

    /** Establece la columna {@code motivo_fin}. */
    public void setMotivoFin(String motivoFin) {
        this.motivoFin = motivoFin;
    }

    /** Obtiene la columna {@code finalized_en}. */
    public Instant getFinalizedEn() {
        return finalizedEn;
    }

    /** Establece la columna {@code finalized_en}. */
    public void setFinalizedEn(Instant finalizedEn) {
        this.finalizedEn = finalizedEn;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof FinalizacionJuego other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
