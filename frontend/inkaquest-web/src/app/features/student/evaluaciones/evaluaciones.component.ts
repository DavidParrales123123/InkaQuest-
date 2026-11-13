// @ts-nocheck
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { CourseService } from '../../../core/services/course.service';
import { EvaluationService } from '../../../core/services/evaluation.service';
import { Actividad, Curso, Evaluacion, IntentoEvaluacion } from '../../../core/models/domain.models';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-student-evaluaciones',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DataPanelComponent, PageHeaderComponent],
  template: `
    <section class="space-y-6">
      <app-page-header titulo="Evaluaciones" descripcion="Quizzes y exámenes de tus cursos, con tus intentos registrados." />
      <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="items().length === 0" tituloVacio="Sin evaluaciones" descripcionVacia="No hay evaluaciones publicadas en tus cursos." (alReintentar)="cargar()">
        <div contenido class="space-y-4">
          @for (item of items(); track item.curso.id) {
            <div class="card card-body">
              <h2 class="text-lg font-semibold text-marine-800">{{ item.curso.titulo }}</h2>
              @if (item.evaluaciones.length === 0) {
                <p class="mt-2 text-sm text-marine-500">No hay evaluaciones publicadas.</p>
              } @else {
                <ul class="mt-3 space-y-2">
                  @for (e of item.evaluaciones; track e.id) {
                    <li class="rounded-button border border-surface-200 p-3 text-sm">
                      <div class="flex flex-wrap items-center justify-between gap-2">
                        <p class="font-medium text-marine-800">{{ e.actividad.titulo }}</p>
                        <span class="badge badge-neutral">Intentos: {{ e.intentosInfo }}</span>
                      </div>
                      <p class="text-marine-500">Tipo: {{ e.actividad.tipo }} · Nota máx: {{ e.nota_maxima }} · Tu % mínimo para aprobar: {{ e.porcentaje_aprobacion }}%</p>
                      <div class="mt-2 flex items-center justify-end gap-2">
                        <a [routerLink]="['/estudiante/evaluaciones', e.id]" class="btn btn-primary btn-sm">▶ Rendir evaluación</a>
                      </div>
                    </li>
                  }
                </ul>
              }
            </div>
          }
          <p class="text-xs text-marine-400">Haz clic en «Rendir evaluación» para abrir la evaluación en pantalla completa. Tus intentos, respuestas y resultados quedan registrados en el servidor.</p>
        </div>
      </app-data-panel>
    </section>
  `,
})
export class EvaluationsComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly courseService = inject(CourseService);
  private readonly evaluationService = inject(EvaluationService);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly items = signal<{ curso: Curso; evaluaciones: (Evaluacion & { actividad: Actividad; intentosInfo: string })[] }[]>([]);

  ngOnInit(): void { void this.cargar(); }

  protected async cargar(): Promise<void> {
    const user = this.auth.usuario();
    if (!user) { this.error.set('Debes iniciar sesión.'); this.cargando.set(false); return; }
    this.cargando.set(true); this.error.set(null);
    try {
      const cursos = await this.courseService.listarCursosDeEstudiante(user.id);
      const items = [] as { curso: Curso; evaluaciones: (Evaluacion & { actividad: Actividad; intentosInfo: string })[] }[];
      for (const curso of cursos) {
        const evals = await this.evaluationService.listarEvaluacionesCurso(curso.id).catch(() => []);
        const enriched = await Promise.all(evals.map(async (e) => {
          const intentos = await this.evaluationService.listarIntentos(e.id, user.id).catch(() => [] as IntentoEvaluacion[]);
          return { ...e, intentosInfo: `${intentos.length} registrado(s)` };
        }));
        items.push({ curso, evaluaciones: enriched });
      }
      this.items.set(items);
    } catch (e) { this.error.set(e instanceof Error ? e.message : 'No se pudieron cargar las evaluaciones.'); }
    finally { this.cargando.set(false); }
  }
}
