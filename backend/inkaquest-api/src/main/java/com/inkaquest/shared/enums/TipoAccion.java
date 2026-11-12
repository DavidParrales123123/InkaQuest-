package com.inkaquest.shared.enums;

/**
 * Tipo enumerado equivalente al ENUM {@code tipo_accion} de PostgreSQL.
 *
 * <p>Cada constante guarda la etiqueta exacta almacenada en la base de datos
 * y el conversor TipoAccionConverter la usa al leer y escribir. Asi el valor
 * persistido coincide siempre con la etiqueta del ENUM, incluso cuando la
 * constante Java difiere (palabras reservadas de Java).</p>
 *
 * <p>Las constantes conservan la grafia de la base de datos (minusculas con
 * guion bajo) en lugar de la convencion Java habitual, para que el valor
 * sea legible e inequivoco respecto de lo almacenado.</p>
 */
public enum TipoAccion {

    /** Valor almacenado en PostgreSQL: {@code crear}. */
    crear("crear"),

    /** Valor almacenado en PostgreSQL: {@code leer}. */
    leer("leer"),

    /** Valor almacenado en PostgreSQL: {@code actualizar}. */
    actualizar("actualizar"),

    /** Valor almacenado en PostgreSQL: {@code eliminar}. */
    eliminar("eliminar"),

    /** Valor almacenado en PostgreSQL: {@code login}. */
    login("login"),

    /** Valor almacenado en PostgreSQL: {@code logout}. */
    logout("logout"),

    /** Valor almacenado en PostgreSQL: {@code publicar}. */
    publicar("publicar"),

    /** Valor almacenado en PostgreSQL: {@code aprobar}. */
    aprobar("aprobar"),

    /** Valor almacenado en PostgreSQL: {@code rechazar}. */
    rechazar("rechazar"),

    /** Valor almacenado en PostgreSQL: {@code exportar}. */
    exportar("exportar"),

    /** Valor almacenado en PostgreSQL: {@code restaurar}. */
    restaurar("restaurar");

    /** Etiqueta exacta almacenada en PostgreSQL. */
    private final String valor;

    TipoAccion(String valor) {
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
    public static TipoAccion fromValor(String valor) {
        for (TipoAccion constante : values()) {
            if (constante.valor.equals(valor)) {
                return constante;
            }
        }
        return null;
    }
}
