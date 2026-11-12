package com.inkaquest.shared.enums;

/**
 * Tipo enumerado equivalente al ENUM {@code estado_envio} de PostgreSQL.
 *
 * <p>Cada constante guarda la etiqueta exacta almacenada en la base de datos
 * y el conversor EstadoEnvioConverter la usa al leer y escribir. Asi el valor
 * persistido coincide siempre con la etiqueta del ENUM, incluso cuando la
 * constante Java difiere (palabras reservadas de Java).</p>
 *
 * <p>Las constantes conservan la grafia de la base de datos (minusculas con
 * guion bajo) en lugar de la convencion Java habitual, para que el valor
 * sea legible e inequivoco respecto de lo almacenado.</p>
 */
public enum EstadoEnvio {

    /** Valor almacenado en PostgreSQL: {@code pendiente}. */
    pendiente("pendiente"),

    /** Valor almacenado en PostgreSQL: {@code ejecutando}. */
    ejecutando("ejecutando"),

    /** Valor almacenado en PostgreSQL: {@code evaluando}. */
    evaluando("evaluando"),

    /** Valor almacenado en PostgreSQL: {@code completado}. */
    completado("completado"),

    /** Valor almacenado en PostgreSQL: {@code error_compilacion}. */
    error_compilacion("error_compilacion"),

    /** Valor almacenado en PostgreSQL: {@code tiempo_agotado}. */
    tiempo_agotado("tiempo_agotado"),

    /** Valor almacenado en PostgreSQL: {@code error_ejecucion}. */
    error_ejecucion("error_ejecucion");

    /** Etiqueta exacta almacenada en PostgreSQL. */
    private final String valor;

    EstadoEnvio(String valor) {
        this.valor = valor;
    }

    /**
     * Devuelve el valor exacto almacenado en PostgreSQL.
     */
    public String getValor() {
        return valor;
    }

    /**
     * Reconstruye la constante a partir del valor de PostgreSQL.
     *
     * @param valor etiqueta almacenada en la base de datos
     * @return constante correspondiente, o {@code null} si no existe
     */
    public static EstadoEnvio fromValor(String valor) {
        for (EstadoEnvio constante : values()) {
            if (constante.valor.equals(valor)) {
                return constante;
            }
        }
        return null;
    }
}
