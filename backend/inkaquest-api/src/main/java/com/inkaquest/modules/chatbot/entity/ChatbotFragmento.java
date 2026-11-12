package com.inkaquest.modules.chatbot.entity;

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
import java.time.Instant;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import org.hibernate.annotations.ColumnTransformer;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;
import jakarta.persistence.GenerationType;

/**
 * Entidad JPA de la tabla {@code public.chatbot_fragmento}.
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
@Table(name = "chatbot_fragmento")
public class ChatbotFragmento implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "documento_id", referencedColumnName = "id")
    private ChatbotDocumento documentoId;

    @Column(name = "version", nullable = false)
    private Integer version;

    @Column(name = "orden", nullable = false)
    private Integer orden;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "rol_minimo", columnDefinition = "rol_usuario", nullable = true)
    private RolUsuario rolMinimo;

    @Column(name = "contenido", nullable = false)
    private String contenido;

    @Column(name = "tokens", nullable = true)
    private String tokens;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadatos", columnDefinition = "jsonb", nullable = false)
    private Map<String, Object> metadatos;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    @ColumnTransformer(write = "?::vector(1536)")
    @Column(name = "embedding", columnDefinition = "vector(1536)", nullable = true)
    private String embedding;

    /** Constructor vacoto requerido por JPA. */
    public ChatbotFragmento() {
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
    public ChatbotDocumento getDocumentoId() {
        return documentoId;
    }

    /** Establece la entidad relacionada. */
    public void setDocumentoId(ChatbotDocumento documentoId) {
        this.documentoId = documentoId;
    }

    /** Obtiene la columna {@code version}. */
    public Integer getVersion() {
        return version;
    }

    /** Establece la columna {@code version}. */
    public void setVersion(Integer version) {
        this.version = version;
    }

    /** Obtiene la columna {@code orden}. */
    public Integer getOrden() {
        return orden;
    }

    /** Establece la columna {@code orden}. */
    public void setOrden(Integer orden) {
        this.orden = orden;
    }

    /** Obtiene la columna {@code rol_minimo}. */
    public RolUsuario getRolMinimo() {
        return rolMinimo;
    }

    /** Establece la columna {@code rol_minimo}. */
    public void setRolMinimo(RolUsuario rolMinimo) {
        this.rolMinimo = rolMinimo;
    }

    /** Obtiene la columna {@code contenido}. */
    public String getContenido() {
        return contenido;
    }

    /** Establece la columna {@code contenido}. */
    public void setContenido(String contenido) {
        this.contenido = contenido;
    }

    /** Obtiene la columna {@code tokens}. */
    public String getTokens() {
        return tokens;
    }

    /** Establece la columna {@code tokens}. */
    public void setTokens(String tokens) {
        this.tokens = tokens;
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

    /** Obtiene la columna {@code embedding}. */
    public String getEmbedding() {
        return embedding;
    }

    /** Establece la columna {@code embedding}. */
    public void setEmbedding(String embedding) {
        this.embedding = embedding;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof ChatbotFragmento other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
