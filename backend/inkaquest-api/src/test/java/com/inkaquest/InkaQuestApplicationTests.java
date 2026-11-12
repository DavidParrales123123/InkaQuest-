package com.inkaquest;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Prueba de carga del contexto de aplicacion.
 *
 * <p>Verifica que Spring Boot arranca correctamente la configuracion base
 * (seguridad, CORS, OpenAPI, actuator y la capa JPA) contra la base de datos
 * real del proyecto.</p>
 *
 * <p>Requiere las variables {@code DB_URL}, {@code DB_USERNAME} y
 * {@code DB_PASSWORD} configuradas (ver {@code .env.example}).</p>
 */
@SpringBootTest
@ActiveProfiles("local")
class InkaQuestApplicationTests {

    @Autowired
    private ApplicationContext context;

    @Test
    @DisplayName("El contexto de la aplicacion arranca correctamente")
    void contextLoads() {
        assertThat(context).isNotNull();
        assertThat(context.getEnvironment().getActiveProfiles()).contains("local");
    }
}
