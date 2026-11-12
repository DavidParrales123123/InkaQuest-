package com.inkaquest.modules.certificados.entity;

import com.inkaquest.modules.academico.entity.Curso;
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
 * Entidad JPA de la tabla {@code public.certificado_curso}.
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
@Table(name = "certificado_curso")
public class CertificadoCurso implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "certificado_id", referencedColumnName = "id")
    private Certificado certificadoId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "curso_id", referencedColumnName = "id")
    private Curso cursoId;

    @Column(name = "titulo_snapshot", nullable = false)
    private String tituloSnapshot;

    @Column(name = "horas", nullable = false)
    private Integer horas;

    @Column(name = "porcentaje_progreso", precision = 5, scale = 2, nullable = false)
    private BigDecimal porcentajeProgreso;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    /** Constructor vacoto requerido por JPA. */
    public CertificadoCurso() {
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
    public Curso getCursoId() {
        return cursoId;
    }

    /** Establece la entidad relacionada. */
    public void setCursoId(Curso cursoId) {
        this.cursoId = cursoId;
    }

    /** Obtiene la columna {@code titulo_snapshot}. */
    public String getTituloSnapshot() {
        return tituloSnapshot;
    }

    /** Establece la columna {@code titulo_snapshot}. */
    public void setTituloSnapshot(String tituloSnapshot) {
        this.tituloSnapshot = tituloSnapshot;
    }

    /** Obtiene la columna {@code horas}. */
    public Integer getHoras() {
        return horas;
    }

    /** Establece la columna {@code horas}. */
    public void setHoras(Integer horas) {
        this.horas = horas;
    }

    /** Obtiene la columna {@code porcentaje_progreso}. */
    public BigDecimal getPorcentajeProgreso() {
        return porcentajeProgreso;
    }

    /** Establece la columna {@code porcentaje_progreso}. */
    public void setPorcentajeProgreso(BigDecimal porcentajeProgreso) {
        this.porcentajeProgreso = porcentajeProgreso;
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
        if (!(o instanceof CertificadoCurso other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
