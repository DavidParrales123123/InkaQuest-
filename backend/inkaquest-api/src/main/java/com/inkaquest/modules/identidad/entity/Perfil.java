package com.inkaquest.modules.identidad.entity;

import com.inkaquest.shared.enums.EstadoCuenta;
import com.inkaquest.shared.enums.RolUsuario;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Objects;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;
import jakarta.persistence.GenerationType;

/**
 * Entidad JPA de la tabla {@code public.perfil}.
 *
 * <p>Mapeo derivado del esquema real de PostgreSQL (proyecto
 * {@code nrfdifzechrjikrvzhdl}). La tabla pertenece al modulo
 * {@code identidad} y esta protegida por RLS: el acceso real depende
 * del contexto de autorizacion de la transaccion.</p>
 *
 * <p>El esquema de la base de datos es propiedad de las migraciones SQL
 * ({@code supabase/migrations}). Esta entidad NO genera el esquema: la
 * propiedad {@code ddl-auto} se fija en {@code none}.</p>
 */
@Entity
@Table(name = "perfil")
public class Perfil implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @Column(name = "email", nullable = false)
    private String email;

    @Column(name = "nombre", nullable = false)
    private String nombre;

    @Column(name = "apellido", nullable = true)
    private String apellido;

    @Column(name = "documento", nullable = true)
    private String documento;

    @Column(name = "genero", nullable = true)
    private String genero;

    @Column(name = "fecha_nacimiento", nullable = true)
    private LocalDate fechaNacimiento;

    @Column(name = "telefono", nullable = true)
    private String telefono;

    @Column(name = "avatar_url", nullable = true)
    private String avatarUrl;

    @Column(name = "bio", nullable = true)
    private String bio;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "rol", columnDefinition = "rol_usuario", nullable = false)
    private RolUsuario rol;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "estado_cuenta", columnDefinition = "estado_cuenta", nullable = false)
    private EstadoCuenta estadoCuenta;

    @Column(name = "xp", nullable = false)
    private Integer xp;

    @Column(name = "nivel", nullable = false)
    private Integer nivel;

    @Column(name = "racha_dias", nullable = false)
    private Integer rachaDias;

    @Column(name = "ultima_conexion", nullable = true)
    private Instant ultimaConexion;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    @UpdateTimestamp
    @Column(name = "actualizado_en", nullable = false)
    private Instant actualizadoEn;

    /** Constructor vacoto requerido por JPA. */
    public Perfil() {
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

    /** Obtiene la columna {@code email}. */
    public String getEmail() {
        return email;
    }

    /** Establece la columna {@code email}. */
    public void setEmail(String email) {
        this.email = email;
    }

    /** Obtiene la columna {@code nombre}. */
    public String getNombre() {
        return nombre;
    }

    /** Establece la columna {@code nombre}. */
    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    /** Obtiene la columna {@code apellido}. */
    public String getApellido() {
        return apellido;
    }

    /** Establece la columna {@code apellido}. */
    public void setApellido(String apellido) {
        this.apellido = apellido;
    }

    /** Obtiene la columna {@code documento}. */
    public String getDocumento() {
        return documento;
    }

    /** Establece la columna {@code documento}. */
    public void setDocumento(String documento) {
        this.documento = documento;
    }

    /** Obtiene la columna {@code genero}. */
    public String getGenero() {
        return genero;
    }

    /** Establece la columna {@code genero}. */
    public void setGenero(String genero) {
        this.genero = genero;
    }

    /** Obtiene la columna {@code fecha_nacimiento}. */
    public LocalDate getFechaNacimiento() {
        return fechaNacimiento;
    }

    /** Establece la columna {@code fecha_nacimiento}. */
    public void setFechaNacimiento(LocalDate fechaNacimiento) {
        this.fechaNacimiento = fechaNacimiento;
    }

    /** Obtiene la columna {@code telefono}. */
    public String getTelefono() {
        return telefono;
    }

    /** Establece la columna {@code telefono}. */
    public void setTelefono(String telefono) {
        this.telefono = telefono;
    }

    /** Obtiene la columna {@code avatar_url}. */
    public String getAvatarUrl() {
        return avatarUrl;
    }

    /** Establece la columna {@code avatar_url}. */
    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    /** Obtiene la columna {@code bio}. */
    public String getBio() {
        return bio;
    }

    /** Establece la columna {@code bio}. */
    public void setBio(String bio) {
        this.bio = bio;
    }

    /** Obtiene la columna {@code rol}. */
    public RolUsuario getRol() {
        return rol;
    }

    /** Establece la columna {@code rol}. */
    public void setRol(RolUsuario rol) {
        this.rol = rol;
    }

    /** Obtiene la columna {@code estado_cuenta}. */
    public EstadoCuenta getEstadoCuenta() {
        return estadoCuenta;
    }

    /** Establece la columna {@code estado_cuenta}. */
    public void setEstadoCuenta(EstadoCuenta estadoCuenta) {
        this.estadoCuenta = estadoCuenta;
    }

    /** Obtiene la columna {@code xp}. */
    public Integer getXp() {
        return xp;
    }

    /** Establece la columna {@code xp}. */
    public void setXp(Integer xp) {
        this.xp = xp;
    }

    /** Obtiene la columna {@code nivel}. */
    public Integer getNivel() {
        return nivel;
    }

    /** Establece la columna {@code nivel}. */
    public void setNivel(Integer nivel) {
        this.nivel = nivel;
    }

    /** Obtiene la columna {@code racha_dias}. */
    public Integer getRachaDias() {
        return rachaDias;
    }

    /** Establece la columna {@code racha_dias}. */
    public void setRachaDias(Integer rachaDias) {
        this.rachaDias = rachaDias;
    }

    /** Obtiene la columna {@code ultima_conexion}. */
    public Instant getUltimaConexion() {
        return ultimaConexion;
    }

    /** Establece la columna {@code ultima_conexion}. */
    public void setUltimaConexion(Instant ultimaConexion) {
        this.ultimaConexion = ultimaConexion;
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
        if (!(o instanceof Perfil other)) {
            return false;
        }
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
