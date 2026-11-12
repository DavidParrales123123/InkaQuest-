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
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import jakarta.persistence.GenerationType;

/**
 * Entidad JPA de la tabla {@code public.respuesta_evaluacion}.
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
@Table(name = "respuesta_evaluacion")
public class RespuestaEvaluacion implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "intento_id", referencedColumnName = "id")
    private IntentoEvaluacion intentoId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pregunta_id", referencedColumnName = "id")
    private Pregunta preguntaId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "opcion_id", referencedColumnName = "id")
    private Opcion opcionId;

    @Column(name = "texto_respuesta", nullable = true)
    private String textoRespuesta;

    @Column(name = "es_correcta", nullable = true)
    private Boolean esCorrecta;

    @Column(name = "puntaje_otorgado", precision = 8, scale = 2, nullable = false)
    private BigDecimal puntajeOtorgado;

    @Column(name = "retroalimentacion", nullable = true)
    private String retroalimentacion;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    @UpdateTimestamp
    @Column(name = "actualizado_en", nullable = false)
    private Instant actualizadoEn;

    /** Constructor vacoto requerido por JPA. */
    public RespuestaEvaluacion() {
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
    public IntentoEvaluacion getIntentoId() {
        return intentoId;
    }

    /** Establece la entidad relacionada. */
    public void setIntentoId(IntentoEvaluacion intentoId) {
        this.intentoId = intentoId;
    }

    /** Obtiene la entidad relacionada. */
    public Pregunta getPreguntaId() {
        return preguntaId;
    }

    /** Establece la entidad relacionada. */
    public void setPreguntaId(Pregunta preguntaId) {
        this.preguntaId = preguntaId;
    }

    /** Obtiene la entidad relacionada. */
    public Opcion getOpcionId() {
        return opcionId;
    }

    /** Establece la entidad relacionada. */
    public void setOpcionId(Opcion opcionId) {
        this.opcionId = opcionId;
    }

    /** Obtiene la columna {@code texto_respuesta}. */
    public String getTextoRespuesta() {
        return textoRespuesta;
    }

    /** Establece la columna {@code texto_respuesta}. */
    public void setTextoRespuesta(String textoRespuesta) {
        this.textoRespuesta = textoRespuesta;
    }

    /** Obtiene la columna {@code es_correcta}. */
    public Boolean getEsCorrecta() {
        return esCorrecta;
    }

    /** Establece la columna {@code es_correcta}. */
    public void setEsCorrecta(Boolean esCorrecta) {
        this.esCorrecta = esCorrecta;
    }

    /** Obtiene la columna {@code puntaje_otorgado}. */
    public BigDecimal getPuntajeOtorgado() {
        return puntajeOtorgado;
    }

    /** Establece la columna {@code puntaje_otorgado}. */
    public void setPuntajeOtorgado(BigDecimal puntajeOtorgado) {
        this.puntajeOtorgado = puntajeOtorgado;
    }

    /** Obtiene la columna {@code retroalimentacion}. */
    public String getRetroalimentacion() {
        return retroalimentacion;
    }

    /** Establece la columna {@code retroalimentacion}. */
    public void setRetroalimentacion(String retroalimentacion) {
        this.retroalimentacion = retroalimentacion;
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
        if (!(o instanceof RespuestaEvaluacion other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
