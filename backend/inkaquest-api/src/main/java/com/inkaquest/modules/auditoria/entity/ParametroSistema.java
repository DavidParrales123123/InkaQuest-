package com.inkaquest.modules.auditoria.entity;

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
import org.hibernate.annotations.UpdateTimestamp;
import jakarta.persistence.GenerationType;

/**
 * Entidad JPA de la tabla {@code public.parametro_sistema}.
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
@Table(name = "parametro_sistema")
public class ParametroSistema implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @Column(name = "clave", nullable = false)
    private String clave;

    @Column(name = "valor", nullable = false)
    private String valor;

    @Column(name = "tipo", nullable = false)
    private String tipo;

    @Column(name = "descripcion", nullable = true)
    private String descripcion;

    @Column(name = "categoria", nullable = false)
    private String categoria;

    @Column(name = "solo_lectura", nullable = false)
    private Boolean soloLectura;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    @UpdateTimestamp
    @Column(name = "actualizado_en", nullable = false)
    private Instant actualizadoEn;

    /** Constructor vacoto requerido por JPA. */
    public ParametroSistema() {
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
    public String getValor() {
        return valor;
    }

    /** Establece la columna {@code valor}. */
    public void setValor(String valor) {
        this.valor = valor;
    }

    /** Obtiene la columna {@code tipo}. */
    public String getTipo() {
        return tipo;
    }

    /** Establece la columna {@code tipo}. */
    public void setTipo(String tipo) {
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

    /** Obtiene la columna {@code solo_lectura}. */
    public Boolean getSoloLectura() {
        return soloLectura;
    }

    /** Establece la columna {@code solo_lectura}. */
    public void setSoloLectura(Boolean soloLectura) {
        this.soloLectura = soloLectura;
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
        if (!(o instanceof ParametroSistema other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
