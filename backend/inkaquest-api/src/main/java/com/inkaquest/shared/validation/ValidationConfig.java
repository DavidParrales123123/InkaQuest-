package com.inkaquest.shared.validation;

import jakarta.validation.Validator;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

/**
 * Configuración de validación de beans (Jakarta Bean Validation).
 *
 * <p>Habilita validación automática de:
 * <ul>
 *   <li>{@code @Valid} en parámetros de controllers</li>
 *   <li>{@code @Validated} en clases de servicio</li>
 *   <li>Constraints: {@code @NotNull}, {@code @Size}, {@code @Pattern}, etc.</li>
 * </ul>
 *
 * <p>Todos los errores de validación se capturan en {@code GlobalExceptionHandler}
 * y se convierten a respuestas 400 con el contrato {@code ApiResponse}.</p>
 */
@Configuration
public class ValidationConfig {

    /**
     * Validator de Spring que usa Jakarta Validation (Hibernate Validator).
     *
     * <p>Configuración por defecto: mensajes interpolados desde
     * {@code ValidationMessages.properties} y ejecución automática al
     * procesar parámetros anotados con {@code @Valid}.</p>
     */
    @Bean
    public Validator validator() {
        return new LocalValidatorFactoryBean();
    }
}
