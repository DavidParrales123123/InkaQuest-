package com.inkaquest.shared.enums;

/**
 * Tipo enumerado equivalente al ENUM {@code rol_usuario} de PostgreSQL.
 *
 * <p>Cada constante guarda la etiqueta exacta almacenada en la base de datos
 * y el conversor RolUsuarioConverter la usa al leer y escribir. Asi el valor
 * persistido coincide siempre con la etiqueta del ENUM, incluso cuando la
 * constante Java difiere (palabras reservadas de Java).</p>
 *
 * <p>Las constantes conservan la grafia de la base de datos (minusculas con
 * guion bajo) en lugar de la convencion Java habitual, para que el valor
 * sea legible e inequivoco respecto de lo almacenado.</p>
 */
public enum RolUsuario {

    /** Valor almacenado en PostgreSQL: {@code estudiante}. */
    estudiante("estudiante"),

    /** Valor almacenado en PostgreSQL: {@code docente}. */
    docente("docente"),

    /** Valor almacenado en PostgreSQL: {@code administrador}. */
    administrador("administrador");

    /** Etiqueta exacta almacenada en PostgreSQL. */
    private final String valor;

    RolUsuario(String valor) {
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
    public static RolUsuario fromValor(String valor) {
        for (RolUsuario constante : values()) {
            if (constante.valor.equals(valor)) {
                return constante;
            }
        }
        return null;
    }
}
