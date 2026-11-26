package com.inkaquest.modules.comercio.repository;

import com.inkaquest.modules.comercio.entity.TarjetaGuardada;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TarjetaGuardadaRepository extends JpaRepository<TarjetaGuardada, UUID> {

    List<TarjetaGuardada> findAllByUsuarioId_IdAndActivoTrueOrderByCreadoEnDesc(UUID usuarioId);
}
