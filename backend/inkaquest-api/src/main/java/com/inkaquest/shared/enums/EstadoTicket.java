package com.inkaquest.shared.enums;

/**
 * Tipo enumerado equivalente al ENUM {@code estado_ticket} de PostgreSQL.
 *
 * <p>Cada constante guarda la etiqueta exacta almacenada en la base de datos
 * y el conversor EstadoTicketConverter la usa al leer y escribir. Asi el valor
 * persistido coincide siempre con la etiqueta del ENUM, incluso cuando la
 * constante Java difiere (palabras reservadas de Java).</p>
 *
 * <p>Las constantes conservan la grafia de la base de datos (minusculas con
 * guion bajo) en lugar de la convencion Java habitual, para que el valor
 * sea legible e inequivoco respecto de lo almacenado.</p>
 */
public enum EstadoTicket {

    /** Valor almacenado en PostgreSQL: {@code abierto}. */
    abierto("abierto"),

    /** Valor almacenado en PostgreSQL: {@code en_progreso}. */
    en_progreso("en_progreso"),

    /** Valor almacenado en PostgreSQL: {@code esperando_usuario}. */
    esperando_usuario("esperando_usuario"),

    /** Valor almacenado en PostgreSQL: {@code resuelto}. */
    resuelto("resuelto"),

    /** Valor almacenado en PostgreSQL: {@code cerrado}. */
    cerrado("cerrado");

    /** Etiqueta exacta almacenada en PostgreSQL. */
    private final String valor;

    EstadoTicket(String valor) {
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
    public static EstadoTicket fromValor(String valor) {
        for (EstadoTicket constante : values()) {
            if (constante.valor.equals(valor)) {
                return constante;
            }
        }
        return null;
    }
}
