package com.inkaquest.shared.enums;

/**
 * Tipo enumerado equivalente al ENUM {@code estado_pago} de PostgreSQL.
 *
 * <p>Cada constante guarda la etiqueta exacta almacenada en la base de datos
 * y el conversor EstadoPagoConverter la usa al leer y escribir. Asi el valor
 * persistido coincide siempre con la etiqueta del ENUM, incluso cuando la
 * constante Java difiere (palabras reservadas de Java).</p>
 *
 * <p>Las constantes conservan la grafia de la base de datos (minusculas con
 * guion bajo) en lugar de la convencion Java habitual, para que el valor
 * sea legible e inequivoco respecto de lo almacenado.</p>
 */
public enum EstadoPago {

    /** Valor almacenado en PostgreSQL: {@code iniciado}. */
    iniciado("iniciado"),

    /** Valor almacenado en PostgreSQL: {@code requiere_accion}. */
    requiere_accion("requiere_accion"),

    /** Valor almacenado en PostgreSQL: {@code autorizado}. */
    autorizado("autorizado"),

    /** Valor almacenado en PostgreSQL: {@code capturado}. */
    capturado("capturado"),

    /** Valor almacenado en PostgreSQL: {@code fallido}. */
    fallido("fallido"),

    /** Valor almacenado en PostgreSQL: {@code reembolsado}. */
    reembolsado("reembolsado"),

    /** Valor almacenado en PostgreSQL: {@code anulado}. */
    anulado("anulado");

    /** Etiqueta exacta almacenada en PostgreSQL. */
    private final String valor;

    EstadoPago(String valor) {
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
    public static EstadoPago fromValor(String valor) {
        for (EstadoPago constante : values()) {
            if (constante.valor.equals(valor)) {
                return constante;
            }
        }
        return null;
    }
}
