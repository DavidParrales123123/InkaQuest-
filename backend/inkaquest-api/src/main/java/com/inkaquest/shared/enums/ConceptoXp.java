package com.inkaquest.shared.enums;

/**
 * Tipo enumerado equivalente al ENUM {@code concepto_xp} de PostgreSQL.
 *
 * <p>Cada constante guarda la etiqueta exacta almacenada en la base de datos
 * y el conversor ConceptoXpConverter la usa al leer y escribir. Asi el valor
 * persistido coincide siempre con la etiqueta del ENUM, incluso cuando la
 * constante Java difiere (palabras reservadas de Java).</p>
 *
 * <p>Las constantes conservan la grafia de la base de datos (minusculas con
 * guion bajo) en lugar de la convencion Java habitual, para que el valor
 * sea legible e inequivoco respecto de lo almacenado.</p>
 */
public enum ConceptoXp {

    /** Valor almacenado en PostgreSQL: {@code leccion_completada}. */
    leccion_completada("leccion_completada"),

    /** Valor almacenado en PostgreSQL: {@code actividad_completada}. */
    actividad_completada("actividad_completada"),

    /** Valor almacenado en PostgreSQL: {@code examen_aprobado}. */
    examen_aprobado("examen_aprobado"),

    /** Valor almacenado en PostgreSQL: {@code reto_resuelto}. */
    reto_resuelto("reto_resuelto"),

    /** Valor almacenado en PostgreSQL: {@code minijuego_terminado}. */
    minijuego_terminado("minijuego_terminado"),

    /** Valor almacenado en PostgreSQL: {@code insignia}. */
    insignia("insignia"),

    /** Valor almacenado en PostgreSQL: {@code racha_diaria}. */
    racha_diaria("racha_diaria"),

    /** Valor almacenado en PostgreSQL: {@code asistencia}. */
    asistencia("asistencia"),

    /** Valor almacenado en PostgreSQL: {@code curso_completado}. */
    curso_completado("curso_completado"),

    /** Valor almacenado en PostgreSQL: {@code mision}. */
    mision("mision"),

    /** Valor almacenado en PostgreSQL: {@code admin}. */
    admin("admin"),

    /** Valor almacenado en PostgreSQL: {@code ajuste}. */
    ajuste("ajuste");

    /** Etiqueta exacta almacenada en PostgreSQL. */
    private final String valor;

    ConceptoXp(String valor) {
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
    public static ConceptoXp fromValor(String valor) {
        for (ConceptoXp constante : values()) {
            if (constante.valor.equals(valor)) {
                return constante;
            }
        }
        return null;
    }
}
