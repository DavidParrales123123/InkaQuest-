package com.inkaquest.modules.academico.entity;

import com.inkaquest.modules.identidad.entity.Perfil;
import com.inkaquest.shared.enums.EstadoCurso;
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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;
import jakarta.persistence.GenerationType;

/**
 * Entidad JPA de la tabla {@code public.curso}.
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
@Table(name = "curso")
public class Curso implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "categoria_id", referencedColumnName = "id")
    private Categoria categoriaId;

    @Column(name = "titulo", nullable = false)
    private String titulo;

    @Column(name = "slug", nullable = false)
    private String slug;

    @Column(name = "descripcion", nullable = true)
    private String descripcion;

    @Column(name = "contenido", nullable = true)
    private String contenido;

    @Column(name = "portada_url", nullable = true)
    private String portadaUrl;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "estado", columnDefinition = "estado_curso", nullable = false)
    private EstadoCurso estado;

    @Column(name = "precio", precision = 10, scale = 2, nullable = false)
    private BigDecimal precio;

    @Column(name = "moneda", nullable = false)
    private String moneda;

    @Column(name = "xp_total", nullable = false)
    private Integer xpTotal;

    @Column(name = "duracion_minutos", nullable = false)
    private Integer duracionMinutos;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creado_por", referencedColumnName = "id")
    private Perfil creadoPor;

    @Column(name = "publicado_en", nullable = true)
    private Instant publicadoEn;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    @UpdateTimestamp
    @Column(name = "actualizado_en", nullable = false)
    private Instant actualizadoEn;

    /** Constructor vacoto requerido por JPA. */
    public Curso() {
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
    public Categoria getCategoriaId() {
        return categoriaId;
    }

    /** Establece la entidad relacionada. */
    public void setCategoriaId(Categoria categoriaId) {
        this.categoriaId = categoriaId;
    }

    /** Obtiene la columna {@code titulo}. */
    public String getTitulo() {
        return titulo;
    }

    /** Establece la columna {@code titulo}. */
    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    /** Obtiene la columna {@code slug}. */
    public String getSlug() {
        return slug;
    }

    /** Establece la columna {@code slug}. */
    public void setSlug(String slug) {
        this.slug = slug;
    }

    /** Obtiene la columna {@code descripcion}. */
    public String getDescripcion() {
        return descripcion;
    }

    /** Establece la columna {@code descripcion}. */
    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    /** Obtiene la columna {@code contenido}. */
    public String getContenido() {
        return contenido;
    }

    /** Establece la columna {@code contenido}. */
    public void setContenido(String contenido) {
        this.contenido = contenido;
    }

    /** Obtiene la columna {@code portada_url}. */
    public String getPortadaUrl() {
        return portadaUrl;
    }

    /** Establece la columna {@code portada_url}. */
    public void setPortadaUrl(String portadaUrl) {
        this.portadaUrl = portadaUrl;
    }

    /** Obtiene la columna {@code estado}. */
    public EstadoCurso getEstado() {
        return estado;
    }

    /** Establece la columna {@code estado}. */
    public void setEstado(EstadoCurso estado) {
        this.estado = estado;
    }

    /** Obtiene la columna {@code precio}. */
    public BigDecimal getPrecio() {
        return precio;
    }

    /** Establece la columna {@code precio}. */
    public void setPrecio(BigDecimal precio) {
        this.precio = precio;
    }

    /** Obtiene la columna {@code moneda}. */
    public String getMoneda() {
        return moneda;
    }

    /** Establece la columna {@code moneda}. */
    public void setMoneda(String moneda) {
        this.moneda = moneda;
    }

    /** Obtiene la columna {@code xp_total}. */
    public Integer getXpTotal() {
        return xpTotal;
    }

    /** Establece la columna {@code xp_total}. */
    public void setXpTotal(Integer xpTotal) {
        this.xpTotal = xpTotal;
    }

    /** Obtiene la columna {@code duracion_minutos}. */
    public Integer getDuracionMinutos() {
        return duracionMinutos;
    }

    /** Establece la columna {@code duracion_minutos}. */
    public void setDuracionMinutos(Integer duracionMinutos) {
        this.duracionMinutos = duracionMinutos;
    }

    /** Obtiene la entidad relacionada. */
    public Perfil getCreadoPor() {
        return creadoPor;
    }

    /** Establece la entidad relacionada. */
    public void setCreadoPor(Perfil creadoPor) {
        this.creadoPor = creadoPor;
    }

    /** Obtiene la columna {@code publicado_en}. */
    public Instant getPublicadoEn() {
        return publicadoEn;
    }

    /** Establece la columna {@code publicado_en}. */
    public void setPublicadoEn(Instant publicadoEn) {
        this.publicadoEn = publicadoEn;
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
        if (!(o instanceof Curso other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
