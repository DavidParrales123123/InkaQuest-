package com.inkaquest.shared.enums;

/**
 * Tipo enumerado equivalente al ENUM {@code origen_mensaje} de PostgreSQL.
 *
 * <p>Cada constante guarda la etiqueta exacta almacenada en la base de datos
 * y el conversor OrigenMensajeConverter la usa al leer y escribir. Asi el valor
 * persistido coincide siempre con la etiqueta del ENUM, incluso cuando la
 * constante Java difiere (palabras reservadas de Java).</p>
 *
 * <p>Las constantes conservan la grafia de la base de datos (minusculas con
 * guion bajo) en lugar de la convencion Java habitual, para que el valor
 * sea legible e inequivoco respecto de lo almacenado.</p>
 */
public enum OrigenMensaje {

    /** Valor almacenado en PostgreSQL: {@code usuario}. */
    usuario("usuario"),

    /** Valor almacenado en PostgreSQL: {@code asistente}. */
    asistente("asistente"),

    /** Valor almacenado en PostgreSQL: {@code sistema}. */
    sistema("sistema"),

    /** Valor almacenado en PostgreSQL: {@code documento}. */
    documento("documento");

    /** Etiqueta exacta almacenada en PostgreSQL. */
    private final String valor;

    OrigenMensaje(String valor) {
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
    public static OrigenMensaje fromValor(String valor) {
        for (OrigenMensaje constante : values()) {
            if (constante.valor.equals(valor)) {
                return constante;
            }
        }
        return null;
    }
}
