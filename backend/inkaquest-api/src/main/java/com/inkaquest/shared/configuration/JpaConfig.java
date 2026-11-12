package com.inkaquest.shared.configuration;

import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

/**
 * Configuracion de la capa de persistencia.
 *
 * <p>Habilita el escaneo de entidades y repositorios en todo el modulo
 * {@code com.inkaquest}, para que las entidades de cada modulo de negocio se
 * descubran automaticamente.
 */
@Configuration
@EnableJpaAuditing
@EntityScan(basePackages = "com.inkaquest.modules")
@EnableJpaRepositories(basePackages = "com.inkaquest.modules")
public class JpaConfig {

    /**
     * Prefijo de las tablas de la base de datos.
     *
     * <p>El esquema {@code public} es el de Supabase. Se declara de forma
     * explicita para que Hibernate no dependa del {@code search_path} de la
     * conexion.
     */
    public static final String ESQUEMA = "public";
}
