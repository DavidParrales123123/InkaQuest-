package com.inkaquest.modules.chatbot.entity;

import com.inkaquest.modules.identidad.entity.Perfil;
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
import java.util.Objects;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;
import jakarta.persistence.GenerationType;

/**
 * Entidad JPA de la tabla {@code public.chatbot_participante}.
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
@Table(name = "chatbot_participante")
public class ChatbotParticipante implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversacion_id", referencedColumnName = "id")
    private ChatbotConversacion conversacionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", referencedColumnName = "id")
    private Perfil usuarioId;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "rol", columnDefinition = "rol_chatbot", nullable = false)
    private RolChatbot rol;

    @Column(name = "puede_ver_privado", nullable = false)
    private Boolean puedeVerPrivado;

    @Column(name = "unido_en", nullable = true)
    private Instant unidoEn;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    /** Constructor vacoto requerido por JPA. */
    public ChatbotParticipante() {
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
    public Perfil getUsuarioId() {
        return usuarioId;
    }

    /** Establece la entidad relacionada. */
    public void setUsuarioId(Perfil usuarioId) {
        this.usuarioId = usuarioId;
    }

    /** Obtiene la columna {@code rol}. */
    public RolChatbot getRol() {
        return rol;
    }

    /** Establece la columna {@code rol}. */
    public void setRol(RolChatbot rol) {
        this.rol = rol;
    }

    /** Obtiene la columna {@code puede_ver_privado}. */
    public Boolean getPuedeVerPrivado() {
        return puedeVerPrivado;
    }

    /** Establece la columna {@code puede_ver_privado}. */
    public void setPuedeVerPrivado(Boolean puedeVerPrivado) {
        this.puedeVerPrivado = puedeVerPrivado;
    }

    /** Obtiene la columna {@code unido_en}. */
    public Instant getUnidoEn() {
        return unidoEn;
    }

    /** Establece la columna {@code unido_en}. */
    public void setUnidoEn(Instant unidoEn) {
        this.unidoEn = unidoEn;
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
        if (!(o instanceof ChatbotParticipante other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
