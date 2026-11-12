package com.inkaquest.modules.comercio.entity;

import com.inkaquest.modules.academico.entity.Curso;
import com.inkaquest.shared.enums.TipoDescuento;
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
 * Entidad JPA de la tabla {@code public.descuento}.
 *
 * <p>Mapeo derivado del esquema real de PostgreSQL (proyecto
 * {@code nrfdifzechrjikrvzhdl}). La tabla pertenece al modulo
 * {@code comercio} y esta protegida por RLS: el acceso real depende
 * del contexto de autorizacion de la transaccion.</p>
 *
 * <p>El esquema de la base de datos es propiedad de las migraciones SQL
 * ({@code supabase/migrations}). Esta entidad NO genera el esquema: la
 * propiedad {@code ddl-auto} se fija en {@code none}.</p>
 */
@Entity
@Table(name = "descuento")
public class Descuento implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @Column(name = "nombre", nullable = false)
    private String nombre;

    @Column(name = "descripcion", nullable = true)
    private String descripcion;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "tipo", columnDefinition = "tipo_descuento", nullable = false)
    private TipoDescuento tipo;

    @Column(name = "valor", precision = 10, scale = 2, nullable = false)
    private BigDecimal valor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "curso_id", referencedColumnName = "id")
    private Curso cursoId;

    @Column(name = "activo", nullable = false)
    private Boolean activo;

    @Column(name = "valido_desde", nullable = true)
    private Instant validoDesde;

    @Column(name = "valido_hasta", nullable = true)
    private Instant validoHasta;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    @UpdateTimestamp
    @Column(name = "actualizado_en", nullable = false)
    private Instant actualizadoEn;

    /** Constructor vacoto requerido por JPA. */
    public Descuento() {
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
    public TipoDescuento getTipo() {
        return tipo;
    }

    /** Establece la columna {@code tipo}. */
    public void setTipo(TipoDescuento tipo) {
        this.tipo = tipo;
    }

    /** Obtiene la columna {@code valor}. */
    public BigDecimal getValor() {
        return valor;
    }

    /** Establece la columna {@code valor}. */
    public void setValor(BigDecimal valor) {
        this.valor = valor;
    }

    /** Obtiene la entidad relacionada. */
    public Curso getCursoId() {
        return cursoId;
    }

    /** Establece la entidad relacionada. */
    public void setCursoId(Curso cursoId) {
        this.cursoId = cursoId;
    }

    /** Obtiene la columna {@code activo}. */
    public Boolean getActivo() {
        return activo;
    }

    /** Establece la columna {@code activo}. */
    public void setActivo(Boolean activo) {
        this.activo = activo;
    }

    /** Obtiene la columna {@code valido_desde}. */
    public Instant getValidoDesde() {
        return validoDesde;
    }

    /** Establece la columna {@code valido_desde}. */
    public void setValidoDesde(Instant validoDesde) {
        this.validoDesde = validoDesde;
    }

    /** Obtiene la columna {@code valido_hasta}. */
    public Instant getValidoHasta() {
        return validoHasta;
    }

    /** Establece la columna {@code valido_hasta}. */
    public void setValidoHasta(Instant validoHasta) {
        this.validoHasta = validoHasta;
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
        if (!(o instanceof Descuento other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
