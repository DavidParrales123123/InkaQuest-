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

    /** Llave pública (pk_) usada por el navegador para tokenizar y confirmar 3DS. */
    @Value("${culqi.public-key:}")
    private String publicKey;

    @Value("${culqi.secure-base:https://secure.culqi.com/v2}")
    private String secureBase;

    public String getApiKey() {
        return apiKey == null ? "" : apiKey.trim();
    }

    public String getApiBase() {
        return apiBase == null || apiBase.isBlank()
                ? "https://api.culqi.com/v2" : apiBase.replaceAll("/+$", "");
    }

    public String getPublicKey() {
        return publicKey == null ? "" : publicKey.trim();
    }

    public String getSecureBase() {
        return secureBase == null || secureBase.isBlank()
                ? "https://secure.culqi.com/v2" : secureBase.replaceAll("/+$", "");
    }

    public boolean configurado() {
        return !getApiKey().isEmpty();
    }

    /** true cuando hay llave pública para tokenización/3DS en el navegador. */
    public boolean configuradoPublica() {
        return !getPublicKey().isEmpty();
    }
}
