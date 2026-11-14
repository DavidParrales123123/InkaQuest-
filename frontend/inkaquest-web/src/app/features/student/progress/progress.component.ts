// @ts-nocheck
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { CourseService } from '../../../core/services/course.service';
import { ProgressService } from '../../../core/services/progress.service';
import { Curso, ProgresoCurso } from '../../../core/models/domain.models';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';

interface ProgresoConCurso extends ProgresoCurso {
  readonly curso?: Curso;
}

@Component({
  selector: 'app-student-progress',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DataPanelComponent, PageHeaderComponent, StatCardComponent],
  template: `
    <section class="space-y-8">
      <app-page-header
        titulo="Mi progreso"
        descripcion="Tu avance académico por curso: lecciones completadas, minutos de estudio y porcentaje de progreso."
        [acciones]="true"
      >
        <div acciones><a routerLink="/estudiante/cursos" class="btn btn-outline btn-sm">Ver mis cursos</a></div>
      </app-page-header>

      <div class="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <app-stat-card etiqueta="Cursos con progreso" [valor]="items().length" />
        <app-stat-card etiqueta="Completados" [valor]="completados()" tono="gold" />
        <app-stat-card etiqueta="Promedio de avance" [valor]="promedio() + '%'" tono="brand" />
        <app-stat-card etiqueta="Lecciones completadas" [valor]="lecciones()" tono="surface" />
      </div>

      <app-data-panel
        [cargando]="cargando()"
        [error]="error()"
        [vacio]="items().length === 0"
        tituloVacio="No estás inscrito en ningún curso"
        descripcionVacia="Matrícula en un curso y pulsa Continuar en el aula: aquí aparecerá tu hoja de progreso con su avance en vivo."
        (alReintentar)="cargar()"
      >
        <div contenido class="grid gap-6 lg:grid-cols-2">
          @for (p of items(); track p.id) {
            <article class="card card-body">
              <div class="flex items-start justify-between gap-5">
                <div>
                  <p class="text-xs font-semibold uppercase tracking-wide text-brand-700">Curso</p>
                  <h3 class="mt-1 text-lg font-bold text-marine-900">
                    {{ p.curso?.titulo ?? 'Curso' }}
                  </h3>
                  <p class="mt-1 text-sm text-marine-600">
                    Estado: <span class="font-medium">{{ etiquetaEstado(p.estado) }}</span>
                  </p>
                </div>
                <span class="badge badge-info">{{ p.porcentaje || 0 }}%</span>
              </div>

              <div class="mt-5">
                <div class="progress h-2.5" aria-label="Progreso del curso">
                  <div class="progress-bar" [style.width.%]="p.porcentaje || 0"></div>
                </div>
                <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-marine-600">
                  <span>Lecciones: {{ p.lecciones_completadas || 0 }}</span>
                  <span>Minutos: {{ p.minutos_estudio || 0 }}</span>
                  @if (p.ultima_actividad_en) {
                    <span>Última actividad: {{ formatearFecha(p.ultima_actividad_en) }}</span>
                  }
                </div>
              </div>

              <div class="mt-5">
                <a [routerLink]="['/estudiante/aula', p.curso_id]" class="btn btn-outline btn-sm">
                  Continuar en el aula
                </a>
              </div>
            </article>
          }
        </div>
      </app-data-panel>
    </section>
  `,
})
export class ProgressComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly progress = inject(ProgressService);
  private readonly courses = inject(CourseService);

  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly items = signal<ProgresoConCurso[]>([]);

  protected readonly completados = signal(0);
  protected readonly promedio = signal(0);
  protected readonly lecciones = signal(0);

  ngOnInit(): void {
    void this.cargar();
  }

  protected async cargar(): Promise<void> {
    const usuario = this.auth.usuario();
    if (!usuario) {
      this.error.set('No se pudo identificar tu sesión.');
      this.cargando.set(false);
      return;
    }
    this.cargando.set(true);
    this.error.set(null);
    try {
      // Senior-fix: las filas en progreso_curso NO se crean al matricularse —
      // se crean solo tras completar la primera lección. Por tanto, un
      // estudiante con matrícula activa y cero avances veía una página vacía
      // sin indicio de lo que tiene que hacer. Ahora combinamos ambas listas:
      // matrícula (siempre presente en el estudiante matriculado) + progreso.
      const [matriculados, progresos] = await Promise.all([
        this.courses.listarCursosDeEstudiante(usuario.id).catch(() => [] as Curso[]),
        this.progress.listarMiProgreso().catch(() => [] as import('../../../core/services/progress.service').ProgresoCursoResponse[]),
      ]);
      const porCurso = new Map(progresos.map((p) => [p.curso_id ?? p.cursoId, p]));
      const enriquecidos: ProgresoConCurso[] = matriculados.map((c) => {
        const encontrado = porCurso.get(c.id);
        if (encontrado) {
          return { ...encontrado, curso: c, curso_id: c.id } as ProgresoConCurso;
        }
        return {
          id: `mat-${c.id}`,
          matricula_id: '',
          estudiante_id: usuario.id,
          estudianteId: usuario.id,
          curso: c,
          curso_id: c.id,
          cursoId: c.id,
          cursoTitulo: c.titulo,
          porcentaje: 0,
          porcentajeCompletado: 0,
          lecciones_completadas: 0,
          leccionesCompletadas: 0,
          leccionesTotales: 0,
          minutos_estudio: 0,
          minutosEstudio: 0,
          estado: 'no_iniciado',
          xpGanado: 0,
          ultima_actividad_en: null,
          ultimaActividadEn: null,
          creado_en: null,
          creadoEn: null,
          actualizado_en: null,
          actualizadoEn: null,
        } as unknown as ProgresoConCurso;
      });
      this.items.set(enriquecidos);
      this.completados.set(enriquecidos.filter((p) => p.estado === 'completado' || (p.porcentaje || 0) >= 100).length);
      const avg = enriquecidos.length
        ? Math.round(enriquecidos.reduce((a, p) => a + (Number(p.porcentaje) || 0), 0) / enriquecidos.length)
        : 0;
      this.promedio.set(avg);
      this.lecciones.set(enriquecidos.reduce((a, p) => a + (Number(p.lecciones_completadas ?? p.leccionesCompletadas) || 0), 0));
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudo cargar tu progreso.');
    } finally {
      this.cargando.set(false);
    }
  }

  protected etiquetaEstado(estado: string): string {
    const map: Record<string, string> = {
      no_iniciado: 'No iniciado',
      en_progreso: 'En progreso',
      completado: 'Completado',
    };
    return map[estado] ?? estado;
  }

  protected formatearFecha(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return iso;
    }
  }
}
