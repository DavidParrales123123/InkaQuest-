import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { CourseService } from '../../../core/services/course.service';
import { EnrollmentService } from '../../../core/services/enrollment.service';
import { ProgressService } from '../../../core/services/progress.service';
import { Curso, Matricula, ProgresoCurso } from '../../../core/models/domain.models';

import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { imagenDeCurso } from '../../../shared/utilities/curso-imagen.util';

/**
 * Listado de cursos del estudiante.
 */
@Component({
  selector: 'app-my-courses',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DataPanelComponent, PageHeaderComponent, StatusBadgeComponent],
  template: `
    <section class="space-y-8">
      <app-page-header titulo="Mis cursos" descripcion="Cursos en los que estás matriculado, tu estado de acceso y tu avance." [acciones]="true">
        <div acciones>
          <a routerLink="/cursos" class="btn btn-primary btn-sm">Explorar catálogo</a>
        </div>
      </app-page-header>

      <app-data-panel
        [cargando]="cargando()"
        [error]="error()"
        [vacio]="items().length === 0"
        tituloVacio="Aún no tienes cursos"
        descripcionVacia="Explora el catálogo y matricúlate para empezar a aprender."
        (alReintentar)="cargar()"
      >
        <div contenido class="space-y-4">
          @for (item of items(); track item.matricula.id) {
            <article class="card overflow-hidden">
              <div class="grid gap-4 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                <div class="flex min-w-0 gap-4">
                  @if (item.curso) {
                    <img [src]="imagen(item.curso.slug)" [alt]="item.curso.titulo" class="hidden h-24 w-40 shrink-0 rounded-lg object-cover sm:block" loading="lazy" />
                  }
                  <div class="min-w-0">
                    <div class="flex flex-wrap items-center gap-2">
                      <h2 class="text-lg font-semibold text-marine-800">
                        @if (item.curso) {
                          <a [routerLink]="['/estudiante/aula', item.curso.id]" class="hover:text-brand-600">{{ item.curso.titulo }}</a>
                        } @else {
                          Curso {{ item.matricula.curso_id.slice(0, 8) }}…
                        }
                      </h2>
                      <app-status-badge [estado]="item.matricula.estado" />
                    </div>
                    @if (item.curso?.descripcion) {
                      <p class="mt-1 line-clamp-2 text-sm text-marine-500">{{ item.curso!.descripcion }}</p>
                    }
                    @if (item.matricula.estado === 'pendiente_pago') {
                      <p class="mt-2 text-sm text-gold-700">Matrícula pendiente de pago/activación. Completa el proceso para acceder al contenido y registrar progreso.</p>
                    } @else if (item.progreso) {
                      <div class="mt-3 max-w-md">
                        <div class="h-2 overflow-hidden rounded-full bg-surface-100">
                          <div class="h-full rounded-full bg-brand-500" [style.width.%]="item.progreso.porcentaje"></div>
                        </div>
                        <p class="mt-1 text-xs text-marine-500">{{ item.progreso.porcentaje }}% · {{ item.progreso.lecciones_completadas }} lecciones · <app-status-badge [estado]="item.progreso.estado" /></p>
                      </div>
                    } @else if (item.matricula.estado === 'activa') {
                      <p class="mt-2 text-xs text-marine-400">Aún no hay progreso registrado. Ingresa al aula para ver el plan por semanas/unidades, contenidos y materiales del docente.</p>
                    }
                  </div>
                </div>
                <div class="flex flex-wrap gap-2 sm:justify-end">
                  @if (item.curso) {
                    @if (item.matricula.estado === 'pendiente_pago') {
                      <a routerLink="/estudiante/pagos" class="btn btn-primary btn-sm">Ver pagos</a>
                    } @else {
                      <a [routerLink]="['/estudiante/aula', item.curso.id]" class="btn btn-primary btn-sm">Ir al aula</a>
                    }
                    <a [routerLink]="['/cursos', item.curso.slug]" class="btn btn-outline btn-sm">Ver detalle</a>
                  }
                </div>
              </div>
            </article>
          }
        </div>
      </app-data-panel>
    </section>
  `,
})
export class MyCoursesComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly courseService = inject(CourseService);
  private readonly enrollmentService = inject(EnrollmentService);
  private readonly progressService = inject(ProgressService);

  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly items = signal<{ matricula: Matricula; curso: Curso | null; progreso: ProgresoCurso | null }[]>([]);

  ngOnInit(): void {
    void this.cargar();
  }

  protected imagen(slug: string | null | undefined): string {
    return imagenDeCurso(slug);
  }

  protected async cargar(): Promise<void> {
    const user = this.auth.usuario();
    if (!user) {
      this.error.set('Debes iniciar sesión.');
      this.cargando.set(false);
      return;
    }
    this.cargando.set(true);
    this.error.set(null);
    try {
      const [matriculas, progresos, cursos] = await Promise.all([
        this.enrollmentService.listarMisMatriculas(),
        this.progressService.listarMiProgreso(user.id),
        this.courseService.listarCursosDeEstudiante(user.id),
      ]);
      const cursoById = new Map(cursos.map((c) => [c.id, c]));
      const faltantes = Array.from(new Set(matriculas.map((m) => m.curso_id))).filter((id) => !cursoById.has(id));
      if (faltantes.length > 0) {
        const extras = await Promise.all(faltantes.map((id) => this.courseService.obtenerPorId(id).catch(() => null)));
        for (const c of extras) {
          if (c) cursoById.set(c.id, c);
        }
      }
      const progByCurso = new Map(progresos.map((p) => [p.curso_id, p]));
      this.items.set(
        matriculas.map((m) => ({
          matricula: m,
          curso: cursoById.get(m.curso_id) ?? null,
          progreso: progByCurso.get(m.curso_id) ?? null,
        })),
      );
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudieron cargar tus cursos.');
    } finally {
      this.cargando.set(false);
    }
  }
}
