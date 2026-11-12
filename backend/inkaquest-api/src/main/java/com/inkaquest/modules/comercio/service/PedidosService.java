package com.inkaquest.modules.comercio.service;

import com.inkaquest.modules.academico.entity.Curso;
import com.inkaquest.modules.academico.repository.CursoRepository;
import com.inkaquest.modules.comercio.dto.PedidoIniciarRequest;
import com.inkaquest.modules.comercio.dto.PedidoResponse;
import com.inkaquest.modules.comercio.entity.*;
import com.inkaquest.modules.comercio.repository.*;
import com.inkaquest.modules.identidad.entity.Perfil;
import com.inkaquest.modules.identidad.repository.PerfilRepository;
import com.inkaquest.modules.matriculas.entity.Matricula;
import com.inkaquest.modules.matriculas.repository.MatriculaRepository;
import com.inkaquest.shared.enums.*;
import com.inkaquest.shared.exception.BadRequestException;
import com.inkaquest.shared.exception.ResourceNotFoundException;
import com.inkaquest.shared.exception.UnauthorizedException;
import com.inkaquest.shared.security.CheckRoleService;
import com.inkaquest.shared.security.RlsExecutor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Servicio de pedidos de compra de cursos.
 *
 * <p>La confimacion SIEMPRE ocurre por webhook (HMAC verificada), nunca por
 * una redireccion del navegador. La matricula se activa unicamente cuando el
 * webhook confirma el pago.</p>
 */
@Service
public class PedidosService {

    private final PedidoRepository pedidoRepository;
    private final DetallePedidoRepository detallePedidoRepository;
    private final TransaccionRepository transaccionRepository;
    private final CursoRepository cursoRepository;
    private final PerfilRepository perfilRepository;
    private final MatriculaRepository matriculaRepository;
    private final CuponesService cuponesService;
    private final CulqiClient culqiClient;
    private final CheckRoleService checkRoleService;
    private final RlsExecutor rlsExecutor;

    public PedidosService(PedidoRepository pedidoRepository,
                          DetallePedidoRepository detallePedidoRepository,
                          TransaccionRepository transaccionRepository,
                          CursoRepository cursoRepository,
                          PerfilRepository perfilRepository,
                          MatriculaRepository matriculaRepository,
                          CuponesService cuponesService,
                          CulqiClient culqiClient,
                          CheckRoleService checkRoleService,
                          RlsExecutor rlsExecutor) {
        this.pedidoRepository = pedidoRepository;
        this.detallePedidoRepository = detallePedidoRepository;
        this.transaccionRepository = transaccionRepository;
        this.cursoRepository = cursoRepository;
        this.perfilRepository = perfilRepository;
        this.matriculaRepository = matriculaRepository;
        this.cuponesService = cuponesService;
        this.culqiClient = culqiClient;
        this.checkRoleService = checkRoleService;
        this.rlsExecutor = rlsExecutor;
    }

    /** Inicia la compra de un curso. El precio se calcula en el servidor. */
    @Transactional
    public PedidoResponse iniciarCompra(UUID estudianteId, PedidoIniciarRequest request) {
        return rlsExecutor.executeAs(estudianteId, () -> {
            // Idempotencia: si el cliente reintenta con la misma clave, devolver la orden existente.
            if (request.claveIdempotencia() != null && !request.claveIdempotencia().isBlank()) {
                Pedido existente = pedidoRepository.findByClaveIdempotencia(request.claveIdempotencia().trim())
                        .orElse(null);
                if (existente != null) {
                    return aResponse(existente);
                }
            }

            if (request.cursoSlug() == null || request.cursoSlug().isBlank()) {
                throw new BadRequestException("El slug del curso es obligatorio.");
            }

            Curso curso = cursoRepository.findBySlug(request.cursoSlug().trim())
                    .orElseThrow(() -> new ResourceNotFoundException("Curso no encontrado."));
            if (curso.getEstado() != EstadoCurso.publicado) {
                throw new BadRequestException("Ese curso no esta publicado.");
            }

            Perfil estudiante = perfilRepository.findById(estudianteId)
                    .orElseThrow(() -> new ResourceNotFoundException("Perfil no encontrado."));

            // Regla de negocio: no comprar un curso que ya posees activo.
            matriculaRepository.findByEstudianteIdAndCursoId(estudiante, curso)
                    .filter(m -> m.getEstado() == EstadoMatricula.activa)
                    .ifPresent(m -> {
                        throw new BadRequestException("Ya estas matriculado en este curso.");
                    });

            BigDecimal subtotal = curso.getPrecio().setScale(2, java.math.RoundingMode.HALF_UP);
            String moneda = curso.getMoneda();

            Cupon cupon = null;
            BigDecimal descuento = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
            if (request.cuponCodigo() != null && !request.cuponCodigo().isBlank()) {
                cupon = cuponesService.exigirValido(estudianteId, request.cuponCodigo(), subtotal);
                descuento = cuponesService.descuentoDe(cupon, subtotal);
            }
            BigDecimal total = DescuentoCalculator.totalFinal(subtotal, descuento);

            Pedido pedido = new Pedido();
            pedido.setUsuarioId(estudiante);
            pedido.setNumero(generarNumero());
            pedido.setEstado(EstadoPedido.pendiente);
            pedido.setSubtotal(subtotal);
            pedido.setDescuento(descuento);
            pedido.setTotal(total);
            pedido.setMoneda(moneda);
            pedido.setCuponId(cupon);
            pedido.setClaveIdempotencia(request.claveIdempotencia() != null
                    && !request.claveIdempotencia().isBlank()
                    ? request.claveIdempotencia().trim()
                    : UUID.randomUUID().toString());
            pedido = pedidoRepository.save(pedido);

            DetallePedido detalle = new DetallePedido();
            detalle.setPedidoId(pedido);
            detalle.setCursoId(curso);
            detalle.setTituloSnapshot(curso.getTitulo());
            detalle.setPrecioUnitario(subtotal);
            detalle.setCantidad(1);
            detalle.setSubtotal(subtotal);
            detallePedidoRepository.save(detalle);

            Transaccion transaccion = new Transaccion();
            transaccion.setPedidoId(pedido);
            transaccion.setUsuarioId(estudiante);
            transaccion.setEstado(EstadoPago.iniciado);
            transaccion.setMetodo(MetodoPago.tarjeta);
            transaccion.setMonto(total);
            transaccion.setMoneda(moneda);
            transaccion.setProveedor("culqi");
            transaccion.setReferencia(null);
            transaccion.setClaveIdempotencia(pedido.getClaveIdempotencia());
            transaccion.setDatos(Map.of(
                    "numero_pedido", pedido.getNumero(),
                    "curso_slug", curso.getSlug()));
            transaccion = transaccionRepository.save(transaccion);

            // Si el cliente aporto un token Culqi y el servidor esta configurado, crear el cargo.
            if (request.culqiToken() != null && !request.culqiToken().isBlank()
                    && culqiClient.configurado()) {
                try {
                    String cargoId = culqiClient.crearCobro(
                            total.multiply(BigDecimal.valueOf(100)).setScale(0, RoundingMode.HALF_UP).longValueExact(),
                            moneda,
                            estudiante.getEmail(),
                            pedido.getNumero(),
                            request.culqiToken().trim());
                    transaccion.setReferencia(cargoId);
                    transaccion = transaccionRepository.save(transaccion);
                } catch (CulqiClient.CulqiException e) {
                    // No exponemos el detalle al frontend; el pedido queda pendiente.
                    transaccion.setEstado(EstadoPago.fallido);
                    transaccion.setDatos(Map.of(
                            "numero_pedido", pedido.getNumero(),
                            "curso_slug", curso.getSlug(),
                            "error", "cargo_rechazado"));
                    transaccionRepository.save(transaccion);
                    pedido.setEstado(EstadoPedido.fallido);
                    pedidoRepository.save(pedido);
                    throw new BadRequestException(
                            "El pago fue rechazado por el proveedor. Revisa tus datos e intentalo de nuevo.");
                }
            }

            return aResponse(pedido);
        });
    }

    /** Lista pedidos del estudiante autenticado. */
    @Transactional
    public List<PedidoResponse> misPedidos(UUID actorId) {
        return rlsExecutor.executeAs(actorId, () ->
                pedidoRepository.findDeUsuario(actorId).stream()
                        .map(this::aResponse)
                        .toList());
    }

    /** Detalle de un pedido: solo propietario o administrador. */
    @Transactional
    public PedidoResponse detalle(UUID actorId, String numero) {
        return rlsExecutor.executeAs(actorId, () -> {
            Pedido pedido = pedidoRepository.findByNumero(numero)
                    .orElseThrow(() -> new ResourceNotFoundException("Pedido no encontrado."));
            boolean esAdmin = checkRoleService.rolDe(actorId) == RolUsuario.administrador;
            boolean esDueno = pedido.getUsuarioId() != null && actorId.equals(pedido.getUsuarioId().getId());
            if (!esAdmin && !esDueno) {
                throw new UnauthorizedException("No puedes ver un pedido ajeno.");
            }
            return aResponse(pedido);
        });
    }

    // ---------- helpers internos (usados por el webhook dentro de system tx) ----------

    private PedidoResponse aResponse(Pedido pedido) {
        List<DetallePedido> lineas = detallePedidoRepository.findDePedido(pedido.getId());
        List<PedidoResponse.DetalleLinea> detalle = lineas.stream()
                .map(d -> new PedidoResponse.DetalleLinea(
                        d.getCursoId() != null ? d.getCursoId().getId() : null,
                        d.getTituloSnapshot(),
                        d.getPrecioUnitario(),
                        d.getCantidad(),
                        d.getSubtotal()))
                .toList();
        String transaccionEstado = transaccionRepository.findDePedido(pedido.getId())
                .stream().findFirst()
                .map(t -> t.getEstado().getValor())
                .orElse(null);
        Curso curso = lineas.isEmpty() ? null : lineas.get(0).getCursoId();
        return new PedidoResponse(
                pedido.getId(),
                pedido.getNumero(),
                pedido.getEstado(),
                curso != null ? curso.getSlug() : null,
                curso != null ? curso.getTitulo() : null,
                pedido.getSubtotal(),
                pedido.getDescuento(),
                pedido.getTotal(),
                pedido.getMoneda(),
                transaccionEstado,
                culqiClient.configurado(),
                detalle,
                pedido.getCreadoEn());
    }

    private String generarNumero() {
        long now = System.currentTimeMillis();
        String aleatorio = UUID.randomUUID().toString().replace("-", "").substring(0, 5).toUpperCase();
        return "INK-" + now + "-" + aleatorio;
    }
}
