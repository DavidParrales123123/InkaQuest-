package com.inkaquest.modules.comercio.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/** Configuración del cliente privado de Culqi. Los secretos solo existen en el backend. */
@Component
public class CulqiConfig {
    @Value("${culqi.api-key:}")
    private String apiKey;

    @Value("${culqi.api-base:https://api.culqi.com/v2}")
    private String apiBase;

    public String getApiKey() {
        return apiKey == null ? "" : apiKey.trim();
    }

    public String getApiBase() {
        return apiBase == null || apiBase.isBlank()
                ? "https://api.culqi.com/v2" : apiBase.replaceAll("/+$", "");
    }

    public boolean configurado() {
        return !getApiKey().isEmpty();
    }
}
