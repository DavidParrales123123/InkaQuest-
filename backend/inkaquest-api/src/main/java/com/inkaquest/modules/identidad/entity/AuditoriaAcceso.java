package com.inkaquest.modules.identidad.entity;

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
 * Entidad JPA de la tabla {@code public.auditoria_acceso}.
 *
 * <p>Mapeo derivado del esquema real de PostgreSQL (proyecto
 * {@code nrfdifzechrjikrvzhdl}). La tabla pertenece al modulo
 * {@code identidad} y esta protegida por RLS: el acceso real depende
 * del contexto de autorizacion de la transaccion.</p>
 *
 * <p>El esquema de la base de datos es propiedad de las migraciones SQL
 * ({@code supabase/migrations}). Esta entidad NO genera el esquema: la
 * propiedad {@code ddl-auto} se fija en {@code none}.</p>
 */
@Entity
@Table(name = "auditoria_acceso")
public class AuditoriaAcceso implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", referencedColumnName = "id")
    private Perfil usuarioId;

    @Column(name = "email", nullable = true)
    private String email;

    @Column(name = "evento", nullable = false)
    private String evento;

    @Column(name = "exito", nullable = false)
    private Boolean exito;

    @Column(name = "ip", nullable = true)
    private String ip;

    @Column(name = "agente_usuario", nullable = true)
    private String agenteUsuario;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadatos", columnDefinition = "jsonb", nullable = false)
    private Map<String, Object> metadatos;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    /** Constructor vacoto requerido por JPA. */
    public AuditoriaAcceso() {
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

    /** Obtiene la columna {@code email}. */
    public String getEmail() {
        return email;
    }

    /** Establece la columna {@code email}. */
    public void setEmail(String email) {
        this.email = email;
    }

    /** Obtiene la columna {@code evento}. */
    public String getEvento() {
        return evento;
    }

    /** Establece la columna {@code evento}. */
    public void setEvento(String evento) {
        this.evento = evento;
    }

    /** Obtiene la columna {@code exito}. */
    public Boolean getExito() {
        return exito;
    }

    /** Establece la columna {@code exito}. */
    public void setExito(Boolean exito) {
        this.exito = exito;
    }

    /** Obtiene la columna {@code ip}. */
    public String getIp() {
        return ip;
    }

    /** Establece la columna {@code ip}. */
    public void setIp(String ip) {
        this.ip = ip;
    }

    /** Obtiene la columna {@code agente_usuario}. */
    public String getAgenteUsuario() {
        return agenteUsuario;
    }

    /** Establece la columna {@code agente_usuario}. */
    public void setAgenteUsuario(String agenteUsuario) {
        this.agenteUsuario = agenteUsuario;
    }

    /** Obtiene la columna {@code metadatos}. */
    public Map<String, Object> getMetadatos() {
        return metadatos;
    }

    /** Establece la columna {@code metadatos}. */
    public void setMetadatos(Map<String, Object> metadatos) {
        this.metadatos = metadatos;
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
        if (!(o instanceof AuditoriaAcceso other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
