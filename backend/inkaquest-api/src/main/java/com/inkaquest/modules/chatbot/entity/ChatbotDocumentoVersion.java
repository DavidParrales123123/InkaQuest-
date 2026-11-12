package com.inkaquest.modules.chatbot.entity;

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
import java.time.Instant;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import jakarta.persistence.GenerationType;

/**
 * Entidad JPA de la tabla {@code public.chatbot_documento_version}.
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
@Table(name = "chatbot_documento_version")
public class ChatbotDocumentoVersion implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "documento_id", referencedColumnName = "id")
    private ChatbotDocumento documentoId;

    @Column(name = "version", nullable = false)
    private Integer version;

    @Column(name = "hash_sha256", nullable = true)
    private String hashSha256;

    @Column(name = "resumen_cambios", nullable = true)
    private String resumenCambios;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "datos", columnDefinition = "jsonb", nullable = false)
    private Map<String, Object> datos;

    @Column(name = "publicada_en", nullable = false)
    private Instant publicadaEn;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "publicado_por", referencedColumnName = "id")
    private Perfil publicadoPor;

    /** Constructor vacoto requerido por JPA. */
    public ChatbotDocumentoVersion() {
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

    /** Obtiene la columna {@code hash_sha256}. */
    public String getHashSha256() {
        return hashSha256;
    }

    /** Establece la columna {@code hash_sha256}. */
    public void setHashSha256(String hashSha256) {
        this.hashSha256 = hashSha256;
    }

    /** Obtiene la columna {@code resumen_cambios}. */
    public String getResumenCambios() {
        return resumenCambios;
    }

    /** Establece la columna {@code resumen_cambios}. */
    public void setResumenCambios(String resumenCambios) {
        this.resumenCambios = resumenCambios;
    }

    /** Obtiene la columna {@code datos}. */
    public Map<String, Object> getDatos() {
        return datos;
    }

    /** Establece la columna {@code datos}. */
    public void setDatos(Map<String, Object> datos) {
        this.datos = datos;
    }

    /** Obtiene la columna {@code publicada_en}. */
    public Instant getPublicadaEn() {
        return publicadaEn;
    }

    /** Establece la columna {@code publicada_en}. */
    public void setPublicadaEn(Instant publicadaEn) {
        this.publicadaEn = publicadaEn;
    }

    /** Obtiene la entidad relacionada. */
    public Perfil getPublicadoPor() {
        return publicadoPor;
    }

    /** Establece la entidad relacionada. */
    public void setPublicadoPor(Perfil publicadoPor) {
        this.publicadoPor = publicadoPor;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof ChatbotDocumentoVersion other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
