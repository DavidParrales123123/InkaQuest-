package com.inkaquest.shared.configuration;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuración de la documentación OpenAPI (Swagger UI).
 *
 * <p>La documentación se expone en {@code /api-docs} y la interfaz visual en
 * {@code /swagger-ui.html}.
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI inkaQuestOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("InkaQuest API")
                        .version("v0.1.0")
                        .description("API REST de la plataforma LMS gamificada InkaQuest.")
                        .contact(new Contact().name("Equipo InkaQuest"))
                        .license(new License().name("Propietario")));
    }
}
