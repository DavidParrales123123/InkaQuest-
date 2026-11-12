package com.inkaquest.modules.retos.entity;

import com.inkaquest.shared.enums.EstadoEjecucion;
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
 * Entidad JPA de la tabla {@code public.resultado_caso}.
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
@Table(name = "resultado_caso")
public class ResultadoCaso implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "envio_id", referencedColumnName = "id")
    private EnvioReto envioId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "caso_prueba_id", referencedColumnName = "id")
    private CasoPrueba casoPruebaId;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "estado", columnDefinition = "estado_ejecucion", nullable = false)
    private EstadoEjecucion estado;

    @Column(name = "salida_obtenida", nullable = true)
    private String salidaObtenida;

    @Column(name = "tiempo_ms", nullable = true)
    private Integer tiempoMs;

    @Column(name = "memoria_usada_mb", nullable = true)
    private Integer memoriaUsadaMb;

    @Column(name = "puntaje", precision = 8, scale = 2, nullable = false)
    private BigDecimal puntaje;

    @Column(name = "mensaje_error", nullable = true)
    private String mensajeError;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    /** Constructor vacoto requerido por JPA. */
    public ResultadoCaso() {
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
    public EnvioReto getEnvioId() {
        return envioId;
    }

    /** Establece la entidad relacionada. */
    public void setEnvioId(EnvioReto envioId) {
        this.envioId = envioId;
    }

    /** Obtiene la entidad relacionada. */
    public CasoPrueba getCasoPruebaId() {
        return casoPruebaId;
    }

    /** Establece la entidad relacionada. */
    public void setCasoPruebaId(CasoPrueba casoPruebaId) {
        this.casoPruebaId = casoPruebaId;
    }

    /** Obtiene la columna {@code estado}. */
    public EstadoEjecucion getEstado() {
        return estado;
    }

    /** Establece la columna {@code estado}. */
    public void setEstado(EstadoEjecucion estado) {
        this.estado = estado;
    }

    /** Obtiene la columna {@code salida_obtenida}. */
    public String getSalidaObtenida() {
        return salidaObtenida;
    }

    /** Establece la columna {@code salida_obtenida}. */
    public void setSalidaObtenida(String salidaObtenida) {
        this.salidaObtenida = salidaObtenida;
    }

    /** Obtiene la columna {@code tiempo_ms}. */
    public Integer getTiempoMs() {
        return tiempoMs;
    }

    /** Establece la columna {@code tiempo_ms}. */
    public void setTiempoMs(Integer tiempoMs) {
        this.tiempoMs = tiempoMs;
    }

    /** Obtiene la columna {@code memoria_usada_mb}. */
    public Integer getMemoriaUsadaMb() {
        return memoriaUsadaMb;
    }

    /** Establece la columna {@code memoria_usada_mb}. */
    public void setMemoriaUsadaMb(Integer memoriaUsadaMb) {
        this.memoriaUsadaMb = memoriaUsadaMb;
    }

    /** Obtiene la columna {@code puntaje}. */
    public BigDecimal getPuntaje() {
        return puntaje;
    }

    /** Establece la columna {@code puntaje}. */
    public void setPuntaje(BigDecimal puntaje) {
        this.puntaje = puntaje;
    }

    /** Obtiene la columna {@code mensaje_error}. */
    public String getMensajeError() {
        return mensajeError;
    }

    /** Establece la columna {@code mensaje_error}. */
    public void setMensajeError(String mensajeError) {
        this.mensajeError = mensajeError;
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
        if (!(o instanceof ResultadoCaso other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
