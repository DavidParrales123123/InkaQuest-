package com.inkaquest.modules.matriculas.repository;

import com.inkaquest.modules.academico.entity.Curso;
import com.inkaquest.modules.identidad.entity.Perfil;
import com.inkaquest.modules.matriculas.entity.Matricula;
import com.inkaquest.shared.enums.EstadoMatricula;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositorio JPA de la entidad {@link Matricula} (tabla {@code public.matricula}).
 */
@Repository
public interface MatriculaRepository extends JpaRepository<Matricula, UUID> {

    /** Encuentra una matrícula por estudiante y curso (o vacío si no existe). */
    Optional<Matricula> findByEstudianteIdAndCursoId(Perfil estudianteId, Curso cursoId);

    /** Lista todas las matrículas activas y completadas de un estudiante. */
    @Query("select m from Matricula m where m.estudianteId.id = :estudianteId and m.estado in (:estados)")
    List<Matricula> findActivasDeEstudiante(UUID estudianteId, java.util.Collection<EstadoMatricula> estados);

    /** Lista las matrículas activas de un curso (necesariamente un docente o admin para usar esta). */
    @Query("select m from Matricula m where m.cursoId.id = :cursoId and m.estado in (:estados)")
    List<Matricula> findActivasDelCurso(UUID cursoId, java.util.Collection<EstadoMatricula> estados);

    /** Matrículas de un estudiante — todas las que tenga, orden cronológico desc. */
    @Query("select m from Matricula m where m.estudianteId.id = :estudianteId order by m.creadoEn desc")
    List<Matricula> findAllDeEstudiante(UUID estudianteId);

    /** Matrículas visibles como alumno dentro de un curso (usada para avisos). */
    @Query("select m from Matricula m where m.cursoId.id = :cursoId and m.estado in (:estados) order by m.matriculadoEn desc nulls last")
    List<Matricula> findMatriculadosCurso(UUID cursoId, java.util.Collection<EstadoMatricula> estados);

    /** Cantidad de matriculas por estado. */
    long countByEstado(EstadoMatricula estado);

    /** Progreso promedio (%) en un curso (solo estados dados). */
    @Query("select coalesce(avg(m.porcentajeProgreso), 0) from Matricula m where m.cursoId.id = :cursoId and m.estado in :estados")
    java.math.BigDecimal progresoPromedio(@org.springframework.data.repository.query.Param("cursoId") UUID cursoId,
                                          @org.springframework.data.repository.query.Param("estados") java.util.Collection<EstadoMatricula> estados);
    
    /** Verifica si existe una matrícula con estado específico. */
    boolean existsByEstudianteIdIdAndCursoIdIdAndEstado(UUID estudianteId, UUID cursoId, EstadoMatricula estado);
}
