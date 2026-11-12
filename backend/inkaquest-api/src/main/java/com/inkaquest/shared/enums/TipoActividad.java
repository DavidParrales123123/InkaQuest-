package com.inkaquest.shared.enums;

/**
 * Tipo enumerado equivalente al ENUM {@code tipo_actividad} de PostgreSQL.
 *
 * <p>Cada constante guarda la etiqueta exacta almacenada en la base de datos
 * y el conversor TipoActividadConverter la usa al leer y escribir. Asi el valor
 * persistido coincide siempre con la etiqueta del ENUM, incluso cuando la
 * constante Java difiere (palabras reservadas de Java).</p>
 *
 * <p>Las constantes conservan la grafia de la base de datos (minusculas con
 * guion bajo) en lugar de la convencion Java habitual, para que el valor
 * sea legible e inequivoco respecto de lo almacenado.</p>
 */
public enum TipoActividad {

    /** Valor almacenado en PostgreSQL: {@code lectura}. */
    lectura("lectura"),

    /** Valor almacenado en PostgreSQL: {@code video}. */
    video("video"),

    /** Valor almacenado en PostgreSQL: {@code tarea}. */
    tarea("tarea"),

    /** Valor almacenado en PostgreSQL: {@code quiz}. */
    quiz("quiz"),

    /** Valor almacenado en PostgreSQL: {@code examen}. */
    examen("examen"),

    /** Valor almacenado en PostgreSQL: {@code reto}. */
    reto("reto"),

    /** Valor almacenado en PostgreSQL: {@code minijuego}. */
    minijuego("minijuego"),

    /** Valor almacenado en PostgreSQL: {@code foro}. */
    foro("foro");

    /** Etiqueta exacta almacenada en PostgreSQL. */
    private final String valor;

    TipoActividad(String valor) {
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
    public static TipoActividad fromValor(String valor) {
        for (TipoActividad constante : values()) {
            if (constante.valor.equals(valor)) {
                return constante;
            }
        }
        return null;
    }
}
