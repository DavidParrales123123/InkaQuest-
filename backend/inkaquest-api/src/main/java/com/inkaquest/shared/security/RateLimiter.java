package com.inkaquest.shared.security;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Limite de peticiones en memoria por IP + ruta.
 *
 * <p>Proteccion de primera linea contra abuso. Ventana fija de {@value #VENTANA_MS}
 * ms; el limite por defecto es {@value #MAX_PETICIONES} por IP y ruta.</p>
 *
 * <p><b>Limitacion conocida:</b> es por proceso. En un despliegue multi-instancia,
 * usar un almacén compartido (Redis). El limite sigue siendo util como freno
 * de abuso por instancia.</p>
 */
public final class RateLimiter {

    /** 60 peticiones por minuto por IP y ruta (general). */
    public static final int MAX_PETICIONES = 60;
    /** 20 peticiones por minuto para rutas sensibles (webhook, verificacion publica). */
    public static final int MAX_PETICIONES_ESTRICTO = 20;
    /** Ventana de la cuota (1 minuto). */
    public static final long VENTANA_MS = 60_000L;

    private final ConcurrentHashMap<String, Ventana> ventanas = new ConcurrentHashMap<>();

    /** Consume un permiso con el limite por defecto. */
    public boolean intentar(String clave) {
        return intentar(clave, MAX_PETICIONES);
    }

    /**
     * Consume un permiso con un limite concreto.
     *
     * @param clave  identificador (p. ej. IP + ruta)
     * @param limite maximo de peticiones por ventana
     */
    public boolean intentar(String clave, int limite) {
        long ahora = System.currentTimeMillis();
        Ventana v = ventanas.compute(clave, (k, actual) -> {
            if (actual == null || ahora - actual.inicio >= VENTANA_MS) {
                return new Ventana(ahora);
            }
            return actual;
        });
        return v.contador.incrementAndGet() <= limite;
    }

    /** Segundos restantes hasta que la ventana expire (para Retry-After). */
    public int segundosHastaReinicio(String clave) {
        Ventana v = ventanas.get(clave);
        if (v == null) {
            return 1;
        }
        long restante = Math.max(0, VENTANA_MS - (System.currentTimeMillis() - v.inicio));
        return (int) Math.max(1, (restante + 999) / 1000);
    }

    private static final class Ventana {
        private final long inicio;
        private final AtomicInteger contador = new AtomicInteger(0);

        private Ventana(long inicio) {
            this.inicio = inicio;
        }
    }
}
