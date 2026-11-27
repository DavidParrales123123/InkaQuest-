package com.inkaquest.shared.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.inkaquest.shared.response.ApiResponse;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Rechaza peticiones manifiestamente maliciosas antes de que consuman recursos:
 * URIs excesivamente largas, path traversal, bytes nulos y parámetros sospechosos.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 5)
public class RequestSanityFilter extends OncePerRequestFilter {

    private static final int MAX_URI = 2048;
    private static final int MAX_QUERY = 2048;
    private static final int MAX_PARAMETROS = 60;

    private final ObjectMapper objectMapper;

    public RequestSanityFilter(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String uri = request.getRequestURI();
        String query = request.getQueryString();

        boolean invalida = uri == null || uri.length() > MAX_URI
                || (query != null && query.length() > MAX_QUERY)
                || contieneSecuenciaPeligrosa(uri)
                || (query != null && contieneSecuenciaPeligrosa(query))
                || request.getParameterMap().size() > MAX_PARAMETROS;

        if (invalida) {
            response.setStatus(HttpStatus.BAD_REQUEST.value());
            response.setContentType("application/json;charset=UTF-8");
            objectMapper.writeValue(response.getOutputStream(), ApiResponse.error(
                    "La petición no es válida.", "BAD_REQUEST", request.getRequestURI()));
            response.getOutputStream().flush();
            return;
        }
        chain.doFilter(request, response);
    }

    private boolean contieneSecuenciaPeligrosa(String valor) {
        String v = valor.toLowerCase(java.util.Locale.ROOT);
        return v.contains("%00") || v.contains("\u0000")
                || v.contains("../") || v.contains("..%2f") || v.contains("..\\");
    }
}
