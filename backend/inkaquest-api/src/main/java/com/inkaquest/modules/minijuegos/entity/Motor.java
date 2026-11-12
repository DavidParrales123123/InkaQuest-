package com.inkaquest.modules.minijuegos.entity;

import com.inkaquest.shared.enums.EstadoMotor;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
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
 * Entidad JPA de la tabla {@code public.motor}.
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
@Table(name = "motor")
public class Motor implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @Column(name = "codigo", nullable = false)
    private String codigo;

    @Column(name = "nombre", nullable = false)
    private String nombre;

    @Column(name = "descripcion", nullable = true)
    private String descripcion;

    @Column(name = "version_actual", nullable = true)
    private String versionActual;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "estado", columnDefinition = "estado_motor", nullable = false)
    private EstadoMotor estado;

    @Column(name = "es_comun", nullable = false)
    private Boolean esComun;

    @Column(name = "familia", nullable = true)
    private String familia;

    @Column(name = "icono", nullable = true)
    private String icono;

    @Column(name = "documentacion", nullable = true)
    private String documentacion;

    @Column(name = "activo", nullable = false)
    private Boolean activo;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    @UpdateTimestamp
    @Column(name = "actualizado_en", nullable = false)
    private Instant actualizadoEn;

    /** Constructor vacoto requerido por JPA. */
    public Motor() {
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

    /** Obtiene la columna {@code codigo}. */
    public String getCodigo() {
        return codigo;
    }

    /** Establece la columna {@code codigo}. */
    public void setCodigo(String codigo) {
        this.codigo = codigo;
    }

    /** Obtiene la columna {@code nombre}. */
    public String getNombre() {
        return nombre;
    }

    /** Establece la columna {@code nombre}. */
    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    /** Obtiene la columna {@code descripcion}. */
    public String getDescripcion() {
        return descripcion;
    }

    /** Establece la columna {@code descripcion}. */
    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    /** Obtiene la columna {@code version_actual}. */
    public String getVersionActual() {
        return versionActual;
    }

    /** Establece la columna {@code version_actual}. */
    public void setVersionActual(String versionActual) {
        this.versionActual = versionActual;
    }

    /** Obtiene la columna {@code estado}. */
    public EstadoMotor getEstado() {
        return estado;
    }

    /** Establece la columna {@code estado}. */
    public void setEstado(EstadoMotor estado) {
        this.estado = estado;
    }

    /** Obtiene la columna {@code es_comun}. */
    public Boolean getEsComun() {
        return esComun;
    }

    /** Establece la columna {@code es_comun}. */
    public void setEsComun(Boolean esComun) {
        this.esComun = esComun;
    }

    /** Obtiene la columna {@code familia}. */
    public String getFamilia() {
        return familia;
    }

    /** Establece la columna {@code familia}. */
    public void setFamilia(String familia) {
        this.familia = familia;
    }

    /** Obtiene la columna {@code icono}. */
    public String getIcono() {
        return icono;
    }

    /** Establece la columna {@code icono}. */
    public void setIcono(String icono) {
        this.icono = icono;
    }

    /** Obtiene la columna {@code documentacion}. */
    public String getDocumentacion() {
        return documentacion;
    }

    /** Establece la columna {@code documentacion}. */
    public void setDocumentacion(String documentacion) {
        this.documentacion = documentacion;
    }

    /** Obtiene la columna {@code activo}. */
    public Boolean getActivo() {
        return activo;
    }

    /** Establece la columna {@code activo}. */
    public void setActivo(Boolean activo) {
        this.activo = activo;
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
        if (!(o instanceof Motor other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
