package com.inkaquest.modules.academico.entity;

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
import org.hibernate.annotations.UpdateTimestamp;
import jakarta.persistence.GenerationType;

/**
 * Entidad JPA de la tabla {@code public.material_descargable}.
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
@Table(name = "material_descargable")
public class MaterialDescargable implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recurso_id", referencedColumnName = "id")
    private Recurso recursoId;

    @Column(name = "nombre", nullable = false)
    private String nombre;

    @Column(name = "ruta_storage", nullable = false)
    private String rutaStorage;

    @Column(name = "mime_type", nullable = true)
    private String mimeType;

    @Column(name = "tamano_bytes", nullable = true)
    private Long tamanoBytes;

    @Column(name = "hash_sha256", nullable = true)
    private String hashSha256;

    @Column(name = "max_descargas", nullable = true)
    private Integer maxDescargas;

    @Column(name = "descargas", nullable = false)
    private Integer descargas;

    @Column(name = "requiere_matricula", nullable = false)
    private Boolean requiereMatricula;

    @Column(name = "expira_en", nullable = true)
    private Instant expiraEn;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    @UpdateTimestamp
    @Column(name = "actualizado_en", nullable = false)
    private Instant actualizadoEn;

    /** Constructor vacoto requerido por JPA. */
    public MaterialDescargable() {
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
    public Recurso getRecursoId() {
        return recursoId;
    }

    /** Establece la entidad relacionada. */
    public void setRecursoId(Recurso recursoId) {
        this.recursoId = recursoId;
    }

    /** Obtiene la columna {@code nombre}. */
    public String getNombre() {
        return nombre;
    }

    /** Establece la columna {@code nombre}. */
    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    /** Obtiene la columna {@code ruta_storage}. */
    public String getRutaStorage() {
        return rutaStorage;
    }

    /** Establece la columna {@code ruta_storage}. */
    public void setRutaStorage(String rutaStorage) {
        this.rutaStorage = rutaStorage;
    }

    /** Obtiene la columna {@code mime_type}. */
    public String getMimeType() {
        return mimeType;
    }

    /** Establece la columna {@code mime_type}. */
    public void setMimeType(String mimeType) {
        this.mimeType = mimeType;
    }

    /** Obtiene la columna {@code tamano_bytes}. */
    public Long getTamanoBytes() {
        return tamanoBytes;
    }

    /** Establece la columna {@code tamano_bytes}. */
    public void setTamanoBytes(Long tamanoBytes) {
        this.tamanoBytes = tamanoBytes;
    }

    /** Obtiene la columna {@code hash_sha256}. */
    public String getHashSha256() {
        return hashSha256;
    }

    /** Establece la columna {@code hash_sha256}. */
    public void setHashSha256(String hashSha256) {
        this.hashSha256 = hashSha256;
    }

    /** Obtiene la columna {@code max_descargas}. */
    public Integer getMaxDescargas() {
        return maxDescargas;
    }

    /** Establece la columna {@code max_descargas}. */
    public void setMaxDescargas(Integer maxDescargas) {
        this.maxDescargas = maxDescargas;
    }

    /** Obtiene la columna {@code descargas}. */
    public Integer getDescargas() {
        return descargas;
    }

    /** Establece la columna {@code descargas}. */
    public void setDescargas(Integer descargas) {
        this.descargas = descargas;
    }

    /** Obtiene la columna {@code requiere_matricula}. */
    public Boolean getRequiereMatricula() {
        return requiereMatricula;
    }

    /** Establece la columna {@code requiere_matricula}. */
    public void setRequiereMatricula(Boolean requiereMatricula) {
        this.requiereMatricula = requiereMatricula;
    }

    /** Obtiene la columna {@code expira_en}. */
    public Instant getExpiraEn() {
        return expiraEn;
    }

    /** Establece la columna {@code expira_en}. */
    public void setExpiraEn(Instant expiraEn) {
        this.expiraEn = expiraEn;
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
        if (!(o instanceof MaterialDescargable other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
