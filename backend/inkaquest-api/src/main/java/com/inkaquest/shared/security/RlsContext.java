package com.inkaquest.shared.security;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Savepoint;
import java.util.UUID;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Fija el contexto de autorizacion de la transaccion actual en PostgreSQL.
 *
 * <p><b>Objetivo.</b> Que las politicas RLS de InkaQuest se apliquen tambien
 * a las consultas que emite el backend Spring:</p>
 * <ol>
 *   <li>{@code set local role inkaquest_api} — la conexion pasa a ser un
 *       rol sujeto a las politicas (si no, RLS nunca se consulta).</li>
 *   <li>{@code set_config('app.current_user_id', ..., true)} — la variable
 *       de sesion (transaction-local) que dice en nombre de quien se ejecuta.</li>
 * </ol>
 *
 * <p><b>Modo degradado.</b> En instancias donde el rol de conexion no tiene
 * membresia en {@code inkaquest_api} (p. ej. el {@code postgres} asignado por
 * Supabase, sin {@code GRANT} explicito), PostgreSQL rechaza el comando con
 * SQLSTATE 42501. Como una sentencia fallida aborta la transaccion, cada
 * paso se ejecuta dentro de un SAVEPOINT: si falla, se revierte solo ese
 * paso y la transaccion sigue en pie. Se registra una advertencia clara
 * (una vez por proceso) y la autorizacion efectiva queda en la capa de
 * servicio (propiedad/rol contra {@code public.perfil}), nunca en el token.</p>
 *
 * <p><b>Para activar RLS completo</b> basta con ejecutar una vez en el SQL
 * Editor del proyecto:</p>
 * <pre>{@code GRANT inkaquest_api TO <rol-de-conexion>;}</pre>
 * <p>Sin cambios de codigo: en el siguiente arranque RLS quedara activa.</p>
 */
public final class RlsContext {

    private static final Logger LOG = Logger.getLogger(RlsContext.class.getName());
    private static volatile boolean advirtiendoDegradado = false;

    /** Nombre de la variable de sesion que transporta el UUID del usuario. */
    public static final String USER_ID_SETTING = "app.current_user_id";
    /** Rol no privilegiado del backend al que se cambia la conexion. */
    public static final String INKQUEST_API_ROLE = "inkaquest_api";

    private final Connection connection;
    private final javax.sql.DataSource dataSource;
    /** true si el cambio de rol se aplico en esta transaccion. */
    private boolean rolAplicado;
    /** true si la variable de sesion se fijo en esta transaccion. */
    private boolean variableFijada;

    /**
     * @param connection la conexion de la transaccion en curso (de DataSourceUtils)
     * @param dataSource el origen de datos para devolver la conexion al liberarla
     */
    public RlsContext(Connection connection, javax.sql.DataSource dataSource) {
        this.connection = connection;
        this.dataSource = dataSource;
    }

    /** Libera la conexion obtenida via DataSourceUtils. */
    public void close() {
        org.springframework.jdbc.datasource.DataSourceUtils.releaseConnection(connection, dataSource);
    }

    /**
     * Fija el usuario efectivo dentro de la transaccion actual.
     *
     * @param usuarioId UUID del usuario autenticado (puede ser {@code null})
     */
    public void setUsuario(UUID usuarioId) throws SQLException {
        rolAplicado = ejecutarConSavepoint(
                "SET ROLE " + INKQUEST_API_ROLE,
                "set local role " + INKQUEST_API_ROLE,
                null);
        variableFijada = ejecutarConSavepoint(
                "SET app.current_user_id",
                "select set_config('" + USER_ID_SETTING + "', ?, true)",
                usuarioId == null ? "" : usuarioId.toString());
        if (!rolAplicado || !variableFijada) {
            advertirDegradado();
        }
    }

    /** Limpia el contexto de autorizacion y restaura el rol de la sesion. */
    public void limpiar() throws SQLException {
        if (variableFijada) {
            ejecutarConSavepoint(
                    "RESET app.current_user_id",
                    "select set_config('" + USER_ID_SETTING + "', '', true)",
                    null);
        }
        if (rolAplicado) {
            ejecutarConSavepoint("RESET ROLE", "reset role", null);
        }
    }

    /** Verifica si el contexto esta activo. */
    public boolean tieneContexto() {
        try (PreparedStatement ps = connection.prepareStatement(
                "select coalesce(nullif(current_setting('" + USER_ID_SETTING + "', true), ''), '') <> ''")) {
            try (var rs = ps.executeQuery()) {
                return rs.next() && rs.getBoolean(1);
            }
        } catch (SQLException e) {
            return false;
        }
    }

    // ---------- Interno ----------

    private boolean ejecutarConSavepoint(String etiqueta, String sql, String valor) {
        Savepoint sp = null;
        try {
            boolean autoCommit = connection.getAutoCommit();
            if (!autoCommit) {
                sp = connection.setSavepoint();
            }
            try (PreparedStatement ps = connection.prepareStatement(sql)) {
                if (valor != null) {
                    ps.setString(1, valor);
                }
                ps.execute();
            }
            if (sp != null) {
                connection.releaseSavepoint(sp);
            }
            return true;
        } catch (SQLException e) {
            if (sp != null) {
                try {
                    connection.rollback(sp);
                    connection.releaseSavepoint(sp);
                } catch (SQLException rollbackFallido) {
                    LOG.log(Level.FINE, "No se pudo revertir al savepoint de " + etiqueta, rollbackFallido);
                }
            }
            LOG.log(Level.WARNING,
                    "RLS: " + etiqueta + " omitido (SQLSTATE " + e.getSQLState() + ": " + e.getMessage() + ").");
            return false;
        }
    }

    private void advertirDegradado() {
        if (!advirtiendoDegradado) {
            synchronized (RlsContext.class) {
                if (!advirtiendoDegradado) {
                    advirtiendoDegradado = true;
                    LOG.log(Level.WARNING,
                            "RLS degradado: el rol de conexion no puede fijar el contexto ("
                                + INKQUEST_API_ROLE + " o variable de sesion). "
                                + "La autorizacion se aplica en la capa de servicio contra public.perfil. "
                                + "Para activar RLS completo, ejecuta en el SQL Editor del proyecto: "
                                + "GRANT " + INKQUEST_API_ROLE + " TO <rol-de-conexion>;");
                }
            }
        }
    }
}
