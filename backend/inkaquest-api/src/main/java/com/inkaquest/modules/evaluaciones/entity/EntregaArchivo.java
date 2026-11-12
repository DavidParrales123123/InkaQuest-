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
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import jakarta.persistence.GenerationType;

/**
 * Entidad JPA de la tabla {@code public.entrega_archivo}.
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
@Table(name = "entrega_archivo")
public class EntregaArchivo implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entrega_id", referencedColumnName = "id")
    private Entrega entregaId;

    @Column(name = "nombre", nullable = false)
    private String nombre;

    @Column(name = "ruta_storage", nullable = false)
    private String rutaStorage;

    @Column(name = "mime_type", nullable = true)
    private String mimeType;

    @Column(name = "tamano_bytes", nullable = true)
    private Long tamanoBytes;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    /** Constructor vacoto requerido por JPA. */
    public EntregaArchivo() {
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
    public Entrega getEntregaId() {
        return entregaId;
    }

    /** Establece la entidad relacionada. */
    public void setEntregaId(Entrega entregaId) {
        this.entregaId = entregaId;
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
        if (!(o instanceof EntregaArchivo other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
