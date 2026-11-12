package com.inkaquest.modules.chatbot.repository;

import com.inkaquest.modules.chatbot.entity.ChatbotRetroalimentacion;
import com.inkaquest.modules.identidad.entity.Perfil;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositorio JPA de la entidad {@link ChatbotRetroalimentacion} (tabla {@code public.chatbot_retroalimentacion}).
 *
 * <p>Las consultas se ejecutan bajo las politicas RLS de PostgreSQL: el
 * contexto de autorizacion de la transaccion determina que filas son
 * visibles. Ver {@code docs/base-de-datos/MATRIZ-RLS.md}.</p>
 */
@Repository
public interface ChatbotRetroalimentacionRepository extends JpaRepository<ChatbotRetroalimentacion, UUID> {

    /**
     * Consulta derivada sobre la tabla {@code public.chatbot_retroalimentacion}.
     */
    Optional<ChatbotRetroalimentacion> findByUsuarioId(Perfil usuarioId);
}
