package com.inkaquest.modules.academico.entity;

import com.inkaquest.shared.enums.TipoRecurso;
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
 * Entidad JPA de la tabla {@code public.recurso}.
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
@Table(name = "recurso")
public class Recurso implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "leccion_id", referencedColumnName = "id")
    private Leccion leccionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contenido_id", referencedColumnName = "id")
    private Contenido contenidoId;

    @Column(name = "nombre", nullable = false)
    private String nombre;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "tipo", columnDefinition = "tipo_recurso", nullable = false)
    private TipoRecurso tipo;

    @Column(name = "url", nullable = true)
    private String url;

    @Column(name = "ruta_storage", nullable = true)
    private String rutaStorage;

    @Column(name = "tamano_bytes", nullable = true)
    private Long tamanoBytes;

    @Column(name = "mime_type", nullable = true)
    private String mimeType;

    @Column(name = "descargable", nullable = false)
    private Boolean descargable;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    @UpdateTimestamp
    @Column(name = "actualizado_en", nullable = false)
    private Instant actualizadoEn;

    /** Constructor vacoto requerido por JPA. */
    public Recurso() {
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
    public Leccion getLeccionId() {
        return leccionId;
    }

    /** Establece la entidad relacionada. */
    public void setLeccionId(Leccion leccionId) {
        this.leccionId = leccionId;
    }

    /** Obtiene la entidad relacionada. */
    public Contenido getContenidoId() {
        return contenidoId;
    }

    /** Establece la entidad relacionada. */
    public void setContenidoId(Contenido contenidoId) {
        this.contenidoId = contenidoId;
    }

    /** Obtiene la columna {@code nombre}. */
    public String getNombre() {
        return nombre;
    }

    /** Establece la columna {@code nombre}. */
    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    /** Obtiene la columna {@code tipo}. */
    public TipoRecurso getTipo() {
        return tipo;
    }

    /** Establece la columna {@code tipo}. */
    public void setTipo(TipoRecurso tipo) {
        this.tipo = tipo;
    }

    /** Obtiene la columna {@code url}. */
    public String getUrl() {
        return url;
    }

    /** Establece la columna {@code url}. */
    public void setUrl(String url) {
        this.url = url;
    }

    /** Obtiene la columna {@code ruta_storage}. */
    public String getRutaStorage() {
        return rutaStorage;
    }

    /** Establece la columna {@code ruta_storage}. */
    public void setRutaStorage(String rutaStorage) {
        this.rutaStorage = rutaStorage;
    }

    /** Obtiene la columna {@code tamano_bytes}. */
    public Long getTamanoBytes() {
        return tamanoBytes;
    }

    /** Establece la columna {@code tamano_bytes}. */
    public void setTamanoBytes(Long tamanoBytes) {
        this.tamanoBytes = tamanoBytes;
    }

    /** Obtiene la columna {@code mime_type}. */
    public String getMimeType() {
        return mimeType;
    }

    /** Establece la columna {@code mime_type}. */
    public void setMimeType(String mimeType) {
        this.mimeType = mimeType;
    }

    /** Obtiene la columna {@code descargable}. */
    public Boolean getDescargable() {
        return descargable;
    }

    /** Establece la columna {@code descargable}. */
    public void setDescargable(Boolean descargable) {
        this.descargable = descargable;
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
        if (!(o instanceof Recurso other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
