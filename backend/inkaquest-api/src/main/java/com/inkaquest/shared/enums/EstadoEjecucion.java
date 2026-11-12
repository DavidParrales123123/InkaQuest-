package com.inkaquest.shared.enums;

/**
 * Tipo enumerado equivalente al ENUM {@code estado_ejecucion} de PostgreSQL.
 *
 * <p>Cada constante guarda la etiqueta exacta almacenada en la base de datos
 * y el conversor EstadoEjecucionConverter la usa al leer y escribir. Asi el valor
 * persistido coincide siempre con la etiqueta del ENUM, incluso cuando la
 * constante Java difiere (palabras reservadas de Java).</p>
 *
 * <p>Las constantes conservan la grafia de la base de datos (minusculas con
 * guion bajo) en lugar de la convencion Java habitual, para que el valor
 * sea legible e inequivoco respecto de lo almacenado.</p>
 */
public enum EstadoEjecucion {

    /** Valor almacenado en PostgreSQL: {@code ok}. */
    ok("ok"),

    /** Valor almacenado en PostgreSQL: {@code error}. */
    error("error"),

    /** Valor almacenado en PostgreSQL: {@code timeout}. */
    timeout("timeout"),

    /** Valor almacenado en PostgreSQL: {@code memoria_excedida}. */
    memoria_excedida("memoria_excedida"),

    /** Valor almacenado en PostgreSQL: {@code error_compilacion}. */
    error_compilacion("error_compilacion");

    /** Etiqueta exacta almacenada en PostgreSQL. */
    private final String valor;

    EstadoEjecucion(String valor) {
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
    public static EstadoEjecucion fromValor(String valor) {
        for (EstadoEjecucion constante : values()) {
            if (constante.valor.equals(valor)) {
                return constante;
            }
        }
        return null;
    }
}
