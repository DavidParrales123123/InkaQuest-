package com.inkaquest.modules.progreso.entity;

import com.inkaquest.modules.identidad.entity.Perfil;
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
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;
import jakarta.persistence.GenerationType;

/**
 * Entidad JPA de la tabla {@code public.historial_progreso}.
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
@Table(name = "historial_progreso")
public class HistorialProgreso implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "progreso_curso_id", referencedColumnName = "id")
    private ProgresoCurso progresoCursoId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "estudiante_id", referencedColumnName = "id")
    private Perfil estudianteId;

    @Column(name = "tipo", nullable = false)
    private String tipo;

    @Column(name = "valor_anterior", precision = 8, scale = 2, nullable = true)
    private BigDecimal valorAnterior;

    @Column(name = "valor_nuevo", precision = 8, scale = 2, nullable = true)
    private BigDecimal valorNuevo;

    @Column(name = "duracion_minutos", nullable = false)
    private Integer duracionMinutos;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "datos", columnDefinition = "jsonb", nullable = false)
    private Map<String, Object> datos;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    /** Constructor vacoto requerido por JPA. */
    public HistorialProgreso() {
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
    public Perfil getEstudianteId() {
        return estudianteId;
    }

    /** Establece la entidad relacionada. */
    public void setEstudianteId(Perfil estudianteId) {
        this.estudianteId = estudianteId;
    }

    /** Obtiene la columna {@code tipo}. */
    public String getTipo() {
        return tipo;
    }

    /** Establece la columna {@code tipo}. */
    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    /** Obtiene la columna {@code valor_anterior}. */
    public BigDecimal getValorAnterior() {
        return valorAnterior;
    }

    /** Establece la columna {@code valor_anterior}. */
    public void setValorAnterior(BigDecimal valorAnterior) {
        this.valorAnterior = valorAnterior;
    }

    /** Obtiene la columna {@code valor_nuevo}. */
    public BigDecimal getValorNuevo() {
        return valorNuevo;
    }

    /** Establece la columna {@code valor_nuevo}. */
    public void setValorNuevo(BigDecimal valorNuevo) {
        this.valorNuevo = valorNuevo;
    }

    /** Obtiene la columna {@code duracion_minutos}. */
    public Integer getDuracionMinutos() {
        return duracionMinutos;
    }

    /** Establece la columna {@code duracion_minutos}. */
    public void setDuracionMinutos(Integer duracionMinutos) {
        this.duracionMinutos = duracionMinutos;
    }

    /** Obtiene la columna {@code datos}. */
    public Map<String, Object> getDatos() {
        return datos;
    }

    /** Establece la columna {@code datos}. */
    public void setDatos(Map<String, Object> datos) {
        this.datos = datos;
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
        if (!(o instanceof HistorialProgreso other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
