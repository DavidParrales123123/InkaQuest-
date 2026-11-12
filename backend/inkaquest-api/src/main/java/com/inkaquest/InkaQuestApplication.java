package com.inkaquest;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

/**
 * Punto de entrada de la API REST de InkaQuest.
 *
 * <p>La aplicación usa arquitectura modular por capas:
 * <ul>
 *   <li>{@code shared} — configuración, seguridad, manejo de excepciones y contrato de respuestas.</li>
 *   <li>{@code modules} — módulos de negocio independientes (uno por dominio).</li>
 * </ul>
 */
@SpringBootApplication
@ConfigurationPropertiesScan
public class InkaQuestApplication {

    public static void main(String[] args) {
        SpringApplication.run(InkaQuestApplication.class, args);
    }
}
