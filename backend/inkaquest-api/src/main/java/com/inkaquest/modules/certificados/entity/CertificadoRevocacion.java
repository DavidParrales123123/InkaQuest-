package com.inkaquest.modules.certificados.entity;

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
import java.util.Objects;
import java.util.UUID;
import jakarta.persistence.GenerationType;

/**
 * Entidad JPA de la tabla {@code public.certificado_revocacion}.
 *
 * <p>Mapeo derivado del esquema real de PostgreSQL (proyecto
 * {@code nrfdifzechrjikrvzhdl}). La tabla pertenece al modulo
 * {@code certificados} y esta protegida por RLS: el acceso real depende
 * del contexto de autorizacion de la transaccion.</p>
 *
 * <p>El esquema de la base de datos es propiedad de las migraciones SQL
 * ({@code supabase/migrations}). Esta entidad NO genera el esquema: la
 * propiedad {@code ddl-auto} se fija en {@code none}.</p>
 */
@Entity
@Table(name = "certificado_revocacion")
public class CertificadoRevocacion implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "certificado_id", referencedColumnName = "id")
    private Certificado certificadoId;

    @Column(name = "motivo", nullable = false)
    private String motivo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "revocado_por", referencedColumnName = "id")
    private Perfil revocadoPor;

    @Column(name = "revocado_en", nullable = false)
    private Instant revocadoEn;

    /** Constructor vacoto requerido por JPA. */
    public CertificadoRevocacion() {
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
    public Certificado getCertificadoId() {
        return certificadoId;
    }

    /** Establece la entidad relacionada. */
    public void setCertificadoId(Certificado certificadoId) {
        this.certificadoId = certificadoId;
    }

    /** Obtiene la columna {@code motivo}. */
    public String getMotivo() {
        return motivo;
    }

    /** Establece la columna {@code motivo}. */
    public void setMotivo(String motivo) {
        this.motivo = motivo;
    }

    /** Obtiene la entidad relacionada. */
    public Perfil getRevocadoPor() {
        return revocadoPor;
    }

    /** Establece la entidad relacionada. */
    public void setRevocadoPor(Perfil revocadoPor) {
        this.revocadoPor = revocadoPor;
    }

    /** Obtiene la columna {@code revocado_en}. */
    public Instant getRevocadoEn() {
        return revocadoEn;
    }

    /** Establece la columna {@code revocado_en}. */
    public void setRevocadoEn(Instant revocadoEn) {
        this.revocadoEn = revocadoEn;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof CertificadoRevocacion other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
