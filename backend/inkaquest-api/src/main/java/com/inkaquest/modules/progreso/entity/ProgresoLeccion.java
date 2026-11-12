package com.inkaquest.modules.progreso.entity;

import com.inkaquest.modules.academico.entity.Leccion;
import com.inkaquest.modules.identidad.entity.Perfil;
import com.inkaquest.shared.enums.EstadoProgreso;
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
 * Entidad JPA de la tabla {@code public.progreso_leccion}.
 *
 * <p>Mapeo derivado del esquema real de PostgreSQL (proyecto
 * {@code nrfdifzechrjikrvzhdl}). La tabla pertenece al modulo
 * {@code progreso} y esta protegida por RLS: el acceso real depende
 * del contexto de autorizacion de la transaccion.</p>
 *
 * <p>El esquema de la base de datos es propiedad de las migraciones SQL
 * ({@code supabase/migrations}). Esta entidad NO genera el esquema: la
 * propiedad {@code ddl-auto} se fija en {@code none}.</p>
 */
@Entity
@Table(name = "progreso_leccion")
public class ProgresoLeccion implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "progreso_curso_id", referencedColumnName = "id")
    private ProgresoCurso progresoCursoId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "leccion_id", referencedColumnName = "id")
    private Leccion leccionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "estudiante_id", referencedColumnName = "id")
    private Perfil estudianteId;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "estado", columnDefinition = "estado_progreso", nullable = false)
    private EstadoProgreso estado;

    @Column(name = "porcentaje", precision = 5, scale = 2, nullable = false)
    private BigDecimal porcentaje;

    @Column(name = "xp_obtenido", nullable = false)
    private Integer xpObtenido;

    @Column(name = "minutos_estudio", nullable = false)
    private Integer minutosEstudio;

    @Column(name = "iniciado_en", nullable = true)
    private Instant iniciadoEn;

    @Column(name = "completado_en", nullable = true)
    private Instant completadoEn;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    @UpdateTimestamp
    @Column(name = "actualizado_en", nullable = false)
    private Instant actualizadoEn;

    /** Constructor vacoto requerido por JPA. */
    public ProgresoLeccion() {
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
    public ProgresoCurso getProgresoCursoId() {
        return progresoCursoId;
    }

    /** Establece la entidad relacionada. */
    public void setProgresoCursoId(ProgresoCurso progresoCursoId) {
        this.progresoCursoId = progresoCursoId;
    }

    /** Obtiene la entidad relacionada. */
    public Leccion getLeccionId() {
        return leccionId;
    }

    /** Establece la entidad relacionada. */
    public void setLeccionId(Leccion leccionId) {
        this.leccionId = leccionId;
    }

    /** Obtiene la entidad relacionada. */
    public Perfil getEstudianteId() {
        return estudianteId;
    }

    /** Establece la entidad relacionada. */
    public void setEstudianteId(Perfil estudianteId) {
        this.estudianteId = estudianteId;
    }

    /** Obtiene la columna {@code estado}. */
    public EstadoProgreso getEstado() {
        return estado;
    }

    /** Establece la columna {@code estado}. */
    public void setEstado(EstadoProgreso estado) {
        this.estado = estado;
    }

    /** Obtiene la columna {@code porcentaje}. */
    public BigDecimal getPorcentaje() {
        return porcentaje;
    }

    /** Establece la columna {@code porcentaje}. */
    public void setPorcentaje(BigDecimal porcentaje) {
        this.porcentaje = porcentaje;
    }

    /** Obtiene la columna {@code xp_obtenido}. */
    public Integer getXpObtenido() {
        return xpObtenido;
    }

    /** Establece la columna {@code xp_obtenido}. */
    public void setXpObtenido(Integer xpObtenido) {
        this.xpObtenido = xpObtenido;
    }

    /** Obtiene la columna {@code minutos_estudio}. */
    public Integer getMinutosEstudio() {
        return minutosEstudio;
    }

    /** Establece la columna {@code minutos_estudio}. */
    public void setMinutosEstudio(Integer minutosEstudio) {
        this.minutosEstudio = minutosEstudio;
    }

    /** Obtiene la columna {@code iniciado_en}. */
    public Instant getIniciadoEn() {
        return iniciadoEn;
    }

    /** Establece la columna {@code iniciado_en}. */
    public void setIniciadoEn(Instant iniciadoEn) {
        this.iniciadoEn = iniciadoEn;
    }

    /** Obtiene la columna {@code completado_en}. */
    public Instant getCompletadoEn() {
        return completadoEn;
    }

    /** Establece la columna {@code completado_en}. */
    public void setCompletadoEn(Instant completadoEn) {
        this.completadoEn = completadoEn;
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
        if (!(o instanceof ProgresoLeccion other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
