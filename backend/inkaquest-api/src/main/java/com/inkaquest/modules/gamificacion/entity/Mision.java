package com.inkaquest.modules.gamificacion.entity;

import com.inkaquest.modules.academico.entity.Curso;
import com.inkaquest.shared.enums.TipoMision;
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
 * Entidad JPA de la tabla {@code public.mision}.
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
@Table(name = "mision")
public class Mision implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evento_id", referencedColumnName = "id")
    private EventoGamificacion eventoId;

    @Column(name = "nombre", nullable = false)
    private String nombre;

    @Column(name = "descripcion", nullable = true)
    private String descripcion;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "tipo", columnDefinition = "tipo_mision", nullable = false)
    private TipoMision tipo;

    @Column(name = "objetivo_tipo", nullable = false)
    private String objetivoTipo;

    @Column(name = "objetivo_cantidad", nullable = false)
    private Integer objetivoCantidad;

    @Column(name = "xp_recompensa", nullable = false)
    private Integer xpRecompensa;

    @Column(name = "monedas_recompensa", nullable = false)
    private Integer monedasRecompensa;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "insignia_id", referencedColumnName = "id")
    private Insignia insigniaId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "curso_id", referencedColumnName = "id")
    private Curso cursoId;

    @Column(name = "fecha_inicio", nullable = true)
    private Instant fechaInicio;

    @Column(name = "fecha_fin", nullable = true)
    private Instant fechaFin;

    @Column(name = "activa", nullable = false)
    private Boolean activa;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    @UpdateTimestamp
    @Column(name = "actualizado_en", nullable = false)
    private Instant actualizadoEn;

    /** Constructor vacoto requerido por JPA. */
    public Mision() {
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
    public EventoGamificacion getEventoId() {
        return eventoId;
    }

    /** Establece la entidad relacionada. */
    public void setEventoId(EventoGamificacion eventoId) {
        this.eventoId = eventoId;
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
    public TipoMision getTipo() {
        return tipo;
    }

    /** Establece la columna {@code tipo}. */
    public void setTipo(TipoMision tipo) {
        this.tipo = tipo;
    }

    /** Obtiene la columna {@code objetivo_tipo}. */
    public String getObjetivoTipo() {
        return objetivoTipo;
    }

    /** Establece la columna {@code objetivo_tipo}. */
    public void setObjetivoTipo(String objetivoTipo) {
        this.objetivoTipo = objetivoTipo;
    }

    /** Obtiene la columna {@code objetivo_cantidad}. */
    public Integer getObjetivoCantidad() {
        return objetivoCantidad;
    }

    /** Establece la columna {@code objetivo_cantidad}. */
    public void setObjetivoCantidad(Integer objetivoCantidad) {
        this.objetivoCantidad = objetivoCantidad;
    }

    /** Obtiene la columna {@code xp_recompensa}. */
    public Integer getXpRecompensa() {
        return xpRecompensa;
    }

    /** Establece la columna {@code xp_recompensa}. */
    public void setXpRecompensa(Integer xpRecompensa) {
        this.xpRecompensa = xpRecompensa;
    }

    /** Obtiene la columna {@code monedas_recompensa}. */
    public Integer getMonedasRecompensa() {
        return monedasRecompensa;
    }

    /** Establece la columna {@code monedas_recompensa}. */
    public void setMonedasRecompensa(Integer monedasRecompensa) {
        this.monedasRecompensa = monedasRecompensa;
    }

    /** Obtiene la entidad relacionada. */
    public Insignia getInsigniaId() {
        return insigniaId;
    }

    /** Establece la entidad relacionada. */
    public void setInsigniaId(Insignia insigniaId) {
        this.insigniaId = insigniaId;
    }

    /** Obtiene la entidad relacionada. */
    public Curso getCursoId() {
        return cursoId;
    }

    /** Establece la entidad relacionada. */
    public void setCursoId(Curso cursoId) {
        this.cursoId = cursoId;
    }

    /** Obtiene la columna {@code fecha_inicio}. */
    public Instant getFechaInicio() {
        return fechaInicio;
    }

    /** Establece la columna {@code fecha_inicio}. */
    public void setFechaInicio(Instant fechaInicio) {
        this.fechaInicio = fechaInicio;
    }

    /** Obtiene la columna {@code fecha_fin}. */
    public Instant getFechaFin() {
        return fechaFin;
    }

    /** Establece la columna {@code fecha_fin}. */
    public void setFechaFin(Instant fechaFin) {
        this.fechaFin = fechaFin;
    }

    /** Obtiene la columna {@code activa}. */
    public Boolean getActiva() {
        return activa;
    }

    /** Establece la columna {@code activa}. */
    public void setActiva(Boolean activa) {
        this.activa = activa;
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
        if (!(o instanceof Mision other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
