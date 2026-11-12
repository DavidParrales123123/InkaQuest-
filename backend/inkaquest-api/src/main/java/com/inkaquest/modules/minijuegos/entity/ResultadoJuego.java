package com.inkaquest.modules.minijuegos.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
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
 * Entidad JPA de la tabla {@code public.resultado_juego}.
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
@Table(name = "resultado_juego")
public class ResultadoJuego implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "intento_juego_id", referencedColumnName = "id")
    private IntentoJuego intentoJuegoId;

    @Column(name = "puntaje", precision = 10, scale = 2, nullable = false)
    private BigDecimal puntaje;

    @Column(name = "puntaje_maximo", precision = 10, scale = 2, nullable = false)
    private BigDecimal puntajeMaximo;

    @Column(name = "precision", precision = 5, scale = 2, nullable = true)
    private BigDecimal precision;

    @Column(name = "completitud", precision = 5, scale = 2, nullable = true)
    private BigDecimal completitud;

    @Column(name = "aciertos", nullable = false)
    private Integer aciertos;

    @Column(name = "errores", nullable = false)
    private Integer errores;

    @Column(name = "estrellas", nullable = true)
    private Integer estrellas;

    @Column(name = "completado", nullable = false)
    private Boolean completado;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "desglose", columnDefinition = "jsonb", nullable = false)
    private Map<String, Object> desglose;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    /** Constructor vacoto requerido por JPA. */
    public ResultadoJuego() {
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

    /** Obtiene la columna {@code puntaje}. */
    public BigDecimal getPuntaje() {
        return puntaje;
    }

    /** Establece la columna {@code puntaje}. */
    public void setPuntaje(BigDecimal puntaje) {
        this.puntaje = puntaje;
    }

    /** Obtiene la columna {@code puntaje_maximo}. */
    public BigDecimal getPuntajeMaximo() {
        return puntajeMaximo;
    }

    /** Establece la columna {@code puntaje_maximo}. */
    public void setPuntajeMaximo(BigDecimal puntajeMaximo) {
        this.puntajeMaximo = puntajeMaximo;
    }

    /** Obtiene la columna {@code precision}. */
    public BigDecimal getPrecision() {
        return precision;
    }

    /** Establece la columna {@code precision}. */
    public void setPrecision(BigDecimal precision) {
        this.precision = precision;
    }

    /** Obtiene la columna {@code completitud}. */
    public BigDecimal getCompletitud() {
        return completitud;
    }

    /** Establece la columna {@code completitud}. */
    public void setCompletitud(BigDecimal completitud) {
        this.completitud = completitud;
    }

    /** Obtiene la columna {@code aciertos}. */
    public Integer getAciertos() {
        return aciertos;
    }

    /** Establece la columna {@code aciertos}. */
    public void setAciertos(Integer aciertos) {
        this.aciertos = aciertos;
    }

    /** Obtiene la columna {@code errores}. */
    public Integer getErrores() {
        return errores;
    }

    /** Establece la columna {@code errores}. */
    public void setErrores(Integer errores) {
        this.errores = errores;
    }

    /** Obtiene la columna {@code estrellas}. */
    public Integer getEstrellas() {
        return estrellas;
    }

    /** Establece la columna {@code estrellas}. */
    public void setEstrellas(Integer estrellas) {
        this.estrellas = estrellas;
    }

    /** Obtiene la columna {@code completado}. */
    public Boolean getCompletado() {
        return completado;
    }

    /** Establece la columna {@code completado}. */
    public void setCompletado(Boolean completado) {
        this.completado = completado;
    }

    /** Obtiene la columna {@code desglose}. */
    public Map<String, Object> getDesglose() {
        return desglose;
    }

    /** Establece la columna {@code desglose}. */
    public void setDesglose(Map<String, Object> desglose) {
        this.desglose = desglose;
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
        if (!(o instanceof ResultadoJuego other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
