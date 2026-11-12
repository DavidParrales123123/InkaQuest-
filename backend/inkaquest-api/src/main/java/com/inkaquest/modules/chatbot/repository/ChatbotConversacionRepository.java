package com.inkaquest.modules.chatbot.repository;

import com.inkaquest.modules.chatbot.entity.ChatbotConversacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

/**
 * Repositorio JPA de la entidad {@link ChatbotConversacion} (tabla {@code public.chatbot_conversacion}).
 *
 * <p>Las consultas se ejecutan bajo las politicas RLS de PostgreSQL: el
 * contexto de autorizacion de la transaccion determina que filas son
 * visibles. Ver {@code docs/base-de-datos/MATRIZ-RLS.md}.</p>
 */
@Repository
public interface ChatbotConversacionRepository extends JpaRepository<ChatbotConversacion, UUID> {

    /**
     * Consulta derivada sobre la tabla {@code public.chatbot_conversacion}.
     */
    List<ChatbotConversacion> findAllByUsuarioId_IdOrderByActualizadoEnDesc(java.util.UUID usuarioId);
}
