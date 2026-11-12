package com.inkaquest.modules.academico.entity;

import com.inkaquest.shared.enums.TipoContenido;
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
 * Entidad JPA de la tabla {@code public.leccion}.
 *
 * <p>Mapeo derivado del esquema real de PostgreSQL (proyecto
 * {@code nrfdifzechrjikrvzhdl}). La tabla pertenece al modulo
 * {@code academico} y esta protegida por RLS: el acceso real depende
 * del contexto de autorizacion de la transaccion.</p>
 *
 * <p>El esquema de la base de datos es propiedad de las migraciones SQL
 * ({@code supabase/migrations}). Esta entidad NO genera el esquema: la
 * propiedad {@code ddl-auto} se fija en {@code none}.</p>
 */
@Entity
@Table(name = "leccion")
public class Leccion implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "modulo_id", referencedColumnName = "id")
    private Modulo moduloId;

    @Column(name = "numero", nullable = false)
    private Integer numero;

    @Column(name = "titulo", nullable = false)
    private String titulo;

    @Column(name = "descripcion", nullable = true)
    private String descripcion;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "tipo_contenido", columnDefinition = "tipo_contenido", nullable = false)
    private TipoContenido tipoContenido;

    @Column(name = "duracion_minutos", nullable = false)
    private Integer duracionMinutos;

    @Column(name = "xp_otorgado", nullable = false)
    private Integer xpOtorgado;

    @Column(name = "publicado", nullable = false)
    private Boolean publicado;

    @Column(name = "requerido_aprobacion", nullable = false)
    private Boolean requeridoAprobacion;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    @UpdateTimestamp
    @Column(name = "actualizado_en", nullable = false)
    private Instant actualizadoEn;

    /** Constructor vacoto requerido por JPA. */
    public Leccion() {
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
    public Modulo getModuloId() {
        return moduloId;
    }

    /** Establece la entidad relacionada. */
    public void setModuloId(Modulo moduloId) {
        this.moduloId = moduloId;
    }

    /** Obtiene la columna {@code numero}. */
    public Integer getNumero() {
        return numero;
    }

    /** Establece la columna {@code numero}. */
    public void setNumero(Integer numero) {
        this.numero = numero;
    }

    /** Obtiene la columna {@code titulo}. */
    public String getTitulo() {
        return titulo;
    }

    /** Establece la columna {@code titulo}. */
    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    /** Obtiene la columna {@code descripcion}. */
    public String getDescripcion() {
        return descripcion;
    }

    /** Establece la columna {@code descripcion}. */
    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    /** Obtiene la columna {@code tipo_contenido}. */
    public TipoContenido getTipoContenido() {
        return tipoContenido;
    }

    /** Establece la columna {@code tipo_contenido}. */
    public void setTipoContenido(TipoContenido tipoContenido) {
        this.tipoContenido = tipoContenido;
    }

    /** Obtiene la columna {@code duracion_minutos}. */
    public Integer getDuracionMinutos() {
        return duracionMinutos;
    }

    /** Establece la columna {@code duracion_minutos}. */
    public void setDuracionMinutos(Integer duracionMinutos) {
        this.duracionMinutos = duracionMinutos;
    }

    /** Obtiene la columna {@code xp_otorgado}. */
    public Integer getXpOtorgado() {
        return xpOtorgado;
    }

    /** Establece la columna {@code xp_otorgado}. */
    public void setXpOtorgado(Integer xpOtorgado) {
        this.xpOtorgado = xpOtorgado;
    }

    /** Obtiene la columna {@code publicado}. */
    public Boolean getPublicado() {
        return publicado;
    }

    /** Establece la columna {@code publicado}. */
    public void setPublicado(Boolean publicado) {
        this.publicado = publicado;
    }

    /** Obtiene la columna {@code requerido_aprobacion}. */
    public Boolean getRequeridoAprobacion() {
        return requeridoAprobacion;
    }

    /** Establece la columna {@code requerido_aprobacion}. */
    public void setRequeridoAprobacion(Boolean requeridoAprobacion) {
        this.requeridoAprobacion = requeridoAprobacion;
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
        if (!(o instanceof Leccion other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
