package com.inkaquest.modules.minijuegos.entity;

import com.inkaquest.modules.identidad.entity.Perfil;
import com.inkaquest.shared.enums.EstadoJuego;
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
 * Entidad JPA de la tabla {@code public.juego}.
 *
 * <p>Mapeo derivado del esquema real de PostgreSQL (proyecto
 * {@code nrfdifzechrjikrvzhdl}). La tabla pertenece al modulo
 * {@code minijuegos} y esta protegida por RLS: el acceso real depende
 * del contexto de autorizacion de la transaccion.</p>
 *
 * <p>El esquema de la base de datos es propiedad de las migraciones SQL
 * ({@code supabase/migrations}). Esta entidad NO genera el esquema: la
 * propiedad {@code ddl-auto} se fija en {@code none}.</p>
 */
@Entity
@Table(name = "juego")
public class Juego implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "motor_id", referencedColumnName = "id")
    private Motor motorId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "version_motor_id", referencedColumnName = "id")
    private VersionMotor versionMotorId;

    @Column(name = "codigo", nullable = false)
    private String codigo;

    @Column(name = "nombre", nullable = false)
    private String nombre;

    @Column(name = "descripcion", nullable = true)
    private String descripcion;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "estado", columnDefinition = "estado_juego", nullable = false)
    private EstadoJuego estado;

    @Column(name = "version_juego", nullable = false)
    private String versionJuego;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "dificultad", columnDefinition = "nivel_dificultad", nullable = false)
    private NivelDificultad dificultad;

    @Column(name = "xp_otorgado", nullable = false)
    private Integer xpOtorgado;

    @Column(name = "monedas_otorgadas", nullable = false)
    private Integer monedasOtorgadas;

    @Column(name = "tiempo_limite_seg", nullable = true)
    private Integer tiempoLimiteSeg;

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
    public Juego() {
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
    public Motor getMotorId() {
        return motorId;
    }

    /** Establece la entidad relacionada. */
    public void setMotorId(Motor motorId) {
        this.motorId = motorId;
    }

    /** Obtiene la entidad relacionada. */
    public VersionMotor getVersionMotorId() {
        return versionMotorId;
    }

    /** Establece la entidad relacionada. */
    public void setVersionMotorId(VersionMotor versionMotorId) {
        this.versionMotorId = versionMotorId;
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

    /** Obtiene la columna {@code estado}. */
    public EstadoJuego getEstado() {
        return estado;
    }

    /** Establece la columna {@code estado}. */
    public void setEstado(EstadoJuego estado) {
        this.estado = estado;
    }

    /** Obtiene la columna {@code version_juego}. */
    public String getVersionJuego() {
        return versionJuego;
    }

    /** Establece la columna {@code version_juego}. */
    public void setVersionJuego(String versionJuego) {
        this.versionJuego = versionJuego;
    }

    /** Obtiene la columna {@code dificultad}. */
    public NivelDificultad getDificultad() {
        return dificultad;
    }

    /** Establece la columna {@code dificultad}. */
    public void setDificultad(NivelDificultad dificultad) {
        this.dificultad = dificultad;
    }

    /** Obtiene la columna {@code xp_otorgado}. */
    public Integer getXpOtorgado() {
        return xpOtorgado;
    }

    /** Establece la columna {@code xp_otorgado}. */
    public void setXpOtorgado(Integer xpOtorgado) {
        this.xpOtorgado = xpOtorgado;
    }

    /** Obtiene la columna {@code monedas_otorgadas}. */
    public Integer getMonedasOtorgadas() {
        return monedasOtorgadas;
    }

    /** Establece la columna {@code monedas_otorgadas}. */
    public void setMonedasOtorgadas(Integer monedasOtorgadas) {
        this.monedasOtorgadas = monedasOtorgadas;
    }

    /** Obtiene la columna {@code tiempo_limite_seg}. */
    public Integer getTiempoLimiteSeg() {
        return tiempoLimiteSeg;
    }

    /** Establece la columna {@code tiempo_limite_seg}. */
    public void setTiempoLimiteSeg(Integer tiempoLimiteSeg) {
        this.tiempoLimiteSeg = tiempoLimiteSeg;
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
        if (!(o instanceof Juego other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
