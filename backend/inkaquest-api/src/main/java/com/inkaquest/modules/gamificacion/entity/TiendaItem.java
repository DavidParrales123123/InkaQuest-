package com.inkaquest.modules.gamificacion.entity;

import com.inkaquest.shared.enums.TipoRecompensa;
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
 * Entidad JPA de la tabla {@code public.tienda_item}.
 *
 * <p>Mapeo derivado del esquema real de PostgreSQL (proyecto
 * {@code nrfdifzechrjikrvzhdl}). La tabla pertenece al modulo
 * {@code gamificacion} y esta protegida por RLS: el acceso real depende
 * del contexto de autorizacion de la transaccion.</p>
 *
 * <p>El esquema de la base de datos es propiedad de las migraciones SQL
 * ({@code supabase/migrations}). Esta entidad NO genera el esquema: la
 * propiedad {@code ddl-auto} se fija en {@code none}.</p>
 */
@Entity
@Table(name = "tienda_item")
public class TiendaItem implements Serializable {

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

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "tipo", columnDefinition = "tipo_recompensa", nullable = false)
    private TipoRecompensa tipo;

    @Column(name = "precio_monedas", nullable = false)
    private Integer precioMonedas;

    @Column(name = "precio_xp", nullable = false)
    private Integer precioXp;

    @Column(name = "imagen_url", nullable = true)
    private String imagenUrl;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "datos", columnDefinition = "jsonb", nullable = false)
    private Map<String, Object> datos;

    @Column(name = "stock", nullable = true)
    private Integer stock;

    @Column(name = "limite_por_usuario", nullable = true)
    private Integer limitePorUsuario;

    @Column(name = "activo", nullable = false)
    private Boolean activo;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    @UpdateTimestamp
    @Column(name = "actualizado_en", nullable = false)
    private Instant actualizadoEn;

    /** Constructor vacoto requerido por JPA. */
    public TiendaItem() {
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

    /** Obtiene la columna {@code tipo}. */
    public TipoRecompensa getTipo() {
        return tipo;
    }

    /** Establece la columna {@code tipo}. */
    public void setTipo(TipoRecompensa tipo) {
        this.tipo = tipo;
    }

    /** Obtiene la columna {@code precio_monedas}. */
    public Integer getPrecioMonedas() {
        return precioMonedas;
    }

    /** Establece la columna {@code precio_monedas}. */
    public void setPrecioMonedas(Integer precioMonedas) {
        this.precioMonedas = precioMonedas;
    }

    /** Obtiene la columna {@code precio_xp}. */
    public Integer getPrecioXp() {
        return precioXp;
    }

    /** Establece la columna {@code precio_xp}. */
    public void setPrecioXp(Integer precioXp) {
        this.precioXp = precioXp;
    }

    /** Obtiene la columna {@code imagen_url}. */
    public String getImagenUrl() {
        return imagenUrl;
    }

    /** Establece la columna {@code imagen_url}. */
    public void setImagenUrl(String imagenUrl) {
        this.imagenUrl = imagenUrl;
    }

    /** Obtiene la columna {@code datos}. */
    public Map<String, Object> getDatos() {
        return datos;
    }

    /** Establece la columna {@code datos}. */
    public void setDatos(Map<String, Object> datos) {
        this.datos = datos;
    }

    /** Obtiene la columna {@code stock}. */
    public Integer getStock() {
        return stock;
    }

    /** Establece la columna {@code stock}. */
    public void setStock(Integer stock) {
        this.stock = stock;
    }

    /** Obtiene la columna {@code limite_por_usuario}. */
    public Integer getLimitePorUsuario() {
        return limitePorUsuario;
    }

    /** Establece la columna {@code limite_por_usuario}. */
    public void setLimitePorUsuario(Integer limitePorUsuario) {
        this.limitePorUsuario = limitePorUsuario;
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
        if (!(o instanceof TiendaItem other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
