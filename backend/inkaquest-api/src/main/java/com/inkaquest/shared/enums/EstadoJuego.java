package com.inkaquest.shared.enums;

/**
 * Tipo enumerado equivalente al ENUM {@code estado_juego} de PostgreSQL.
 *
 * <p>Cada constante guarda la etiqueta exacta almacenada en la base de datos
 * y el conversor EstadoJuegoConverter la usa al leer y escribir. Asi el valor
 * persistido coincide siempre con la etiqueta del ENUM, incluso cuando la
 * constante Java difiere (palabras reservadas de Java).</p>
 *
 * <p>Las constantes conservan la grafia de la base de datos (minusculas con
 * guion bajo) en lugar de la convencion Java habitual, para que el valor
 * sea legible e inequivoco respecto de lo almacenado.</p>
 */
public enum EstadoJuego {

    /** Valor almacenado en PostgreSQL: {@code borrador}. */
    borrador("borrador"),

    /** Valor almacenado en PostgreSQL: {@code publicado}. */
    publicado("publicado"),

    /** Valor almacenado en PostgreSQL: {@code archivado}. */
    archivado("archivado");

    /** Etiqueta exacta almacenada en PostgreSQL. */
    private final String valor;

    EstadoJuego(String valor) {
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
    public static EstadoJuego fromValor(String valor) {
        for (EstadoJuego constante : values()) {
            if (constante.valor.equals(valor)) {
                return constante;
            }
        }
        return null;
    }
}
