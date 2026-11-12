package com.inkaquest.modules.certificados.service;

import com.inkaquest.modules.academico.entity.Curso;
import com.inkaquest.modules.academico.repository.CursoRepository;
import com.inkaquest.modules.certificados.dto.CertificadoResponse;
import com.inkaquest.modules.certificados.entity.*;
import com.inkaquest.modules.certificados.repository.*;
import com.inkaquest.modules.identidad.entity.Perfil;
import com.inkaquest.modules.identidad.repository.PerfilRepository;
import com.inkaquest.modules.matriculas.entity.Matricula;
import com.inkaquest.modules.matriculas.repository.MatriculaRepository;
import com.inkaquest.modules.progreso.repository.ProgresoCursoRepository;
import com.inkaquest.shared.enums.EstadoMatricula;
import com.inkaquest.shared.enums.EstadoProgreso;
import com.inkaquest.shared.exception.BadRequestException;
import com.inkaquest.shared.exception.ResourceNotFoundException;
import com.inkaquest.shared.security.RlsExecutor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Servicio de certificados.
 *
 * <p>El certificado SOLO se emite con curso completado (progreso_curso
 * `completado` o matricula `completada`). La emision es idempotente: un curso
 * solo puede dar UN certificado por estudiante.</p>
 *
 * <p>La verificacion publica revela solo lo necesario para autenticar
 * autenticidad: titular, curso, fecha y estado. Nunca documentos ni datos
 * privados del estudiante.</p>
 */
@Service
public class CertificadosService {

    private final CertificadoRepository certificadoRepository;
    private final CertificadoTitularRepository titularRepository;
    private final CertificadoCursoRepository certificadoCursoRepository;
    private final CertificadoEmisionRepository emisionRepository;
    private final CursoRepository cursoRepository;
    private final MatriculaRepository matriculaRepository;
    private final ProgresoCursoRepository progresoCursoRepository;
    private final PerfilRepository perfilRepository;
    private final RlsExecutor rlsExecutor;

    public CertificadosService(CertificadoRepository certificadoRepository,
                               CertificadoTitularRepository titularRepository,
                               CertificadoCursoRepository certificadoCursoRepository,
                               CertificadoEmisionRepository emisionRepository,
                               CursoRepository cursoRepository,
                               MatriculaRepository matriculaRepository,
                               ProgresoCursoRepository progresoCursoRepository,
                               PerfilRepository perfilRepository,
                               RlsExecutor rlsExecutor) {
        this.certificadoRepository = certificadoRepository;
        this.titularRepository = titularRepository;
        this.certificadoCursoRepository = certificadoCursoRepository;
        this.emisionRepository = emisionRepository;
        this.cursoRepository = cursoRepository;
        this.matriculaRepository = matriculaRepository;
        this.progresoCursoRepository = progresoCursoRepository;
        this.perfilRepository = perfilRepository;
        this.rlsExecutor = rlsExecutor;
    }

    /**
     * Emite el certificado del usuario autenticado para un curso completado.
     * Idempotente: si ya existe, lo devuelve.
     */
    @Transactional
    public CertificadoResponse emitirParaCurso(UUID estudianteId, String cursoSlug) {
        return rlsExecutor.executeAs(estudianteId, () -> {
            if (cursoSlug == null || cursoSlug.isBlank()) {
                throw new BadRequestException("El curso es obligatorio.");
            }

            Perfil estudiante = perfilRepository.findById(estudianteId)
                    .orElseThrow(() -> new ResourceNotFoundException("Perfil no encontrado."));
            Curso curso = cursoRepository.findBySlug(cursoSlug.trim())
                    .orElseThrow(() -> new ResourceNotFoundException("Curso no encontrado."));

            Matricula matricula = matriculaRepository.findByEstudianteIdAndCursoId(estudiante, curso)
                    .orElseThrow(() -> new BadRequestException(
                            "No has estado matriculado en este curso."));

            boolean completado = matricula.getEstado() == EstadoMatricula.completada
                    || progresoCursoRepository.findByEstudianteIdAndCursoId(estudiante, curso)
                        .map(p -> p.getEstado() == EstadoProgreso.completado)
                        .orElse(false);
            if (!completado) {
                throw new BadRequestException(
                        "Aun no has completado el curso; el certificado se desbloquea al terminar.");
            }

            // Idempotencia: un curso solo da un certificado por estudiante.
            CertificadoCurso existente = certificadoCursoRepository
                    .findDeCursoYTitular(curso.getId(), estudianteId)
                    .orElse(null);
            if (existente != null) {
                return aResponse(existente.getCertificadoId());
            }

            String claveIdempotencia = "cert:" + estudianteId + ":" + curso.getId();
            if (emisionRepository.findByClaveIdempotencia(claveIdempotencia).isPresent()) {
                throw new BadRequestException(
                        "La emision de este certificado ya esta en proceso. Consulta /certificados/yo.");
            }

            String codigo = "INK-" + UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase();
            Instant ahora = Instant.now();

            Certificado certificado = new Certificado();
            certificado.setCodigo(codigo);
            certificado.setEstado("emitido");
            certificado.setEmitidoEn(ahora);
            certificado.setPlantilla("institucional-v1");
            certificado.setVerificado(Boolean.TRUE);
            certificado.setVecesVerificado(0);
            certificado.setEmitidoPor(estudiante);
            certificado.setHashSha256(sha256Hex(
                    codigo + "|" + estudianteId + "|" + curso.getId() + "|" + ahora.toEpochMilli()));
            certificado = certificadoRepository.save(certificado);

            CertificadoCurso certificadoCurso = new CertificadoCurso();
            certificadoCurso.setCertificadoId(certificado);
            certificadoCurso.setCursoId(curso);
            certificadoCurso.setTituloSnapshot(curso.getTitulo());
            certificadoCurso.setHoras(curso.getDuracionMinutos() != null
                    ? Math.max(1, curso.getDuracionMinutos() / 60) : 1);
            certificadoCurso.setPorcentajeProgreso(BigDecimal.valueOf(100));
            certificadoCursoRepository.save(certificadoCurso);

            CertificadoTitular titular = new CertificadoTitular();
            titular.setCertificadoId(certificado);
            titular.setUsuarioId(estudiante);
            titular.setNombreCompleto((estudiante.getNombre() != null ? estudiante.getNombre() : "")
                    + " " + (estudiante.getApellido() != null ? estudiante.getApellido() : ""));
            titular.setDocumento(null);
            titular.setPorcentajeProgreso(BigDecimal.valueOf(100));
            titular.setNotaFinal(null);
            titular.setEsPrincipal(Boolean.TRUE);
            titularRepository.save(titular);

            CertificadoEmision emision = new CertificadoEmision();
            emision.setCertificadoId(certificado);
            emision.setUsuarioId(estudiante);
            emision.setTipo("curso_completado");
            emision.setClaveIdempotencia(claveIdempotencia);
            emision.setActorId(estudiante);
            emision.setDatos(Map.of(
                    "curso_slug", curso.getSlug(),
                    "curso_titulo", curso.getTitulo()));
            emisionRepository.save(emision);

            return aResponse(certificado);
        });
    }

    /** Lista mis certificados (como titular principal). */
    @Transactional
    public List<CertificadoResponse> misCertificados(UUID estudianteId) {
        return rlsExecutor.executeAs(estudianteId, () ->
                titularRepository.findDeUsuario(estudianteId).stream()
                        .map(t -> aResponse(t.getCertificadoId()))
                        .toList());
    }

    /** Verificacion publica mínima (no requiere autenticacion). */
    @Transactional
    public CertificadoResponse verificar(String codigo) {
        Certificado certificado = certificadoRepository.findByCodigo(codigo == null ? "" : codigo.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Certificado no valido."));
        // Contador publico de verificaciones (dato agregado, no sensible).
        certificado.setVecesVerificado((certificado.getVecesVerificado() != null
                ? certificado.getVecesVerificado() : 0) + 1);
        certificadoRepository.save(certificado);
        return aResponse(certificado);
    }

    // ---------- interno ----------

    private CertificadoResponse aResponse(Certificado certificado) {
        return CertificadoResponse.from(certificado,
                titularRepository.findDeCertificado(certificado.getId()),
                certificadoCursoRepository.findDeCertificado(certificado.getId()));
    }

    private String sha256Hex(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(bytes.length * 2);
            for (byte b : bytes) {
                sb.append(Character.forDigit((b >> 4) & 0xF, 16)).append(Character.forDigit(b & 0xF, 16));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 no disponible en esta JVM.", e);
        }
    }
}
