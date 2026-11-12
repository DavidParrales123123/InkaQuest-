package com.inkaquest.shared.configuration;

import com.inkaquest.shared.security.SecurityProperties;
import com.inkaquest.shared.security.SupabaseProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Habilita el binding de las clases de propiedades de la capa compartida.
 */
@Configuration
@EnableConfigurationProperties({CorsProperties.class, SecurityProperties.class, SupabaseProperties.class})
public class SharedPropertiesConfig {
}
