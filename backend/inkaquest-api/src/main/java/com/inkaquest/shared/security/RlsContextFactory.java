package com.inkaquest.shared.security;

import org.springframework.stereotype.Component;
import org.springframework.jdbc.datasource.DataSourceUtils;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;

/**
 * Crea un {@link RlsContext} sobre la conexion que participa de la
 * transaccion gestionada por Spring.
 *
 * <p><b>Por que DataSourceUtils.</b> {@code dataSource.getConnection()}
 * (con un {@link DataSource} plano) devuelve una conexion nueva,
 * INDEPENDIENTE de la transaccion de Spring: auto-commit y fuera de la
 * transaccion-RlsExecutor. El contexto RLS (variable de sesion + rol) se
 * fijaba en una conexion distinta de la que ejecuta las consultas, por lo
 * que la RLS nunca llegaba a aplicar — y los savepoints fallaban con
 * SQLSTATE 25P01.</p>
 *
 * <p>{@link DataSourceUtils#getConnection(DataSource)} devuelve la conexion
 * vinculada al Hilo de transaccion cuando existe una transaccion activa
 * (auto-commit desactivado), y participa automaticamente en ella. En caso
 * contrario cae a una conexion normal (a modo degradado no-transaccional)
 * sin romper el flujo.</p>
 */
@Component
public class RlsContextFactory {

    private final DataSource dataSource;

    public RlsContextFactory(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    /**
     * Crea un contexto sobre la conexion de la transaccion en curso.
     *
     * <p>El llamante ({@link RlsExecutor}) es responsable de invocar
     * {@link RlsContext#close()} cuando termine para liberar la conexion.</p>
     */
    public RlsContext create() {
        try {
            Connection connection = DataSourceUtils.getConnection(dataSource);
            return new RlsContext(connection, dataSource);
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException(
                    "No se pudo obtener la conexion para fijar el contexto de autorizacion.", e);
        }
    }
}
