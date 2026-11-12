package com.inkaquest.modules.auditoria.entity;

import com.inkaquest.shared.enums.TipoConfiguracion;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.time.Instant;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;
import jakarta.persistence.GenerationType;

/**
 * Entidad JPA de la tabla {@code public.configuracion}.
 *
 * <p>Mapeo derivado del esquema real de PostgreSQL (proyecto
 * {@code nrfdifzechrjikrvzhdl}). La tabla pertenece al modulo
 * {@code auditoria} y esta protegida por RLS: el acceso real depende
 * del contexto de autorizacion de la transaccion.</p>
 *
 * <p>El esquema de la base de datos es propiedad de las migraciones SQL
 * ({@code supabase/migrations}). Esta entidad NO genera el esquema: la
 * propiedad {@code ddl-auto} se fija en {@code none}.</p>
 */
@Entity
@Table(name = "configuracion")
public class Configuracion implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @Column(name = "clave", nullable = false)
    private String clave;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "valor", columnDefinition = "jsonb", nullable = false)
    private Map<String, Object> valor;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "tipo", columnDefinition = "tipo_configuracion", nullable = false)
    private TipoConfiguracion tipo;

    @Column(name = "descripcion", nullable = true)
    private String descripcion;

    @Column(name = "categoria", nullable = false)
    private String categoria;

    @Column(name = "editable", nullable = false)
    private Boolean editable;

    @Column(name = "es_secreta", nullable = false)
    private Boolean esSecreta;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    @UpdateTimestamp
    @Column(name = "actualizado_en", nullable = false)
    private Instant actualizadoEn;

    /** Constructor vacoto requerido por JPA. */
    public Configuracion() {
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

    /** Obtiene la columna {@code clave}. */
    public String getClave() {
        return clave;
    }

    /** Establece la columna {@code clave}. */
    public void setClave(String clave) {
        this.clave = clave;
    }

    /** Obtiene la columna {@code valor}. */
    public Map<String, Object> getValor() {
        return valor;
    }

    /** Establece la columna {@code valor}. */
    public void setValor(Map<String, Object> valor) {
        this.valor = valor;
    }

    /** Obtiene la columna {@code tipo}. */
    public TipoConfiguracion getTipo() {
        return tipo;
    }

    /** Establece la columna {@code tipo}. */
    public void setTipo(TipoConfiguracion tipo) {
        this.tipo = tipo;
    }

    /** Obtiene la columna {@code descripcion}. */
    public String getDescripcion() {
        return descripcion;
    }

    /** Establece la columna {@code descripcion}. */
    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    /** Obtiene la columna {@code categoria}. */
    public String getCategoria() {
        return categoria;
    }

    /** Establece la columna {@code categoria}. */
    public void setCategoria(String categoria) {
        this.categoria = categoria;
    }

    /** Obtiene la columna {@code editable}. */
    public Boolean getEditable() {
        return editable;
    }

    /** Establece la columna {@code editable}. */
    public void setEditable(Boolean editable) {
        this.editable = editable;
    }

    /** Obtiene la columna {@code es_secreta}. */
    public Boolean getEsSecreta() {
        return esSecreta;
    }

    /** Establece la columna {@code es_secreta}. */
    public void setEsSecreta(Boolean esSecreta) {
        this.esSecreta = esSecreta;
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
        if (!(o instanceof Configuracion other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
