package com.inkaquest.shared.enums;

/**
 * Tipo enumerado equivalente al ENUM {@code tipo_contenido} de PostgreSQL.
 *
 * <p>Cada constante guarda la etiqueta exacta almacenada en la base de datos
 * y el conversor TipoContenidoConverter la usa al leer y escribir. Asi el valor
 * persistido coincide siempre con la etiqueta del ENUM, incluso cuando la
 * constante Java difiere (palabras reservadas de Java).</p>
 *
 * <p>Las constantes conservan la grafia de la base de datos (minusculas con
 * guion bajo) en lugar de la convencion Java habitual, para que el valor
 * sea legible e inequivoco respecto de lo almacenado.</p>
 */
public enum TipoContenido {

    /** Valor almacenado en PostgreSQL: {@code texto}. */
    texto("texto"),

    /** Valor almacenado en PostgreSQL: {@code video}. */
    video("video"),

    /** Valor almacenado en PostgreSQL: {@code imagen}. */
    imagen("imagen"),

    /** Valor almacenado en PostgreSQL: {@code documento}. */
    documento("documento"),

    /** Valor almacenado en PostgreSQL: {@code enlace}. */
    enlace("enlace"),

    /** Valor almacenado en PostgreSQL: {@code quiz}. */
    quiz("quiz"),

    /** Valor almacenado en PostgreSQL: {@code examen}. */
    examen("examen"),

    /** Valor almacenado en PostgreSQL: {@code reto}. */
    reto("reto"),

    /** Valor almacenado en PostgreSQL: {@code minijuego}. */
    minijuego("minijuego"),

    /** Valor almacenado en PostgreSQL: {@code foro}. */
    foro("foro"),

    /** Valor almacenado en PostgreSQL: {@code otro}. */
    otro("otro");

    /** Etiqueta exacta almacenada en PostgreSQL. */
    private final String valor;

    TipoContenido(String valor) {
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
    public static TipoContenido fromValor(String valor) {
        for (TipoContenido constante : values()) {
            if (constante.valor.equals(valor)) {
                return constante;
            }
        }
        return null;
    }
}
