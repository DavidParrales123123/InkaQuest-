package com.inkaquest.modules.comercio.entity;

import com.inkaquest.modules.identidad.entity.Perfil;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;

/**
 * Referencia a una tarjeta guardada en el vault de Culqi.
 *
 * <p><b>NO contiene PAN, CVV ni datos sensibles.</b> Solo el id del customer,
 * el id de la tarjeta en Culqi y metadata no sensible (marca y últimos 4).</p>
 */
@Entity
@Table(name = "tarjeta_guardada")
public class TarjetaGuardada implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Perfil usuarioId;

    @Column(name = "culqi_customer_id", nullable = false)
    private String culqiCustomerId;

    @Column(name = "culqi_card_id", nullable = false, unique = true)
    private String culqiCardId;

    @Column(name = "marca")
    private String marca;

    @Column(name = "ultimos4", nullable = false)
    private String ultimos4;

    @Column(name = "mes_expiracion")
    private Integer mesExpiracion;

    @Column(name = "anio_expiracion")
    private Integer anioExpiracion;

    @Column(name = "activo", nullable = false)
    private boolean activo = true;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    @UpdateTimestamp
    @Column(name = "actualizado_en", nullable = false)
    private Instant actualizadoEn;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public Perfil getUsuarioId() { return usuarioId; }
    public void setUsuarioId(Perfil usuarioId) { this.usuarioId = usuarioId; }
    public String getCulqiCustomerId() { return culqiCustomerId; }
    public void setCulqiCustomerId(String culqiCustomerId) { this.culqiCustomerId = culqiCustomerId; }
    public String getCulqiCardId() { return culqiCardId; }
    public void setCulqiCardId(String culqiCardId) { this.culqiCardId = culqiCardId; }
    public String getMarca() { return marca; }
    public void setMarca(String marca) { this.marca = marca; }
    public String getUltimos4() { return ultimos4; }
    public void setUltimos4(String ultimos4) { this.ultimos4 = ultimos4; }
    public Integer getMesExpiracion() { return mesExpiracion; }
    public void setMesExpiracion(Integer mesExpiracion) { this.mesExpiracion = mesExpiracion; }
    public Integer getAnioExpiracion() { return anioExpiracion; }
    public void setAnioExpiracion(Integer anioExpiracion) { this.anioExpiracion = anioExpiracion; }
    public boolean isActivo() { return activo; }
    public void setActivo(boolean activo) { this.activo = activo; }
    public Instant getCreadoEn() { return creadoEn; }
    public Instant getActualizadoEn() { return actualizadoEn; }
}
