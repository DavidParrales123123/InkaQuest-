package com.inkaquest.modules.chatbot.entity;

import com.inkaquest.modules.identidad.entity.Perfil;
import com.inkaquest.shared.enums.EstadoConversacion;
import com.inkaquest.shared.enums.RolUsuario;
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
 * Entidad JPA de la tabla {@code public.chatbot_conversacion}.
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
@Table(name = "chatbot_conversacion")
public class ChatbotConversacion implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", referencedColumnName = "id")
    private Perfil usuarioId;

    @Column(name = "titulo", nullable = true)
    private String titulo;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "estado", columnDefinition = "estado_conversacion", nullable = false)
    private EstadoConversacion estado;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "rol_usuario", columnDefinition = "rol_usuario", nullable = true)
    private RolUsuario rolUsuario;

    @Column(name = "modelo", nullable = false)
    private String modelo;

    @Column(name = "temperatura", precision = 3, scale = 2, nullable = false)
    private BigDecimal temperatura;

    @Column(name = "max_tokens", nullable = false)
    private Integer maxTokens;

    @Column(name = "resumen", nullable = true)
    private String resumen;

    @Column(name = "tokens_totales", nullable = false)
    private Integer tokensTotales;

    @Column(name = "escalado", nullable = false)
    private Boolean escalado;

    @Column(name = "cerrado_en", nullable = true)
    private Instant cerradoEn;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    @UpdateTimestamp
    @Column(name = "actualizado_en", nullable = false)
    private Instant actualizadoEn;

    /** Constructor vacoto requerido por JPA. */
    public ChatbotConversacion() {
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

    /** Obtiene la columna {@code titulo}. */
    public String getTitulo() {
        return titulo;
    }

    /** Establece la columna {@code titulo}. */
    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    /** Obtiene la columna {@code estado}. */
    public EstadoConversacion getEstado() {
        return estado;
    }

    /** Establece la columna {@code estado}. */
    public void setEstado(EstadoConversacion estado) {
        this.estado = estado;
    }

    /** Obtiene la columna {@code rol_usuario}. */
    public RolUsuario getRolUsuario() {
        return rolUsuario;
    }

    /** Establece la columna {@code rol_usuario}. */
    public void setRolUsuario(RolUsuario rolUsuario) {
        this.rolUsuario = rolUsuario;
    }

    /** Obtiene la columna {@code modelo}. */
    public String getModelo() {
        return modelo;
    }

    /** Establece la columna {@code modelo}. */
    public void setModelo(String modelo) {
        this.modelo = modelo;
    }

    /** Obtiene la columna {@code temperatura}. */
    public BigDecimal getTemperatura() {
        return temperatura;
    }

    /** Establece la columna {@code temperatura}. */
    public void setTemperatura(BigDecimal temperatura) {
        this.temperatura = temperatura;
    }

    /** Obtiene la columna {@code max_tokens}. */
    public Integer getMaxTokens() {
        return maxTokens;
    }

    /** Establece la columna {@code max_tokens}. */
    public void setMaxTokens(Integer maxTokens) {
        this.maxTokens = maxTokens;
    }

    /** Obtiene la columna {@code resumen}. */
    public String getResumen() {
        return resumen;
    }

    /** Establece la columna {@code resumen}. */
    public void setResumen(String resumen) {
        this.resumen = resumen;
    }

    /** Obtiene la columna {@code tokens_totales}. */
    public Integer getTokensTotales() {
        return tokensTotales;
    }

    /** Establece la columna {@code tokens_totales}. */
    public void setTokensTotales(Integer tokensTotales) {
        this.tokensTotales = tokensTotales;
    }

    /** Obtiene la columna {@code escalado}. */
    public Boolean getEscalado() {
        return escalado;
    }

    /** Establece la columna {@code escalado}. */
    public void setEscalado(Boolean escalado) {
        this.escalado = escalado;
    }

    /** Obtiene la columna {@code cerrado_en}. */
    public Instant getCerradoEn() {
        return cerradoEn;
    }

    /** Establece la columna {@code cerrado_en}. */
    public void setCerradoEn(Instant cerradoEn) {
        this.cerradoEn = cerradoEn;
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
        if (!(o instanceof ChatbotConversacion other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
