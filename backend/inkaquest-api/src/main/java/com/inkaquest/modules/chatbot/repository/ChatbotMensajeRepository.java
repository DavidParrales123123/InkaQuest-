package com.inkaquest.modules.chatbot.repository;

import com.inkaquest.modules.chatbot.entity.ChatbotMensaje;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

/**
 * Repositorio JPA de la entidad {@link ChatbotMensaje} (tabla {@code public.chatbot_mensaje}).
 *
 * <p>Las consultas se ejecutan bajo las politicas RLS de PostgreSQL: el
 * contexto de autorizacion de la transaccion determina que filas son
 * visibles. Ver {@code docs/base-de-datos/MATRIZ-RLS.md}.</p>
 */
@Repository
public interface ChatbotMensajeRepository extends JpaRepository<ChatbotMensaje, UUID> {

    /** Historial ordenado cronologicamente de una conversacion. */
    List<ChatbotMensaje> findAllByConversacionId_IdOrderByCreadoEnAsc(UUID conversacionId);
}
