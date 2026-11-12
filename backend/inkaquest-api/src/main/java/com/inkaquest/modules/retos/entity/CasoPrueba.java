package com.inkaquest.modules.retos.entity;

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
 * Entidad JPA de la tabla {@code public.caso_prueba}.
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
@Table(name = "caso_prueba")
public class CasoPrueba implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reto_id", referencedColumnName = "id")
    private Reto retoId;

    @Column(name = "orden", nullable = false)
    private Integer orden;

    @Column(name = "entrada", nullable = false)
    private String entrada;

    @Column(name = "salida_esperada", nullable = false)
    private String salidaEsperada;

    @Column(name = "es_oculto", nullable = false)
    private Boolean esOculto;

    @Column(name = "es_ejemplo", nullable = false)
    private Boolean esEjemplo;

    @Column(name = "tiempo_limite_seg", nullable = true)
    private Integer tiempoLimiteSeg;

    @Column(name = "memoria_limite_mb", nullable = true)
    private Integer memoriaLimiteMb;

    @Column(name = "peso", precision = 5, scale = 2, nullable = false)
    private BigDecimal peso;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    /** Constructor vacoto requerido por JPA. */
    public CasoPrueba() {
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

    /** Obtiene la columna {@code orden}. */
    public Integer getOrden() {
        return orden;
    }

    /** Establece la columna {@code orden}. */
    public void setOrden(Integer orden) {
        this.orden = orden;
    }

    /** Obtiene la columna {@code entrada}. */
    public String getEntrada() {
        return entrada;
    }

    /** Establece la columna {@code entrada}. */
    public void setEntrada(String entrada) {
        this.entrada = entrada;
    }

    /** Obtiene la columna {@code salida_esperada}. */
    public String getSalidaEsperada() {
        return salidaEsperada;
    }

    /** Establece la columna {@code salida_esperada}. */
    public void setSalidaEsperada(String salidaEsperada) {
        this.salidaEsperada = salidaEsperada;
    }

    /** Obtiene la columna {@code es_oculto}. */
    public Boolean getEsOculto() {
        return esOculto;
    }

    /** Establece la columna {@code es_oculto}. */
    public void setEsOculto(Boolean esOculto) {
        this.esOculto = esOculto;
    }

    /** Obtiene la columna {@code es_ejemplo}. */
    public Boolean getEsEjemplo() {
        return esEjemplo;
    }

    /** Establece la columna {@code es_ejemplo}. */
    public void setEsEjemplo(Boolean esEjemplo) {
        this.esEjemplo = esEjemplo;
    }

    /** Obtiene la columna {@code tiempo_limite_seg}. */
    public Integer getTiempoLimiteSeg() {
        return tiempoLimiteSeg;
    }

    /** Establece la columna {@code tiempo_limite_seg}. */
    public void setTiempoLimiteSeg(Integer tiempoLimiteSeg) {
        this.tiempoLimiteSeg = tiempoLimiteSeg;
    }

    /** Obtiene la columna {@code memoria_limite_mb}. */
    public Integer getMemoriaLimiteMb() {
        return memoriaLimiteMb;
    }

    /** Establece la columna {@code memoria_limite_mb}. */
    public void setMemoriaLimiteMb(Integer memoriaLimiteMb) {
        this.memoriaLimiteMb = memoriaLimiteMb;
    }

    /** Obtiene la columna {@code peso}. */
    public BigDecimal getPeso() {
        return peso;
    }

    /** Establece la columna {@code peso}. */
    public void setPeso(BigDecimal peso) {
        this.peso = peso;
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
        if (!(o instanceof CasoPrueba other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
