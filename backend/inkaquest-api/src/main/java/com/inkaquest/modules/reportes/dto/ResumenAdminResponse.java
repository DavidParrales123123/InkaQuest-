package com.inkaquest.modules.reportes.dto;

import java.math.BigDecimal;

/** Resumen administrativo de la plataforma (agregados). */
public record ResumenAdminResponse(
        long usuariosEstudiantes,
        long usuariosDocentes,
        long usuariosAdministradores,
        long cursosPublicados,
        long cursosBorrador,
        long cursosTotales,
        long matriculasActivas,
        long matriculasCompletadas,
        long matriculasTotales,
        long pedidosPagados,
        long pedidosPendientes,
        BigDecimal ingresosPEN,
        BigDecimal ingresosUSD) {
}
