package com.inkaquest.modules.retos.repository;

import com.inkaquest.modules.retos.entity.EnvioReto;
import com.inkaquest.modules.retos.entity.Reto;
import com.inkaquest.modules.identidad.entity.Perfil;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositorio JPA de la entidad {@link EnvioReto} (tabla {@code public.envio_reto}).
 */
@Repository
public interface EnvioRetoRepository extends JpaRepository<EnvioReto, UUID> {

    /** Envios del estudiante en un reto (paginados). */
    Page<EnvioReto> findByRetoIdAndEstudianteId(Reto retoId, Perfil estudianteId, Pageable pageable);

    /** Envios del estudiante en un reto, mas recientes primero. */
    @Query("select e from EnvioReto e where e.retoId.id = :retoId and e.estudianteId.id = :estudianteId order by e.creadoEn desc")
    List<EnvioReto> findDeEstudianteEnReto(UUID retoId, UUID estudianteId);

    /** Cantidad de envios del estudiante en el reto (control de intentos). */
    @Query("select count(e) from EnvioReto e where e.retoId.id = :retoId and e.estudianteId.id = :estudianteId")
    long countDeEstudianteEnReto(UUID retoId, UUID estudianteId);

    /** Busqueda por idempotencia para no duplicar envios. */
    Optional<EnvioReto> findByClaveIdempotencia(String claveIdempotencia);
}
