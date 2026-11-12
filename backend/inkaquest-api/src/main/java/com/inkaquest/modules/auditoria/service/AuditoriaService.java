package com.inkaquest.modules.auditoria.service;

import com.inkaquest.modules.auditoria.entity.RegistroAccion;
import com.inkaquest.modules.auditoria.repository.RegistroAccionRepository;
import com.inkaquest.modules.identidad.entity.Perfil;
import com.inkaquest.shared.enums.TipoAccion;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Servicio de auditoria centralizada (seccion 36).
 *
 * <p><b>Importante.</b> NO abre su propia transaccion: debe llamarse dentro
 * de la transaccion del llamante (p. ej. en un bloque de administracion) para
 * que la accion auditada y su registro sean atomicos. Los datos sensibles
 * (passwords, tokens, CVV) nunca se incluyen aqui.</p>
 */
@Service
public class AuditoriaService {

    private final RegistroAccionRepository registroAccionRepository;

    public AuditoriaService(RegistroAccionRepository registroAccionRepository) {
        this.registroAccionRepository = registroAccionRepository;
    }

    /**
     * Registra una accion administrativa.
     *
     * @param accion        tipo de accion
     * @param actorId       UUID del usuario actor (p. ej. administrador), nullable
     * @param objetivoId    UUID del usuario objetivo (nullable)
     * @param entidadTipo   tabla/entidad afectada
     * @param entidadId     id del recurso (nullable)
     * @param valorAnterior estado previo (sin datos sensibles) o null
     * @param valorNuevo    estado resultante (sin datos sensibles) o null
     * @param exito         true si la operacion tuvo éxito
     * @param mensajeError  mensaje breve si fallo, o null
     */
    public void registrar(TipoAccion accion, UUID actorId, UUID objetivoId,
                          String entidadTipo, UUID entidadId,
                          Map<String, Object> valorAnterior, Map<String, Object> valorNuevo,
                          boolean exito, String mensajeError) {
        RegistroAccion registro = new RegistroAccion();
        registro.setAccion(accion);
        registro.setEventoId(null);
        registro.setCodigoEvento("AUD-" + accion.name().toUpperCase());
        if (actorId != null) {
            Perfil actor = new Perfil();
            actor.setId(actorId);
            registro.setActorId(actor);
        }
        if (objetivoId != null) {
            Perfil objetivo = new Perfil();
            objetivo.setId(objetivoId);
            registro.setUsuarioObjetivoId(objetivo);
        }
        registro.setEntidadTipo(entidadTipo);
        registro.setEntidadId(entidadId);
        registro.setValorAnterior(valorAnterior);
        registro.setValorNuevo(valorNuevo);
        registro.setExito(exito);
        registro.setMensajeError(mensajeError);
        registro.setDatos(Map.of("origen", "backend"));
        registro.setCreadoEn(Instant.now());
        registroAccionRepository.save(registro);
    }
}
