package com.inkaquest.modules.evaluaciones.entity;

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
import jakarta.persistence.GenerationType;

/**
 * Entidad JPA de la tabla {@code public.opcion}.
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
@Table(name = "opcion")
public class Opcion implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pregunta_id", referencedColumnName = "id")
    private Pregunta preguntaId;

    @Column(name = "orden", nullable = false)
    private Integer orden;

    @Column(name = "texto", nullable = false)
    private String texto;

    @Column(name = "es_correcta", nullable = false)
    private Boolean esCorrecta;

    @Column(name = "valor", nullable = true)
    private String valor;

    @Column(name = "created_en", nullable = false)
    private Instant createdEn;

    /** Constructor vacoto requerido por JPA. */
    public Opcion() {
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
    public Pregunta getPreguntaId() {
        return preguntaId;
    }

    /** Establece la entidad relacionada. */
    public void setPreguntaId(Pregunta preguntaId) {
        this.preguntaId = preguntaId;
    }

    /** Obtiene la columna {@code orden}. */
    public Integer getOrden() {
        return orden;
    }

    /** Establece la columna {@code orden}. */
    public void setOrden(Integer orden) {
        this.orden = orden;
    }

    /** Obtiene la columna {@code texto}. */
    public String getTexto() {
        return texto;
    }

    /** Establece la columna {@code texto}. */
    public void setTexto(String texto) {
        this.texto = texto;
    }

    /** Obtiene la columna {@code es_correcta}. */
    public Boolean getEsCorrecta() {
        return esCorrecta;
    }

    /** Establece la columna {@code es_correcta}. */
    public void setEsCorrecta(Boolean esCorrecta) {
        this.esCorrecta = esCorrecta;
    }

    /** Obtiene la columna {@code valor}. */
    public String getValor() {
        return valor;
    }

    /** Establece la columna {@code valor}. */
    public void setValor(String valor) {
        this.valor = valor;
    }

    /** Obtiene la columna {@code created_en}. */
    public Instant getCreatedEn() {
        return createdEn;
    }

    /** Establece la columna {@code created_en}. */
    public void setCreatedEn(Instant createdEn) {
        this.createdEn = createdEn;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof Opcion other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
