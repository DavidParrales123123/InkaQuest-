package com.inkaquest.shared.enums;

/**
 * Tipo enumerado equivalente al ENUM {@code estado_pedido} de PostgreSQL.
 *
 * <p>Cada constante guarda la etiqueta exacta almacenada en la base de datos
 * y el conversor EstadoPedidoConverter la usa al leer y escribir. Asi el valor
 * persistido coincide siempre con la etiqueta del ENUM, incluso cuando la
 * constante Java difiere (palabras reservadas de Java).</p>
 *
 * <p>Las constantes conservan la grafia de la base de datos (minusculas con
 * guion bajo) en lugar de la convencion Java habitual, para que el valor
 * sea legible e inequivoco respecto de lo almacenado.</p>
 */
public enum EstadoPedido {

    /** Valor almacenado en PostgreSQL: {@code pendiente}. */
    pendiente("pendiente"),

    /** Valor almacenado en PostgreSQL: {@code pagado}. */
    pagado("pagado"),

    /** Valor almacenado en PostgreSQL: {@code procesando}. */
    procesando("procesando"),

    /** Valor almacenado en PostgreSQL: {@code cancelado}. */
    cancelado("cancelado"),

    /** Valor almacenado en PostgreSQL: {@code reembolsado}. */
    reembolsado("reembolsado"),

    /** Valor almacenado en PostgreSQL: {@code fallido}. */
    fallido("fallido");

    /** Etiqueta exacta almacenada en PostgreSQL. */
    private final String valor;

    EstadoPedido(String valor) {
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
    public static EstadoPedido fromValor(String valor) {
        for (EstadoPedido constante : values()) {
            if (constante.valor.equals(valor)) {
                return constante;
            }
        }
        return null;
    }
}
