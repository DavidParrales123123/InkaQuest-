package com.inkaquest.modules.soporte.repository;

import com.inkaquest.modules.soporte.entity.Mensaje;
import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

/**
 * Repositorio JPA de la entidad {@link Mensaje} (tabla {@code public.mensaje}).
 */
@Repository
public interface MensajeRepository extends JpaRepository<Mensaje, UUID> {

    /** Conversacion entre dos usuarios cualesquiera, en orden ascendente. */
    @Query("select m from Mensaje m where (m.emisorId.id = :yo and m.destinatarioId.id = :otro) or (m.emisorId.id = :otro and m.destinatarioId.id = :yo) order by m.creadoEn asc")
    List<Mensaje> conversacion(@Param("yo") UUID yo, @Param("otro") UUID otro);

    /** Todos los mensajes del usuario (limitados para no cargarlo todo). */
    @Query("select m from Mensaje m where (m.emisorId.id = :yo or m.destinatarioId.id = :yo) order by m.creadoEn desc")
    List<Mensaje> ultimosDeUsuario(@Param("yo") UUID yo, Limit limit);

    /** Mensajes recibidos del otro usuario sin leer por mi. */
    @Query("select count(m) from Mensaje m where m.destinatarioId.id = :yo and m.emisorId.id = :otro and m.leidoEn is null")
    long countSinLeer(@Param("yo") UUID yo, @Param("otro") UUID otro);
}
