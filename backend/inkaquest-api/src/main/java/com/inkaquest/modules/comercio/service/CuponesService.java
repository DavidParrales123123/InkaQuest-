package com.inkaquest.modules.comercio.service;

import com.inkaquest.modules.comercio.dto.CuponCrearRequest;
import com.inkaquest.modules.comercio.dto.CuponValidacionResponse;
import com.inkaquest.modules.comercio.entity.Cupon;
import com.inkaquest.modules.comercio.repository.CuponRepository;
import com.inkaquest.modules.comercio.repository.PedidoRepository;
import com.inkaquest.shared.enums.EstadoPedido;
import com.inkaquest.shared.exception.BadRequestException;
import com.inkaquest.shared.exception.ResourceNotFoundException;
import com.inkaquest.shared.security.RlsExecutor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Servicio de cupones y promociones.
 *
 * <p>El monto definitivo SIEMPRE se calcula en el backend; Angular nunca
 * decide el total a cobrar.</p>
 */
@Service
public class CuponesService {

    private final CuponRepository cuponRepository;
    private final PedidoRepository pedidoRepository;
    private final RlsExecutor rlsExecutor;

    public CuponesService(CuponRepository cuponRepository,
                          PedidoRepository pedidoRepository,
                          RlsExecutor rlsExecutor) {
        this.cuponRepository = cuponRepository;
        this.pedidoRepository = pedidoRepository;
        this.rlsExecutor = rlsExecutor;
    }

    /** Valida un cupon para un subtotal y devuelve el descuento aplicable. */
    @Transactional
    public CuponValidacionResponse validar(UUID actorId, String codigo, BigDecimal subtotal) {
        return rlsExecutor.executeAs(actorId, () -> {
            String norm = codigo == null ? null : codigo.trim().toUpperCase();
            if (norm == null || norm.isBlank()) {
                return CuponValidacionResponse.invalido("Codigo vacio.", codigo);
            }
            Cupon cupon = cuponRepository.findByCodigo(norm).orElse(null);
            if (cupon == null) {
                return CuponValidacionResponse.invalido("El cupon no existe.", norm);
            }
            String motivo = motivoInvalidez(cupon, actorId);
            if (motivo != null) {
                return CuponValidacionResponse.invalido(motivo, norm);
            }
            BigDecimal descuento = DescuentoCalculator.calcular(cupon.getTipo(), cupon.getValor(), subtotal);
            BigDecimal total = DescuentoCalculator.totalFinal(subtotal, descuento);
            return CuponValidacionResponse.valido(cupon, descuento, total);
        });
    }

    /** Valida y devuelve el cupon, o lanza excepcion de negocio. */
    @Transactional
    public Cupon exigirValido(UUID actorId, String codigo, BigDecimal subtotal) {
        Cupon cupon = cuponRepository.findByCodigo(codigo.trim().toUpperCase())
                .orElseThrow(() -> new BadRequestException("El cupon no existe."));
        String motivo = motivoInvalidez(cupon, actorId);
        if (motivo != null) {
            throw new BadRequestException(motivo);
        }
        return cupon;
    }

    /** Aplica el descuento validado sobre un subtotal (usa el cupon ya validado). */
    public BigDecimal descuentoDe(Cupon cupon, BigDecimal subtotal) {
        return DescuentoCalculator.calcular(cupon.getTipo(), cupon.getValor(), subtotal);
    }

    /** Lista todos los cupones (admin). */
    @Transactional
    public List<CuponCrearRequest.CuponResponse> listar(UUID actorId) {
        return rlsExecutor.executeAs(actorId, () -> cuponRepository.findAll().stream()
                .map(CuponCrearRequest.CuponResponse::from)
                .toList());
    }

    /** Crea un cupon (admin). */
    @Transactional
    public CuponCrearRequest.CuponResponse crear(UUID actorId, CuponCrearRequest request) {
        return rlsExecutor.executeAs(actorId, () -> {
            String codigo = request.codigo().trim().toUpperCase();
            if (cuponRepository.findByCodigo(codigo).isPresent()) {
                throw new BadRequestException("Ya existe un cupon con ese codigo.");
            }
            if (request.validoHasta().isBefore(request.validoDesde())) {
                throw new BadRequestException("La vigencia del cupon es incoherente.");
            }
            Cupon cupon = new Cupon();
            cupon.setCodigo(codigo);
            cupon.setDescripcion(request.descripcion());
            cupon.setTipo(request.tipo());
            cupon.setValor(request.valor());
            cupon.setUsosMaximos(request.usosMaximos() != null ? request.usosMaximos() : 0);
            cupon.setUsosActuales(0);
            cupon.setLimitePorUsuario(request.limitePorUsuario() != null ? request.limitePorUsuario() : 0);
            cupon.setValidoDesde(request.validoDesde());
            cupon.setValidoHasta(request.validoHasta());
            cupon.setActivo(Boolean.TRUE);
            return CuponCrearRequest.CuponResponse.from(cuponRepository.save(cupon));
        });
    }

    /** Activa/desactiva un cupon (admin). */
    @Transactional
    public CuponCrearRequest.CuponResponse cambiarEstado(UUID actorId, UUID id, boolean activo) {
        return rlsExecutor.executeAs(actorId, () -> {
            Cupon cupon = cuponRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Cupon no encontrado."));
            cupon.setActivo(activo);
            return CuponCrearRequest.CuponResponse.from(cuponRepository.save(cupon));
        });
    }

    // ---------- interno ----------

    /** Devuelve null si es valido, o el motivo de invalidez. */
    private String motivoInvalidez(Cupon cupon, UUID actorId) {
        Instant ahora = Instant.now();
        if (!Boolean.TRUE.equals(cupon.getActivo())) {
            return "El cupon esta desactivado.";
        }
        if (cupon.getValidoDesde() != null && ahora.isBefore(cupon.getValidoDesde())) {
            return "El cupon aun no esta vigente.";
        }
        if (cupon.getValidoHasta() != null && ahora.isAfter(cupon.getValidoHasta())) {
            return "El cupon ha vencido.";
        }
        if (cupon.getUsosMaximos() != null && cupon.getUsosMaximos() > 0
                && cupon.getUsosActuales() >= cupon.getUsosMaximos()) {
            return "El cupon se agoto.";
        }
        if (cupon.getLimitePorUsuario() != null && cupon.getLimitePorUsuario() > 0 && actorId != null) {
            long usados = pedidoRepository.countPagadosConCupon(actorId, cupon.getId(),
                    List.of(EstadoPedido.pagado, EstadoPedido.procesando, EstadoPedido.reembolsado));
            // Los reembolsados contabilizan como uso consumido (documentado en el contrato).
            if (usados >= cupon.getLimitePorUsuario()) {
                return "Has alcanzado el limite de este cupon por usuario.";
            }
        }
        return null;
    }
}
