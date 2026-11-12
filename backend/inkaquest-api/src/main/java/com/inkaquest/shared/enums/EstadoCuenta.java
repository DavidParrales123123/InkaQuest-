package com.inkaquest.shared.enums;

/**
 * Tipo enumerado equivalente al ENUM {@code estado_cuenta} de PostgreSQL.
 *
 * <p>Cada constante guarda la etiqueta exacta almacenada en la base de datos
 * y el conversor EstadoCuentaConverter la usa al leer y escribir. Asi el valor
 * persistido coincide siempre con la etiqueta del ENUM, incluso cuando la
 * constante Java difiere (palabras reservadas de Java).</p>
 *
 * <p>Las constantes conservan la grafia de la base de datos (minusculas con
 * guion bajo) en lugar de la convencion Java habitual, para que el valor
 * sea legible e inequivoco respecto de lo almacenado.</p>
 */
public enum EstadoCuenta {

    /** Valor almacenado en PostgreSQL: {@code pendiente_verificacion}. */
    pendiente_verificacion("pendiente_verificacion"),

    /** Valor almacenado en PostgreSQL: {@code activo}. */
    activo("activo"),

    /** Valor almacenado en PostgreSQL: {@code suspendido}. */
    suspendido("suspendido"),

    /** Valor almacenado en PostgreSQL: {@code eliminado}. */
    eliminado("eliminado");

    /** Etiqueta exacta almacenada en PostgreSQL. */
    private final String valor;

    EstadoCuenta(String valor) {
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
    public static EstadoCuenta fromValor(String valor) {
        for (EstadoCuenta constante : values()) {
            if (constante.valor.equals(valor)) {
                return constante;
            }
        }
        return null;
    }
}
