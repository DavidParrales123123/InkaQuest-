package com.inkaquest.shared.security;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.sql.SQLException;
import java.util.UUID;
import java.util.function.Supplier;

/**
 * Ejecuta operaciones de datos dentro del contexto de autorizacion de un
 * usuario concreto.
 *
 * <p><b>Por que existe.</b> Las tablas de InkaQuest estan protegidas por RLS.
 * Una consulta sin contexto de autorizacion no ve filas (las politicas
 * comparan con {@code app.current_user_id}). Esta clase centraliza el
 * patron correcto:
 *
 * <ol>
 *   <li>Abre una transaccion.</li>
 *   <li>Fija {@code app.current_user_id} dentro de ella (transaction-local).</li>
 *   <li>Ejecuta la operacion.</li>
 *   <li>Al confirmar, el contexto desaparece automaticamente.</li>
 * </ol>
 *
 * <p><b>Operaciones privilegiadas.</b> Acciones que no pertenecen a un
 * usuario concreto (emitir un certificado, procesar un webhook de pago,
 * registrar una auditoria del sistema) NO deben usar este servicio: deben
 * ejecutarse con el rol {@code service_role} desde el backend, porque la RLS
 * lo bloquea por diseno.
 *
 * <p><b>Transacciones anidadas.</b> Se usa {@code Propagation.REQUIRES_NEW}
 * para que la operacion tenga siempre su propia transaccion y su propio
 * contexto, incluso si el servicio que la invoca ya tiene una abierta.
 */
@Service
public class RlsExecutor {

    private final RlsContextFactory contextFactory;

    public RlsExecutor(RlsContextFactory contextFactory) {
        this.contextFactory = contextFactory;
    }

    /**
     * Ejecuta la operacion como el usuario indicado.
     *
     * @param usuarioId UUID del usuario autenticado
     * @param operacion  laccion a ejecutar dentro del contexto
     * @param <T>        tipo de resultado
     * @return el valor devuelto por la operacion
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public <T> T executeAs(UUID usuarioId, Supplier<T> operacion) {
        RlsContext contexto = contextFactory.create();
        try {
            contexto.setUsuario(usuarioId);
            return operacion.get();
        } catch (SQLException e) {
            throw new IllegalStateException(
                    "No se pudo fijar el contexto de autorizacion en la transaccion.", e);
        } finally {
            contexto.close();
        }
    }

    /**
     * Ejecuta la operacion como el usuario indicado, sin resultado.
     *
     * @param usuarioId UUID del usuario autenticado
     * @param operacion  accion a ejecutar
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void executeAs(UUID usuarioId, Runnable operacion) {
        executeAs(usuarioId, () -> {
            operacion.run();
            return null;
        });
    }

    /**
     * Ejecuta la operacion sin contexto de usuario.
     *
     * <p>Solo para operaciones de sistema que usan el rol privilegiado
     * ({@code service_role}) y que, por tanto, no pasan por esta clase.
     *
     * @param operacion accion a ejecutar
     * @param <T>        tipo de resultado
     * @return el valor devuelto por la operacion
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public <T> T executeAsSystem(Supplier<T> operacion) {
        RlsContext contexto = contextFactory.create();
        try {
            contexto.limpiar();
            return operacion.get();
        } catch (SQLException e) {
            throw new IllegalStateException(
                    "No se pudo limpiar el contexto de autorizacion en la transaccion.", e);
        } finally {
            contexto.close();
        }
    }
}
