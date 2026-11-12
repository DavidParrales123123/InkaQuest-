package com.inkaquest.modules.chatbot.entity;

import com.inkaquest.modules.identidad.entity.Perfil;
import com.inkaquest.shared.enums.OrigenMensaje;
import com.inkaquest.shared.enums.RolChatbot;
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
 * Entidad JPA de la tabla {@code public.chatbot_mensaje}.
 *
 * <p>Mapeo derivado del esquema real de PostgreSQL (proyecto
 * {@code nrfdifzechrjikrvzhdl}). La tabla pertenece al modulo
 * {@code chatbot} y esta protegida por RLS: el acceso real depende
 * del contexto de autorizacion de la transaccion.</p>
 *
 * <p>El esquema de la base de datos es propiedad de las migraciones SQL
 * ({@code supabase/migrations}). Esta entidad NO genera el esquema: la
 * propiedad {@code ddl-auto} se fija en {@code none}.</p>
 */
@Entity
@Table(name = "chatbot_mensaje")
public class ChatbotMensaje implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversacion_id", referencedColumnName = "id")
    private ChatbotConversacion conversacionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "autor_id", referencedColumnName = "id")
    private Perfil autorId;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "rol", columnDefinition = "rol_chatbot", nullable = false)
    private RolChatbot rol;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "origen", columnDefinition = "origen_mensaje", nullable = false)
    private OrigenMensaje origen;

    @Column(name = "contenido", nullable = false)
    private String contenido;

    @Column(name = "tokens_entrada", nullable = false)
    private Integer tokensEntrada;

    @Column(name = "tokens_salida", nullable = false)
    private Integer tokensSalida;

    @Column(name = "latencia_ms", nullable = true)
    private Integer latenciaMs;

    @Column(name = "modelo", nullable = true)
    private String modelo;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "datos", columnDefinition = "jsonb", nullable = false)
    private Map<String, Object> datos;

    @Column(name = "es_privado", nullable = false)
    private Boolean esPrivado;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    /** Constructor vacoto requerido por JPA. */
    public ChatbotMensaje() {
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
    public ChatbotConversacion getConversacionId() {
        return conversacionId;
    }

    /** Establece la entidad relacionada. */
    public void setConversacionId(ChatbotConversacion conversacionId) {
        this.conversacionId = conversacionId;
    }

    /** Obtiene la entidad relacionada. */
    public Perfil getAutorId() {
        return autorId;
    }

    /** Establece la entidad relacionada. */
    public void setAutorId(Perfil autorId) {
        this.autorId = autorId;
    }

    /** Obtiene la columna {@code rol}. */
    public RolChatbot getRol() {
        return rol;
    }

    /** Establece la columna {@code rol}. */
    public void setRol(RolChatbot rol) {
        this.rol = rol;
    }

    /** Obtiene la columna {@code origen}. */
    public OrigenMensaje getOrigen() {
        return origen;
    }

    /** Establece la columna {@code origen}. */
    public void setOrigen(OrigenMensaje origen) {
        this.origen = origen;
    }

    /** Obtiene la columna {@code contenido}. */
    public String getContenido() {
        return contenido;
    }

    /** Establece la columna {@code contenido}. */
    public void setContenido(String contenido) {
        this.contenido = contenido;
    }

    /** Obtiene la columna {@code tokens_entrada}. */
    public Integer getTokensEntrada() {
        return tokensEntrada;
    }

    /** Establece la columna {@code tokens_entrada}. */
    public void setTokensEntrada(Integer tokensEntrada) {
        this.tokensEntrada = tokensEntrada;
    }

    /** Obtiene la columna {@code tokens_salida}. */
    public Integer getTokensSalida() {
        return tokensSalida;
    }

    /** Establece la columna {@code tokens_salida}. */
    public void setTokensSalida(Integer tokensSalida) {
        this.tokensSalida = tokensSalida;
    }

    /** Obtiene la columna {@code latencia_ms}. */
    public Integer getLatenciaMs() {
        return latenciaMs;
    }

    /** Establece la columna {@code latencia_ms}. */
    public void setLatenciaMs(Integer latenciaMs) {
        this.latenciaMs = latenciaMs;
    }

    /** Obtiene la columna {@code modelo}. */
    public String getModelo() {
        return modelo;
    }

    /** Establece la columna {@code modelo}. */
    public void setModelo(String modelo) {
        this.modelo = modelo;
    }

    /** Obtiene la columna {@code datos}. */
    public Map<String, Object> getDatos() {
        return datos;
    }

    /** Establece la columna {@code datos}. */
    public void setDatos(Map<String, Object> datos) {
        this.datos = datos;
    }

    /** Obtiene la columna {@code es_privado}. */
    public Boolean getEsPrivado() {
        return esPrivado;
    }

    /** Establece la columna {@code es_privado}. */
    public void setEsPrivado(Boolean esPrivado) {
        this.esPrivado = esPrivado;
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
        if (!(o instanceof ChatbotMensaje other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
