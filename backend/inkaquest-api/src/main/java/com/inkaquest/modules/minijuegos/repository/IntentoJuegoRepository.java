package com.inkaquest.modules.minijuegos.repository;

import com.inkaquest.modules.identidad.entity.Perfil;
import com.inkaquest.modules.minijuegos.entity.ActividadJuego;
import com.inkaquest.modules.minijuegos.entity.IntentoJuego;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositorio JPA de la entidad {@link IntentoJuego} (tabla {@code public.intento_juego}).
 *
 * <p>Las consultas se ejecutan bajo las politicas RLS de PostgreSQL: el
 * contexto de autorizacion de la transaccion determina que filas son
 * visibles. Ver {@code docs/base-de-datos/MATRIZ-RLS.md}.</p>
 */
@Repository
public interface IntentoJuegoRepository extends JpaRepository<IntentoJuego, UUID> {

    /**
     * Consulta derivada sobre la tabla {@code public.intento_juego}.
     */
    Optional<IntentoJuego> findByEstudianteIdAndActividadJuegoId(Perfil estudianteId, ActividadJuego actividadJuegoId);

    /**
     * Consulta derivada sobre la tabla {@code public.intento_juego}.
     */
    Optional<IntentoJuego> findByEstudianteId(Perfil estudianteId);
}
