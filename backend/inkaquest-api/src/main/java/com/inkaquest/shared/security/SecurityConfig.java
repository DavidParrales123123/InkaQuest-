package com.inkaquest.shared.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.inkaquest.shared.response.ApiResponse;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;

/**
 * Configuracion de Spring Security.
 *
 * <p>Stateless: la API no usa sesiones ni cookies de estado; solo
 * <strong>Bearer JWT</strong> emitido por Supabase Auth verificado contra el
 * JWKS del proyecto. El rol efectivo (estudiante/docente/administrador) siempre
 * se evalua contra {@code public.perfil.rol} en PostgreSQL, nunca desde el token
 * ni desde Angular.</p>
 *
 * <p>Incluye rate limiting por IP para rutas sensibles a abuso y cabeceras
 * de seguridad estrictas.</p>
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final RateLimitFilter rateLimitFilter;
    private final ObjectMapper objectMapper;

    public SecurityConfig(RateLimitFilter rateLimitFilter,
                          ObjectMapper objectMapper) {
        this.rateLimitFilter = rateLimitFilter;
        this.objectMapper = objectMapper;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        PrincipalJwtAuthenticationConverter converter = new PrincipalJwtAuthenticationConverter();

        http.csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .addFilterBefore(rateLimitFilter, UsernamePasswordAuthenticationFilter.class)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(
                                "/actuator/health",
                                "/actuator/info",
                                "/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                // Webhook de Culqi: se verifica contra la API autenticada del proveedor (nunca JWT).
                                "/api/v1/webhooks/culqi",
                                // Verificacion publica de certificados por codigo.
                                "/api/v1/certificados/verificar/**",
                                // Catálogo público de cursos (GET solamente)
                                "/api/v1/cursos",
                                "/api/v1/cursos/*",
                                // Categorías públicas
                                "/api/v1/categorias")
                        .permitAll()
                        .anyRequest().authenticated())
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(converter))
                        .authenticationEntryPoint((request, response, exception) -> {
                            response.setStatus(HttpStatus.UNAUTHORIZED.value());
                            response.setContentType("application/json;charset=UTF-8");
                            objectMapper.writeValue(response.getOutputStream(), ApiResponse.error(
                                    "Debes iniciar sesion para continuar.", "UNAUTHORIZED", request.getRequestURI()));
                        })
                        .accessDeniedHandler(accessDeniedHandler()))
                .headers(headers -> headers
                        .contentSecurityPolicy(csp -> csp.policyDirectives(
                                "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"))
                        .frameOptions(frame -> frame.deny())
                        .referrerPolicy(referrer -> referrer.policy(
                                ReferrerPolicyHeaderWriter.ReferrerPolicy.NO_REFERRER))
                        .contentTypeOptions(Customizer.withDefaults())
                        .cacheControl(Customizer.withDefaults()));

        return http.build();
    }

    @Bean
    public AccessDeniedHandler accessDeniedHandler() {
        return (request, response, exception) -> {
            response.setStatus(HttpStatus.FORBIDDEN.value());
            response.setContentType("application/json;charset=UTF-8");
            objectMapper.writeValue(response.getOutputStream(), ApiResponse.error(
                    "No tienes permisos para acceder a este recurso.", "FORBIDDEN", request.getRequestURI()));
            response.getOutputStream().flush();
        };
    }
}
