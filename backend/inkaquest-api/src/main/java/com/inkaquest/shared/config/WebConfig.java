package com.inkaquest.shared.config;

import com.inkaquest.shared.security.AccountStatusInterceptor;
import com.inkaquest.shared.security.AuthenticatedUserResolver;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.List;

/**
 * Configuración de Spring MVC.
 * 
 * <p>Registra resolvers personalizados como {@link AuthenticatedUserResolver}.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final AuthenticatedUserResolver authenticatedUserResolver;
    private final AccountStatusInterceptor accountStatusInterceptor;

    public WebConfig(AuthenticatedUserResolver authenticatedUserResolver,
                     AccountStatusInterceptor accountStatusInterceptor) {
        this.authenticatedUserResolver = authenticatedUserResolver;
        this.accountStatusInterceptor = accountStatusInterceptor;
    }

    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        resolvers.add(authenticatedUserResolver);
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(accountStatusInterceptor)
                .addPathPatterns("/api/v1/**");
    }
}
