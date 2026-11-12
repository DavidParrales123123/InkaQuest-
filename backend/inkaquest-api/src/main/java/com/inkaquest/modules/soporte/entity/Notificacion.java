package com.inkaquest.modules.soporte.entity;

import com.inkaquest.modules.identidad.entity.Perfil;
import com.inkaquest.shared.enums.CanalNotificacion;
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
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;
import jakarta.persistence.GenerationType;

/**
 * Entidad JPA de la tabla {@code public.notificacion}.
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
@Table(name = "notificacion")
public class Notificacion implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @Column(name = "titulo", nullable = false)
    private String titulo;

    @Column(name = "mensaje", nullable = false)
    private String mensaje;

    @Column(name = "plantilla", nullable = true)
    private String plantilla;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "variables", columnDefinition = "jsonb", nullable = false)
    private Map<String, Object> variables;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "canal", columnDefinition = "canal_notificacion", nullable = false)
    private CanalNotificacion canal;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "destinatario_id", referencedColumnName = "id")
    private Perfil destinatarioId;

    @Column(name = "entidad_tipo", nullable = true)
    private String entidadTipo;

    @Column(name = "entidad_id", nullable = true)
    private UUID entidadId;

    @Column(name = "enviar_en", nullable = true)
    private Instant enviarEn;

    @Column(name = "enviada_en", nullable = true)
    private Instant enviadaEn;

    @Column(name = "error", nullable = true)
    private String error;

    @Column(name = "clave_idempotencia", nullable = true)
    private String claveIdempotencia;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creado_por", referencedColumnName = "id")
    private Perfil creadoPor;

    /** Constructor vacoto requerido por JPA. */
    public Notificacion() {
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

    /** Obtiene la columna {@code titulo}. */
    public String getTitulo() {
        return titulo;
    }

    /** Establece la columna {@code titulo}. */
    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    /** Obtiene la columna {@code mensaje}. */
    public String getMensaje() {
        return mensaje;
    }

    /** Establece la columna {@code mensaje}. */
    public void setMensaje(String mensaje) {
        this.mensaje = mensaje;
    }

    /** Obtiene la columna {@code plantilla}. */
    public String getPlantilla() {
        return plantilla;
    }

    /** Establece la columna {@code plantilla}. */
    public void setPlantilla(String plantilla) {
        this.plantilla = plantilla;
    }

    /** Obtiene la columna {@code variables}. */
    public Map<String, Object> getVariables() {
        return variables;
    }

    /** Establece la columna {@code variables}. */
    public void setVariables(Map<String, Object> variables) {
        this.variables = variables;
    }

    /** Obtiene la columna {@code canal}. */
    public CanalNotificacion getCanal() {
        return canal;
    }

    /** Establece la columna {@code canal}. */
    public void setCanal(CanalNotificacion canal) {
        this.canal = canal;
    }

    /** Obtiene la entidad relacionada. */
    public Perfil getDestinatarioId() {
        return destinatarioId;
    }

    /** Establece la entidad relacionada. */
    public void setDestinatarioId(Perfil destinatarioId) {
        this.destinatarioId = destinatarioId;
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

    /** Obtiene la columna {@code enviar_en}. */
    public Instant getEnviarEn() {
        return enviarEn;
    }

    /** Establece la columna {@code enviar_en}. */
    public void setEnviarEn(Instant enviarEn) {
        this.enviarEn = enviarEn;
    }

    /** Obtiene la columna {@code enviada_en}. */
    public Instant getEnviadaEn() {
        return enviadaEn;
    }

    /** Establece la columna {@code enviada_en}. */
    public void setEnviadaEn(Instant enviadaEn) {
        this.enviadaEn = enviadaEn;
    }

    /** Obtiene la columna {@code error}. */
    public String getError() {
        return error;
    }

    /** Establece la columna {@code error}. */
    public void setError(String error) {
        this.error = error;
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

    /** Obtiene la entidad relacionada. */
    public Perfil getCreadoPor() {
        return creadoPor;
    }

    /** Establece la entidad relacionada. */
    public void setCreadoPor(Perfil creadoPor) {
        this.creadoPor = creadoPor;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof Notificacion other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
