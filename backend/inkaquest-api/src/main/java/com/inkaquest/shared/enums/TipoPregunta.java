package com.inkaquest.shared.enums;

/**
 * Tipo enumerado equivalente al ENUM {@code tipo_pregunta} de PostgreSQL.
 *
 * <p>Cada constante guarda la etiqueta exacta almacenada en la base de datos
 * y el conversor TipoPreguntaConverter la usa al leer y escribir. Asi el valor
 * persistido coincide siempre con la etiqueta del ENUM, incluso cuando la
 * constante Java difiere (palabras reservadas de Java).</p>
 *
 * <p>Las constantes conservan la grafia de la base de datos (minusculas con
 * guion bajo) en lugar de la convencion Java habitual, para que el valor
 * sea legible e inequivoco respecto de lo almacenado.</p>
 */
public enum TipoPregunta {

    /** Valor almacenado en PostgreSQL: {@code opcion_unica}. */
    opcion_unica("opcion_unica"),

    /** Valor almacenado en PostgreSQL: {@code opcion_multiple}. */
    opcion_multiple("opcion_multiple"),

    /** Valor almacenado en PostgreSQL: {@code verdadero_falso}. */
    verdadero_falso("verdadero_falso"),

    /** Valor almacenado en PostgreSQL: {@code respuesta_libre}. */
    respuesta_libre("respuesta_libre"),

    /** Valor almacenado en PostgreSQL: {@code codigo}. */
    codigo("codigo"),

    /** Valor almacenado en PostgreSQL: {@code orden_multiple}. */
    orden_multiple("orden_multiple");

    /** Etiqueta exacta almacenada en PostgreSQL. */
    private final String valor;

    TipoPregunta(String valor) {
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
    public static TipoPregunta fromValor(String valor) {
        for (TipoPregunta constante : values()) {
            if (constante.valor.equals(valor)) {
                return constante;
            }
        }
        return null;
    }
}
