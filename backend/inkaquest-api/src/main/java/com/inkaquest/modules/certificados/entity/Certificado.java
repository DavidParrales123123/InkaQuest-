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
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import jakarta.persistence.GenerationType;

/**
 * Entidad JPA de la tabla {@code public.certificado}.
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
@Table(name = "certificado")
public class Certificado implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @Column(name = "codigo", nullable = false)
    private String codigo;

    @Column(name = "estado", nullable = false)
    private String estado;

    @Column(name = "emitido_en", nullable = false)
    private Instant emitidoEn;

    @Column(name = "expira_en", nullable = true)
    private Instant expiraEn;

    @Column(name = "plantilla", nullable = true)
    private String plantilla;

    @Column(name = "url_documento", nullable = true)
    private String urlDocumento;

    @Column(name = "ruta_storage", nullable = true)
    private String rutaStorage;

    @Column(name = "hash_sha256", nullable = true)
    private String hashSha256;

    @Column(name = "verificado", nullable = false)
    private Boolean verificado;

    @Column(name = "veces_verificado", nullable = false)
    private Integer vecesVerificado;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "emitido_por", referencedColumnName = "id")
    private Perfil emitidoPor;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    @UpdateTimestamp
    @Column(name = "actualizado_en", nullable = false)
    private Instant actualizadoEn;

    /** Constructor vacoto requerido por JPA. */
    public Certificado() {
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

    /** Obtiene la columna {@code codigo}. */
    public String getCodigo() {
        return codigo;
    }

    /** Establece la columna {@code codigo}. */
    public void setCodigo(String codigo) {
        this.codigo = codigo;
    }

    /** Obtiene la columna {@code estado}. */
    public String getEstado() {
        return estado;
    }

    /** Establece la columna {@code estado}. */
    public void setEstado(String estado) {
        this.estado = estado;
    }

    /** Obtiene la columna {@code emitido_en}. */
    public Instant getEmitidoEn() {
        return emitidoEn;
    }

    /** Establece la columna {@code emitido_en}. */
    public void setEmitidoEn(Instant emitidoEn) {
        this.emitidoEn = emitidoEn;
    }

    /** Obtiene la columna {@code expira_en}. */
    public Instant getExpiraEn() {
        return expiraEn;
    }

    /** Establece la columna {@code expira_en}. */
    public void setExpiraEn(Instant expiraEn) {
        this.expiraEn = expiraEn;
    }

    /** Obtiene la columna {@code plantilla}. */
    public String getPlantilla() {
        return plantilla;
    }

    /** Establece la columna {@code plantilla}. */
    public void setPlantilla(String plantilla) {
        this.plantilla = plantilla;
    }

    /** Obtiene la columna {@code url_documento}. */
    public String getUrlDocumento() {
        return urlDocumento;
    }

    /** Establece la columna {@code url_documento}. */
    public void setUrlDocumento(String urlDocumento) {
        this.urlDocumento = urlDocumento;
    }

    /** Obtiene la columna {@code ruta_storage}. */
    public String getRutaStorage() {
        return rutaStorage;
    }

    /** Establece la columna {@code ruta_storage}. */
    public void setRutaStorage(String rutaStorage) {
        this.rutaStorage = rutaStorage;
    }

    /** Obtiene la columna {@code hash_sha256}. */
    public String getHashSha256() {
        return hashSha256;
    }

    /** Establece la columna {@code hash_sha256}. */
    public void setHashSha256(String hashSha256) {
        this.hashSha256 = hashSha256;
    }

    /** Obtiene la columna {@code verificado}. */
    public Boolean getVerificado() {
        return verificado;
    }

    /** Establece la columna {@code verificado}. */
    public void setVerificado(Boolean verificado) {
        this.verificado = verificado;
    }

    /** Obtiene la columna {@code veces_verificado}. */
    public Integer getVecesVerificado() {
        return vecesVerificado;
    }

    /** Establece la columna {@code veces_verificado}. */
    public void setVecesVerificado(Integer vecesVerificado) {
        this.vecesVerificado = vecesVerificado;
    }

    /** Obtiene la entidad relacionada. */
    public Perfil getEmitidoPor() {
        return emitidoPor;
    }

    /** Establece la entidad relacionada. */
    public void setEmitidoPor(Perfil emitidoPor) {
        this.emitidoPor = emitidoPor;
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
        if (!(o instanceof Certificado other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
