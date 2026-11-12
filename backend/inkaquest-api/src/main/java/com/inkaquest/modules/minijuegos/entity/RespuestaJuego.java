package com.inkaquest.modules.minijuegos.entity;

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
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;
import jakarta.persistence.GenerationType;

/**
 * Entidad JPA de la tabla {@code public.respuesta_juego}.
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
@Table(name = "respuesta_juego")
public class RespuestaJuego implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "intento_juego_id", referencedColumnName = "id")
    private IntentoJuego intentoJuegoId;

    @Column(name = "pregunta_clave", nullable = false)
    private String preguntaClave;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "valor", columnDefinition = "jsonb", nullable = false)
    private Map<String, Object> valor;

    @Column(name = "es_correcta", nullable = true)
    private Boolean esCorrecta;

    @Column(name = "puntaje", precision = 8, scale = 2, nullable = false)
    private BigDecimal puntaje;

    @Column(name = "tiempo_ms", nullable = true)
    private Integer tiempoMs;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    /** Constructor vacoto requerido por JPA. */
    public RespuestaJuego() {
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

    /** Obtiene la columna {@code pregunta_clave}. */
    public String getPreguntaClave() {
        return preguntaClave;
    }

    /** Establece la columna {@code pregunta_clave}. */
    public void setPreguntaClave(String preguntaClave) {
        this.preguntaClave = preguntaClave;
    }

    /** Obtiene la columna {@code valor}. */
    public Map<String, Object> getValor() {
        return valor;
    }

    /** Establece la columna {@code valor}. */
    public void setValor(Map<String, Object> valor) {
        this.valor = valor;
    }

    /** Obtiene la columna {@code es_correcta}. */
    public Boolean getEsCorrecta() {
        return esCorrecta;
    }

    /** Establece la columna {@code es_correcta}. */
    public void setEsCorrecta(Boolean esCorrecta) {
        this.esCorrecta = esCorrecta;
    }

    /** Obtiene la columna {@code puntaje}. */
    public BigDecimal getPuntaje() {
        return puntaje;
    }

    /** Establece la columna {@code puntaje}. */
    public void setPuntaje(BigDecimal puntaje) {
        this.puntaje = puntaje;
    }

    /** Obtiene la columna {@code tiempo_ms}. */
    public Integer getTiempoMs() {
        return tiempoMs;
    }

    /** Establece la columna {@code tiempo_ms}. */
    public void setTiempoMs(Integer tiempoMs) {
        this.tiempoMs = tiempoMs;
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
        if (!(o instanceof RespuestaJuego other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
