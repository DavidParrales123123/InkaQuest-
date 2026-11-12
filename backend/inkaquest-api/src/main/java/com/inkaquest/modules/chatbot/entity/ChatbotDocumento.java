package com.inkaquest.modules.chatbot.entity;

import com.inkaquest.modules.academico.entity.Curso;
import com.inkaquest.modules.identidad.entity.Perfil;
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
import java.util.Objects;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;
import jakarta.persistence.GenerationType;

/**
 * Entidad JPA de la tabla {@code public.chatbot_documento}.
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
@Table(name = "chatbot_documento")
public class ChatbotDocumento implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @Column(name = "titulo", nullable = false)
    private String titulo;

    @Column(name = "slug", nullable = false)
    private String slug;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "rol_minimo", columnDefinition = "rol_usuario", nullable = true)
    private RolUsuario rolMinimo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "curso_id", referencedColumnName = "id")
    private Curso cursoId;

    @Column(name = "origen", nullable = false)
    private String origen;

    @Column(name = "ruta_storage", nullable = true)
    private String rutaStorage;

    @Column(name = "mime_type", nullable = true)
    private String mimeType;

    @Column(name = "indexado", nullable = false)
    private Boolean indexado;

    @Column(name = "fragmentos", nullable = false)
    private Integer fragmentos;

    @Column(name = "embedding_modelo", nullable = true)
    private String embeddingModelo;

    @Column(name = "version_actual", nullable = false)
    private Integer versionActual;

    @Column(name = "activo", nullable = false)
    private Boolean activo;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creado_por", referencedColumnName = "id")
    private Perfil creadoPor;

    @UpdateTimestamp
    @Column(name = "actualizado_en", nullable = false)
    private Instant actualizadoEn;

    /** Constructor vacoto requerido por JPA. */
    public ChatbotDocumento() {
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

    /** Obtiene la columna {@code titulo}. */
    public String getTitulo() {
        return titulo;
    }

    /** Establece la columna {@code titulo}. */
    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    /** Obtiene la columna {@code slug}. */
    public String getSlug() {
        return slug;
    }

    /** Establece la columna {@code slug}. */
    public void setSlug(String slug) {
        this.slug = slug;
    }

    /** Obtiene la columna {@code rol_minimo}. */
    public RolUsuario getRolMinimo() {
        return rolMinimo;
    }

    /** Establece la columna {@code rol_minimo}. */
    public void setRolMinimo(RolUsuario rolMinimo) {
        this.rolMinimo = rolMinimo;
    }

    /** Obtiene la entidad relacionada. */
    public Curso getCursoId() {
        return cursoId;
    }

    /** Establece la entidad relacionada. */
    public void setCursoId(Curso cursoId) {
        this.cursoId = cursoId;
    }

    /** Obtiene la columna {@code origen}. */
    public String getOrigen() {
        return origen;
    }

    /** Establece la columna {@code origen}. */
    public void setOrigen(String origen) {
        this.origen = origen;
    }

    /** Obtiene la columna {@code ruta_storage}. */
    public String getRutaStorage() {
        return rutaStorage;
    }

    /** Establece la columna {@code ruta_storage}. */
    public void setRutaStorage(String rutaStorage) {
        this.rutaStorage = rutaStorage;
    }

    /** Obtiene la columna {@code mime_type}. */
    public String getMimeType() {
        return mimeType;
    }

    /** Establece la columna {@code mime_type}. */
    public void setMimeType(String mimeType) {
        this.mimeType = mimeType;
    }

    /** Obtiene la columna {@code indexado}. */
    public Boolean getIndexado() {
        return indexado;
    }

    /** Establece la columna {@code indexado}. */
    public void setIndexado(Boolean indexado) {
        this.indexado = indexado;
    }

    /** Obtiene la columna {@code fragmentos}. */
    public Integer getFragmentos() {
        return fragmentos;
    }

    /** Establece la columna {@code fragmentos}. */
    public void setFragmentos(Integer fragmentos) {
        this.fragmentos = fragmentos;
    }

    /** Obtiene la columna {@code embedding_modelo}. */
    public String getEmbeddingModelo() {
        return embeddingModelo;
    }

    /** Establece la columna {@code embedding_modelo}. */
    public void setEmbeddingModelo(String embeddingModelo) {
        this.embeddingModelo = embeddingModelo;
    }

    /** Obtiene la columna {@code version_actual}. */
    public Integer getVersionActual() {
        return versionActual;
    }

    /** Establece la columna {@code version_actual}. */
    public void setVersionActual(Integer versionActual) {
        this.versionActual = versionActual;
    }

    /** Obtiene la columna {@code activo}. */
    public Boolean getActivo() {
        return activo;
    }

    /** Establece la columna {@code activo}. */
    public void setActivo(Boolean activo) {
        this.activo = activo;
    }

    /** Obtiene la columna {@code creado_en}. */
    public Instant getCreadoEn() {
        return creadoEn;
    }

    /** Establece la columna {@code creado_en}. */
    public void setCreadoEn(Instant creadoEn) {
        this.creadoEn = creadoEn;
    }

    /** Obtiene la entidad relacionada. */
    public Perfil getCreadoPor() {
        return creadoPor;
    }

    /** Establece la entidad relacionada. */
    public void setCreadoPor(Perfil creadoPor) {
        this.creadoPor = creadoPor;
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
        if (!(o instanceof ChatbotDocumento other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
