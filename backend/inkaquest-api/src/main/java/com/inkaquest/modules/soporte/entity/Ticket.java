package com.inkaquest.modules.soporte.entity;

import com.inkaquest.modules.identidad.entity.Perfil;
import com.inkaquest.shared.enums.EstadoTicket;
import com.inkaquest.shared.enums.PrioridadTicket;
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
 * Entidad JPA de la tabla {@code public.ticket}.
 *
 * <p>Mapeo derivado del esquema real de PostgreSQL (proyecto
 * {@code nrfdifzechrjikrvzhdl}). La tabla pertenece al modulo
 * {@code soporte} y esta protegida por RLS: el acceso real depende
 * del contexto de autorizacion de la transaccion.</p>
 *
 * <p>El esquema de la base de datos es propiedad de las migraciones SQL
 * ({@code supabase/migrations}). Esta entidad NO genera el esquema: la
 * propiedad {@code ddl-auto} se fija en {@code none}.</p>
 */
@Entity
@Table(name = "ticket")
public class Ticket implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", referencedColumnName = "id")
    private Perfil usuarioId;

    @Column(name = "asunto", nullable = false)
    private String asunto;

    @Column(name = "descripcion", nullable = false)
    private String descripcion;

    @Column(name = "categoria", nullable = true)
    private String categoria;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "prioridad", columnDefinition = "prioridad_ticket", nullable = false)
    private PrioridadTicket prioridad;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "estado", columnDefinition = "estado_ticket", nullable = false)
    private EstadoTicket estado;

    @Column(name = "entidad_tipo", nullable = true)
    private String entidadTipo;

    @Column(name = "entidad_id", nullable = true)
    private UUID entidadId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "asignado_a", referencedColumnName = "id")
    private Perfil asignadoA;

    @Column(name = "resuelto_en", nullable = true)
    private Instant resueltoEn;

    @Column(name = "cerrado_en", nullable = true)
    private Instant cerradoEn;

    @Column(name = "valoracion", nullable = true)
    private Integer valoracion;

    @Column(name = "clave_idempotencia", nullable = true)
    private String claveIdempotencia;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    @UpdateTimestamp
    @Column(name = "actualizado_en", nullable = false)
    private Instant actualizadoEn;

    /** Constructor vacoto requerido por JPA. */
    public Ticket() {
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
    public Perfil getUsuarioId() {
        return usuarioId;
    }

    /** Establece la entidad relacionada. */
    public void setUsuarioId(Perfil usuarioId) {
        this.usuarioId = usuarioId;
    }

    /** Obtiene la columna {@code asunto}. */
    public String getAsunto() {
        return asunto;
    }

    /** Establece la columna {@code asunto}. */
    public void setAsunto(String asunto) {
        this.asunto = asunto;
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

    /** Obtiene la columna {@code prioridad}. */
    public PrioridadTicket getPrioridad() {
        return prioridad;
    }

    /** Establece la columna {@code prioridad}. */
    public void setPrioridad(PrioridadTicket prioridad) {
        this.prioridad = prioridad;
    }

    /** Obtiene la columna {@code estado}. */
    public EstadoTicket getEstado() {
        return estado;
    }

    /** Establece la columna {@code estado}. */
    public void setEstado(EstadoTicket estado) {
        this.estado = estado;
    }

    /** Obtiene la columna {@code entidad_tipo}. */
    public String getEntidadTipo() {
        return entidadTipo;
    }

    /** Establece la columna {@code entidad_tipo}. */
    public void setEntidadTipo(String entidadTipo) {
        this.entidadTipo = entidadTipo;
    }

    /** Obtiene la columna {@code entidad_id}. */
    public UUID getEntidadId() {
        return entidadId;
    }

    /** Establece la columna {@code entidad_id}. */
    public void setEntidadId(UUID entidadId) {
        this.entidadId = entidadId;
    }

    /** Obtiene la entidad relacionada. */
    public Perfil getAsignadoA() {
        return asignadoA;
    }

    /** Establece la entidad relacionada. */
    public void setAsignadoA(Perfil asignadoA) {
        this.asignadoA = asignadoA;
    }

    /** Obtiene la columna {@code resuelto_en}. */
    public Instant getResueltoEn() {
        return resueltoEn;
    }

    /** Establece la columna {@code resuelto_en}. */
    public void setResueltoEn(Instant resueltoEn) {
        this.resueltoEn = resueltoEn;
    }

    /** Obtiene la columna {@code cerrado_en}. */
    public Instant getCerradoEn() {
        return cerradoEn;
    }

    /** Establece la columna {@code cerrado_en}. */
    public void setCerradoEn(Instant cerradoEn) {
        this.cerradoEn = cerradoEn;
    }

    /** Obtiene la columna {@code valoracion}. */
    public Integer getValoracion() {
        return valoracion;
    }

    /** Establece la columna {@code valoracion}. */
    public void setValoracion(Integer valoracion) {
        this.valoracion = valoracion;
    }

    /** Obtiene la columna {@code clave_idempotencia}. */
    public String getClaveIdempotencia() {
        return claveIdempotencia;
    }

    /** Establece la columna {@code clave_idempotencia}. */
    public void setClaveIdempotencia(String claveIdempotencia) {
        this.claveIdempotencia = claveIdempotencia;
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
        if (!(o instanceof Ticket other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
