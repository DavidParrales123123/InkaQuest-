package com.inkaquest.modules.retos.entity;

import com.inkaquest.modules.identidad.entity.Perfil;
import com.inkaquest.shared.enums.EstadoEnvio;
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
 * Entidad JPA de la tabla {@code public.envio_reto}.
 *
 * <p>Mapeo derivado del esquema real de PostgreSQL (proyecto
 * {@code nrfdifzechrjikrvzhdl}). La tabla pertenece al modulo
 * {@code retos} y esta protegida por RLS: el acceso real depende
 * del contexto de autorizacion de la transaccion.</p>
 *
 * <p>El esquema de la base de datos es propiedad de las migraciones SQL
 * ({@code supabase/migrations}). Esta entidad NO genera el esquema: la
 * propiedad {@code ddl-auto} se fija en {@code none}.</p>
 */
@Entity
@Table(name = "envio_reto")
public class EnvioReto implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reto_id", referencedColumnName = "id")
    private Reto retoId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "estudiante_id", referencedColumnName = "id")
    private Perfil estudianteId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lenguaje_id", referencedColumnName = "id")
    private Lenguaje lenguajeId;

    @Column(name = "codigo", nullable = false)
    private String codigo;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "estado", columnDefinition = "estado_envio", nullable = false)
    private EstadoEnvio estado;

    @Column(name = "puntaje", precision = 8, scale = 2, nullable = false)
    private BigDecimal puntaje;

    @Column(name = "puntaje_maximo", precision = 8, scale = 2, nullable = false)
    private BigDecimal puntajeMaximo;

    @Column(name = "aprobado", nullable = true)
    private Boolean aprobado;

    @Column(name = "tiempo_total_ms", nullable = true)
    private Integer tiempoTotalMs;

    @Column(name = "clave_idempotencia", nullable = true)
    private String claveIdempotencia;

    @Column(name = "error_mensaje", nullable = true)
    private String errorMensaje;

    @Column(name = "ejecucion_externa_id", nullable = true)
    private String ejecucionExternaId;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    @UpdateTimestamp
    @Column(name = "actualizado_en", nullable = false)
    private Instant actualizadoEn;

    /** Constructor vacoto requerido por JPA. */
    public EnvioReto() {
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
    public Reto getRetoId() {
        return retoId;
    }

    /** Establece la entidad relacionada. */
    public void setRetoId(Reto retoId) {
        this.retoId = retoId;
    }

    /** Obtiene la entidad relacionada. */
    public Perfil getEstudianteId() {
        return estudianteId;
    }

    /** Establece la entidad relacionada. */
    public void setEstudianteId(Perfil estudianteId) {
        this.estudianteId = estudianteId;
    }

    /** Obtiene la entidad relacionada. */
    public Lenguaje getLenguajeId() {
        return lenguajeId;
    }

    /** Establece la entidad relacionada. */
    public void setLenguajeId(Lenguaje lenguajeId) {
        this.lenguajeId = lenguajeId;
    }

    /** Obtiene la columna {@code codigo}. */
    public String getCodigo() {
        return codigo;
    }

    /** Establece la columna {@code codigo}. */
    public void setCodigo(String codigo) {
        this.codigo = codigo;
    }

    /** Obtiene la columna {@code estado}. */
    public EstadoEnvio getEstado() {
        return estado;
    }

    /** Establece la columna {@code estado}. */
    public void setEstado(EstadoEnvio estado) {
        this.estado = estado;
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

    /** Obtiene la columna {@code aprobado}. */
    public Boolean getAprobado() {
        return aprobado;
    }

    /** Establece la columna {@code aprobado}. */
    public void setAprobado(Boolean aprobado) {
        this.aprobado = aprobado;
    }

    /** Obtiene la columna {@code tiempo_total_ms}. */
    public Integer getTiempoTotalMs() {
        return tiempoTotalMs;
    }

    /** Establece la columna {@code tiempo_total_ms}. */
    public void setTiempoTotalMs(Integer tiempoTotalMs) {
        this.tiempoTotalMs = tiempoTotalMs;
    }

    /** Obtiene la columna {@code clave_idempotencia}. */
    public String getClaveIdempotencia() {
        return claveIdempotencia;
    }

    /** Establece la columna {@code clave_idempotencia}. */
    public void setClaveIdempotencia(String claveIdempotencia) {
        this.claveIdempotencia = claveIdempotencia;
    }

    /** Obtiene la columna {@code error_mensaje}. */
    public String getErrorMensaje() {
        return errorMensaje;
    }

    /** Establece la columna {@code error_mensaje}. */
    public void setErrorMensaje(String errorMensaje) {
        this.errorMensaje = errorMensaje;
    }

    /** Obtiene la columna {@code ejecucion_externa_id}. */
    public String getEjecucionExternaId() {
        return ejecucionExternaId;
    }

    /** Establece la columna {@code ejecucion_externa_id}. */
    public void setEjecucionExternaId(String ejecucionExternaId) {
        this.ejecucionExternaId = ejecucionExternaId;
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
        if (!(o instanceof EnvioReto other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
