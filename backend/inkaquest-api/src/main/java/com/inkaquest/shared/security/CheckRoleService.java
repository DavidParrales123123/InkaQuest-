package com.inkaquest.shared.security;

import com.inkaquest.shared.enums.RolUsuario;
import com.inkaquest.shared.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.UUID;

/**
 * Servicio auxiliar para verificar rol del usuario autenticado.
 *
 * <p>El rol efectivo vive en {@code public.perfil.rol}; nunca se confía
 * únicamente en el token para autorización por rol.</p>
 *
 * <p>Internamente siempre abre un contexto RLS (transaction) para que la
 * resolución del rol se haga igualmente bajo las políticas de la BD.</p>
 */
@Service
public class CheckRoleService {

    private final RlsExecutor rlsExecutor;
    private final com.inkaquest.modules.identidad.repository.PerfilRepository perfilRepository;

    public CheckRoleService(RlsExecutor rlsExecutor,
                            com.inkaquest.modules.identidad.repository.PerfilRepository perfilRepository) {
        this.rlsExecutor = rlsExecutor;
        this.perfilRepository = perfilRepository;
    }

    /** Resuelve el rol del usuario autenticado contra la BD (sin caché). */
    public RolUsuario rolDe(UUID usuarioId) {
        return rlsExecutor.executeAs(usuarioId, () ->
                perfilRepository.findById(usuarioId)
                        .map(com.inkaquest.modules.identidad.entity.Perfil::getRol)
                        .orElseThrow(() -> new ResourceNotFoundException("El perfil del usuario no existe o está suspendido.")));
    }

    /** Comprueba si el usuario tiene alguno de los roles solicitados. */
    public boolean usuarioTieneRol(UUID usuarioId, RolUsuario... roles) {
        if (roles == null || roles.length == 0) {
            return false;
        }
        RolUsuario rol = rolDe(usuarioId);
        if (rol == null) {
            return false;
        }
        return Arrays.stream(roles).anyMatch(r -> r == rol);
    }
}
