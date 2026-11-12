package com.inkaquest.modules.retos.entity;

import com.inkaquest.modules.academico.entity.Curso;
import com.inkaquest.modules.academico.entity.Leccion;
import com.inkaquest.modules.identidad.entity.Perfil;
import com.inkaquest.shared.enums.NivelDificultad;
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
 * Entidad JPA de la tabla {@code public.reto}.
 *
 * <p>Mapeo derivado del esquema real de PostgreSQL (proyecto
 * {@code nrfdifzechrjikrvzhdl}). La tabla pertenece al modulo
 * {@code retos} y esta protegida por RLS: el acceso real depende
 * del contexto de autorizacion de la transaccion.</p>
 *
 * <p>El esquema de la base de datos es propiedad de las migraciones SQL
 * ({@code supabase/migrations}). Esta entidad NO genera el esquema: la
 * propiedad {@code ddl-auto} se fija en {@code none}.</p>
 */
@Entity
@Table(name = "reto")
public class Reto implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "leccion_id", referencedColumnName = "id")
    private Leccion leccionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "curso_id", referencedColumnName = "id")
    private Curso cursoId;

    @Column(name = "titulo", nullable = false)
    private String titulo;

    @Column(name = "enunciado", nullable = false)
    private String enunciado;

    @Column(name = "descripcion", nullable = true)
    private String descripcion;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "dificultad", columnDefinition = "nivel_dificultad", nullable = false)
    private NivelDificultad dificultad;

    @Column(name = "tiempo_limite_seg", nullable = true)
    private Integer tiempoLimiteSeg;

    @Column(name = "memoria_limite_mb", nullable = true)
    private Integer memoriaLimiteMb;

    @Column(name = "xp_otorgado", nullable = false)
    private Integer xpOtorgado;

    @Column(name = "intentos_maximos", nullable = false)
    private Integer intentosMaximos;

    @Column(name = "published", nullable = false)
    private Boolean published;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creado_por", referencedColumnName = "id")
    private Perfil creadoPor;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    @UpdateTimestamp
    @Column(name = "actualizado_en", nullable = false)
    private Instant actualizadoEn;

    /** Constructor vacoto requerido por JPA. */
    public Reto() {
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
    public Leccion getLeccionId() {
        return leccionId;
    }

    /** Establece la entidad relacionada. */
    public void setLeccionId(Leccion leccionId) {
        this.leccionId = leccionId;
    }

    /** Obtiene la entidad relacionada. */
    public Curso getCursoId() {
        return cursoId;
    }

    /** Establece la entidad relacionada. */
    public void setCursoId(Curso cursoId) {
        this.cursoId = cursoId;
    }

    /** Obtiene la columna {@code titulo}. */
    public String getTitulo() {
        return titulo;
    }

    /** Establece la columna {@code titulo}. */
    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    /** Obtiene la columna {@code enunciado}. */
    public String getEnunciado() {
        return enunciado;
    }

    /** Establece la columna {@code enunciado}. */
    public void setEnunciado(String enunciado) {
        this.enunciado = enunciado;
    }

    /** Obtiene la columna {@code descripcion}. */
    public String getDescripcion() {
        return descripcion;
    }

    /** Establece la columna {@code descripcion}. */
    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    /** Obtiene la columna {@code dificultad}. */
    public NivelDificultad getDificultad() {
        return dificultad;
    }

    /** Establece la columna {@code dificultad}. */
    public void setDificultad(NivelDificultad dificultad) {
        this.dificultad = dificultad;
    }

    /** Obtiene la columna {@code tiempo_limite_seg}. */
    public Integer getTiempoLimiteSeg() {
        return tiempoLimiteSeg;
    }

    /** Establece la columna {@code tiempo_limite_seg}. */
    public void setTiempoLimiteSeg(Integer tiempoLimiteSeg) {
        this.tiempoLimiteSeg = tiempoLimiteSeg;
    }

    /** Obtiene la columna {@code memoria_limite_mb}. */
    public Integer getMemoriaLimiteMb() {
        return memoriaLimiteMb;
    }

    /** Establece la columna {@code memoria_limite_mb}. */
    public void setMemoriaLimiteMb(Integer memoriaLimiteMb) {
        this.memoriaLimiteMb = memoriaLimiteMb;
    }

    /** Obtiene la columna {@code xp_otorgado}. */
    public Integer getXpOtorgado() {
        return xpOtorgado;
    }

    /** Establece la columna {@code xp_otorgado}. */
    public void setXpOtorgado(Integer xpOtorgado) {
        this.xpOtorgado = xpOtorgado;
    }

    /** Obtiene la columna {@code intentos_maximos}. */
    public Integer getIntentosMaximos() {
        return intentosMaximos;
    }

    /** Establece la columna {@code intentos_maximos}. */
    public void setIntentosMaximos(Integer intentosMaximos) {
        this.intentosMaximos = intentosMaximos;
    }

    /** Obtiene la columna {@code published}. */
    public Boolean getPublished() {
        return published;
    }

    /** Establece la columna {@code published}. */
    public void setPublished(Boolean published) {
        this.published = published;
    }

    /** Obtiene la entidad relacionada. */
    public Perfil getCreadoPor() {
        return creadoPor;
    }

    /** Establece la entidad relacionada. */
    public void setCreadoPor(Perfil creadoPor) {
        this.creadoPor = creadoPor;
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
        if (!(o instanceof Reto other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
