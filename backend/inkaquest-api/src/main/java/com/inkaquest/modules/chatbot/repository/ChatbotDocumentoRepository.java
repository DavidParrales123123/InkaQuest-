package com.inkaquest.modules.chatbot.repository;

import com.inkaquest.modules.chatbot.entity.ChatbotDocumento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositorio JPA de la entidad {@link ChatbotDocumento} (tabla {@code public.chatbot_documento}).
 *
 * <p>Las consultas se ejecutan bajo las politicas RLS de PostgreSQL: el
 * contexto de autorizacion de la transaccion determina que filas son
 * visibles. Ver {@code docs/base-de-datos/MATRIZ-RLS.md}.</p>
 */
@Repository
public interface ChatbotDocumentoRepository extends JpaRepository<ChatbotDocumento, UUID> {
}
