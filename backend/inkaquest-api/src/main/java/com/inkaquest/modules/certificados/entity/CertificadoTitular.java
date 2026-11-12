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
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import jakarta.persistence.GenerationType;

/**
 * Entidad JPA de la tabla {@code public.certificado_titular}.
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
@Table(name = "certificado_titular")
public class CertificadoTitular implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "certificado_id", referencedColumnName = "id")
    private Certificado certificadoId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", referencedColumnName = "id")
    private Perfil usuarioId;

    @Column(name = "nombre_completo", nullable = false)
    private String nombreCompleto;

    @Column(name = "documento", nullable = true)
    private String documento;

    @Column(name = "porcentaje_progreso", precision = 5, scale = 2, nullable = false)
    private BigDecimal porcentajeProgreso;

    @Column(name = "nota_final", precision = 8, scale = 2, nullable = true)
    private BigDecimal notaFinal;

    @Column(name = "es_principal", nullable = false)
    private Boolean esPrincipal;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    /** Constructor vacoto requerido por JPA. */
    public CertificadoTitular() {
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

    /** Obtiene la entidad relacionada. */
    public Perfil getUsuarioId() {
        return usuarioId;
    }

    /** Establece la entidad relacionada. */
    public void setUsuarioId(Perfil usuarioId) {
        this.usuarioId = usuarioId;
    }

    /** Obtiene la columna {@code nombre_completo}. */
    public String getNombreCompleto() {
        return nombreCompleto;
    }

    /** Establece la columna {@code nombre_completo}. */
    public void setNombreCompleto(String nombreCompleto) {
        this.nombreCompleto = nombreCompleto;
    }

    /** Obtiene la columna {@code documento}. */
    public String getDocumento() {
        return documento;
    }

    /** Establece la columna {@code documento}. */
    public void setDocumento(String documento) {
        this.documento = documento;
    }

    /** Obtiene la columna {@code porcentaje_progreso}. */
    public BigDecimal getPorcentajeProgreso() {
        return porcentajeProgreso;
    }

    /** Establece la columna {@code porcentaje_progreso}. */
    public void setPorcentajeProgreso(BigDecimal porcentajeProgreso) {
        this.porcentajeProgreso = porcentajeProgreso;
    }

    /** Obtiene la columna {@code nota_final}. */
    public BigDecimal getNotaFinal() {
        return notaFinal;
    }

    /** Establece la columna {@code nota_final}. */
    public void setNotaFinal(BigDecimal notaFinal) {
        this.notaFinal = notaFinal;
    }

    /** Obtiene la columna {@code es_principal}. */
    public Boolean getEsPrincipal() {
        return esPrincipal;
    }

    /** Establece la columna {@code es_principal}. */
    public void setEsPrincipal(Boolean esPrincipal) {
        this.esPrincipal = esPrincipal;
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
        if (!(o instanceof CertificadoTitular other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
