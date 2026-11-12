package com.inkaquest.modules.auditoria.entity;

import com.inkaquest.modules.identidad.entity.Perfil;
import com.inkaquest.shared.enums.TipoAccion;
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
 * Entidad JPA de la tabla {@code public.registro_accion}.
 *
 * <p>Mapeo derivado del esquema real de PostgreSQL (proyecto
 * {@code nrfdifzechrjikrvzhdl}). La tabla pertenece al modulo
 * {@code auditoria} y esta protegida por RLS: el acceso real depende
 * del contexto de autorizacion de la transaccion.</p>
 *
 * <p>El esquema de la base de datos es propiedad de las migraciones SQL
 * ({@code supabase/migrations}). Esta entidad NO genera el esquema: la
 * propiedad {@code ddl-auto} se fija en {@code none}.</p>
 */
@Entity
@Table(name = "registro_accion")
public class RegistroAccion implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evento_id", referencedColumnName = "id")
    private EventoSistema eventoId;

    @Column(name = "codigo_evento", nullable = true)
    private String codigoEvento;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_id", referencedColumnName = "id")
    private Perfil actorId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_objetivo_id", referencedColumnName = "id")
    private Perfil usuarioObjetivoId;

    @Column(name = "entidad_tipo", nullable = false)
    private String entidadTipo;

    @Column(name = "entidad_id", nullable = true)
    private UUID entidadId;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "accion", columnDefinition = "tipo_accion", nullable = false)
    private TipoAccion accion;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "valor_anterior", columnDefinition = "jsonb", nullable = true)
    private Map<String, Object> valorAnterior;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "valor_nuevo", columnDefinition = "jsonb", nullable = true)
    private Map<String, Object> valorNuevo;

    @Column(name = "ip", nullable = true)
    private String ip;

    @Column(name = "agente_usuario", nullable = true)
    private String agenteUsuario;

    @Column(name = "ruta", nullable = true)
    private String ruta;

    @Column(name = "metodo", nullable = true)
    private String metodo;

    @Column(name = "exito", nullable = false)
    private Boolean exito;

    @Column(name = "mensaje_error", nullable = true)
    private String mensajeError;

    @Column(name = "correlation_id", nullable = true)
    private String correlationId;

    @Column(name = "duracion_ms", nullable = true)
    private Integer duracionMs;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "datos", columnDefinition = "jsonb", nullable = false)
    private Map<String, Object> datos;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    /** Constructor vacoto requerido por JPA. */
    public RegistroAccion() {
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
    public EventoSistema getEventoId() {
        return eventoId;
    }

    /** Establece la entidad relacionada. */
    public void setEventoId(EventoSistema eventoId) {
        this.eventoId = eventoId;
    }

    /** Obtiene la columna {@code codigo_evento}. */
    public String getCodigoEvento() {
        return codigoEvento;
    }

    /** Establece la columna {@code codigo_evento}. */
    public void setCodigoEvento(String codigoEvento) {
        this.codigoEvento = codigoEvento;
    }

    /** Obtiene la entidad relacionada. */
    public Perfil getActorId() {
        return actorId;
    }

    /** Establece la entidad relacionada. */
    public void setActorId(Perfil actorId) {
        this.actorId = actorId;
    }

    /** Obtiene la entidad relacionada. */
    public Perfil getUsuarioObjetivoId() {
        return usuarioObjetivoId;
    }

    /** Establece la entidad relacionada. */
    public void setUsuarioObjetivoId(Perfil usuarioObjetivoId) {
        this.usuarioObjetivoId = usuarioObjetivoId;
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

    /** Obtiene la columna {@code accion}. */
    public TipoAccion getAccion() {
        return accion;
    }

    /** Establece la columna {@code accion}. */
    public void setAccion(TipoAccion accion) {
        this.accion = accion;
    }

    /** Obtiene la columna {@code valor_anterior}. */
    public Map<String, Object> getValorAnterior() {
        return valorAnterior;
    }

    /** Establece la columna {@code valor_anterior}. */
    public void setValorAnterior(Map<String, Object> valorAnterior) {
        this.valorAnterior = valorAnterior;
    }

    /** Obtiene la columna {@code valor_nuevo}. */
    public Map<String, Object> getValorNuevo() {
        return valorNuevo;
    }

    /** Establece la columna {@code valor_nuevo}. */
    public void setValorNuevo(Map<String, Object> valorNuevo) {
        this.valorNuevo = valorNuevo;
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

    /** Obtiene la columna {@code ruta}. */
    public String getRuta() {
        return ruta;
    }

    /** Establece la columna {@code ruta}. */
    public void setRuta(String ruta) {
        this.ruta = ruta;
    }

    /** Obtiene la columna {@code metodo}. */
    public String getMetodo() {
        return metodo;
    }

    /** Establece la columna {@code metodo}. */
    public void setMetodo(String metodo) {
        this.metodo = metodo;
    }

    /** Obtiene la columna {@code exito}. */
    public Boolean getExito() {
        return exito;
    }

    /** Establece la columna {@code exito}. */
    public void setExito(Boolean exito) {
        this.exito = exito;
    }

    /** Obtiene la columna {@code mensaje_error}. */
    public String getMensajeError() {
        return mensajeError;
    }

    /** Establece la columna {@code mensaje_error}. */
    public void setMensajeError(String mensajeError) {
        this.mensajeError = mensajeError;
    }

    /** Obtiene la columna {@code correlation_id}. */
    public String getCorrelationId() {
        return correlationId;
    }

    /** Establece la columna {@code correlation_id}. */
    public void setCorrelationId(String correlationId) {
        this.correlationId = correlationId;
    }

    /** Obtiene la columna {@code duracion_ms}. */
    public Integer getDuracionMs() {
        return duracionMs;
    }

    /** Establece la columna {@code duracion_ms}. */
    public void setDuracionMs(Integer duracionMs) {
        this.duracionMs = duracionMs;
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
        if (!(o instanceof RegistroAccion other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
