package com.inkaquest.modules.comercio.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.inkaquest.modules.comercio.dto.ConfiguracionPagoResponse;
import com.inkaquest.modules.comercio.dto.GuardarTarjetaRequest;
import com.inkaquest.modules.comercio.dto.TarjetaGuardadaResponse;
import com.inkaquest.modules.comercio.entity.TarjetaGuardada;
import com.inkaquest.modules.comercio.repository.TarjetaGuardadaRepository;
import com.inkaquest.modules.identidad.entity.Perfil;
import com.inkaquest.modules.identidad.repository.PerfilRepository;
import com.inkaquest.shared.exception.BadRequestException;
import com.inkaquest.shared.exception.ResourceNotFoundException;
import com.inkaquest.shared.security.RlsExecutor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Tarjetas guardadas en el vault de Culqi.
 *
 * <p>El PAN y el CVV nunca llegan a nuestro backend ni a nuestra BD: Culqi.js
 * tokeniza en el navegador y aquí solo se guarda la referencia devuelta por
 * Culqi (customer/card) y metadata no sensible.</p>
 */
@Service
public class TarjetasService {

    private final TarjetaGuardadaRepository tarjetas;
    private final PerfilRepository perfiles;
    private final CulqiClient culqi;
    private final CulqiConfig config;
    private final RlsExecutor rls;

    public TarjetasService(TarjetaGuardadaRepository tarjetas, PerfilRepository perfiles,
                           CulqiClient culqi, CulqiConfig config, RlsExecutor rls) {
        this.tarjetas = tarjetas;
        this.perfiles = perfiles;
        this.culqi = culqi;
        this.config = config;
        this.rls = rls;
    }

    public ConfiguracionPagoResponse configuracion() {
        return new ConfiguracionPagoResponse(config.getPublicKey(), "PEN",
                config.configurado() && config.configuradoPublica());
    }

    @Transactional(readOnly = true)
    public List<TarjetaGuardadaResponse> listar(UUID usuarioId) {
        return rls.executeAs(usuarioId, () -> tarjetas
                .findAllByUsuarioId_IdAndActivoTrueOrderByCreadoEnDesc(usuarioId)
                .stream().map(this::aResponse).toList());
    }

    @Transactional
    public TarjetaGuardadaResponse guardar(UUID usuarioId, GuardarTarjetaRequest request) {
        if (!config.configurado() || !config.configuradoPublica()) {
            throw new BadRequestException("Los pagos con Culqi no están configurados en el servidor.");
        }
        String token = request.tokenId() == null ? "" : request.tokenId().trim();
        if (!token.matches("^[A-Za-z0-9_-]{8,100}$")) {
            throw new BadRequestException("El token de Culqi no es válido.");
        }
        return rls.executeAs(usuarioId, () -> {
            Perfil perfil = perfiles.findById(usuarioId)
                    .orElseThrow(() -> new ResourceNotFoundException("Perfil no encontrado."));
            String customerId = perfil.getCulqiCustomerId();
            if (customerId == null || customerId.isBlank()) {
                customerId = culqi.crearCustomer(perfil.getNombre(), perfil.getApellido(),
                        perfil.getEmail(), perfil.getTelefono());
                perfil.setCulqiCustomerId(customerId);
                perfiles.save(perfil);
            }

            JsonNode tarjeta = culqi.crearTarjeta(customerId, token);
            String cardId = tarjeta.path("id").asText(null);
            if (cardId == null || cardId.isBlank()) {
                throw new BadRequestException("Culqi no devolvió una tarjeta válida.");
            }
            JsonNode source = tarjeta.path("source");
            String ultimos4 =(source.path("last4").asText("0000"));
            if (!ultimos4.matches("^[0-9]{4}$")) ultimos4 = "0000";

            TarjetaGuardada guardada = new TarjetaGuardada();
            guardada.setUsuarioId(perfil);
            guardada.setCulqiCustomerId(customerId);
            guardada.setCulqiCardId(cardId);
            guardada.setMarca(limitar(source.path("brand").asText(null), 40));
            guardada.setUltimos4(ultimos4);
            guardada.setMesExpiracion(numero(source.path("exp_month")));
            guardada.setAnioExpiracion(numero(source.path("exp_year")));
            guardada.setActivo(true);
            return aResponse(tarjetas.save(guardada));
        });
    }

    @Transactional
    public void eliminar(UUID usuarioId, UUID tarjetaId) {
        TarjetaGuardada tarjeta = rls.executeAs(usuarioId, () -> tarjetas.findById(tarjetaId)
                .filter(t -> t.getUsuarioId() != null && t.getUsuarioId().getId().equals(usuarioId))
                .orElseThrow(() -> new ResourceNotFoundException("Tarjeta no encontrada.")));
        try {
            culqi.eliminarTarjeta(tarjeta.getCulqiCardId());
        } catch (CulqiClient.CulqiException ex) {
            // Si Culqi ya la eliminó, seguimos y la damos de baja localmente.
        }
        tarjeta.setActivo(false);
        rls.executeAs(usuarioId, () -> tarjetas.save(tarjeta));
    }

    /** Única forma de obtener el id de tarjeta para un pago; valida propiedad. */
    @Transactional(readOnly = true)
    public String tarjetaDeUsuario(UUID usuarioId, UUID tarjetaId) {
        return rls.executeAs(usuarioId, () -> tarjetas.findById(tarjetaId)
                .filter(t -> t.isActivo() && t.getUsuarioId() != null
                        && t.getUsuarioId().getId().equals(usuarioId))
                .orElseThrow(() -> new BadRequestException("El método de pago no es válido."))
                .getCulqiCardId());
    }

    private TarjetaGuardadaResponse aResponse(TarjetaGuardada t) {
        return new TarjetaGuardadaResponse(t.getId(), t.getMarca(), t.getUltimos4(),
                t.getMesExpiracion(), t.getAnioExpiracion(), t.isActivo(), t.getCreadoEn());
    }

    private Integer numero(JsonNode nodo) {
        if (nodo == null || nodo.isNull()) return null;
        try { return nodo.asInt(); } catch (RuntimeException ex) { return null; }
    }

    private String limitar(String valor, int max) {
        if (valor == null || valor.isBlank()) return null;
        return valor.length() > max ? valor.substring(0, max) : valor;
    }
}
