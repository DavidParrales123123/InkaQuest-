// @ts-nocheck
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { CourseService } from '../../../core/services/course.service';
import { EvaluationService } from '../../../core/services/evaluation.service';
import { Actividad, Curso, Evaluacion, IntentoEvaluacion } from '../../../core/models/domain.models';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

type EstadoEvaluacion = 'pendiente' | 'rendida';

/** Fila de evaluación enriquecida por el panel del estudiante. */
type FilaEvaluacion = Evaluacion & {
  actividad: Actividad;
  intentosHechos: number;
  intentosPermitidos: number;
  estadoCard: EstadoEvaluacion;
  ultimo?: IntentoEvaluacion;
  resultadoTexto: string;
  puntosMax: number;
};

@Component({
  selector: 'app-student-evaluaciones',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DataPanelComponent, PageHeaderComponent],
  template: `
    <section class="space-y-6">
      <app-page-header titulo="Evaluaciones" descripcion="Quizzes y exámenes de tus cursos. Las que rendiste quedan como realizado; las que no, veras aquí." />
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
                      <div class="flex flex-wrap items-start justify-between gap-2">
                        <div class="min-w-0">
                          <p class="font-medium text-marine-800">{{ e.actividad.titulo }}</p>
                          <p class="mt-1 text-xs text-marine-500">Tipo: {{ e.actividad.tipo }} · Puntos máx: {{ e.puntosMax ?? e.nota_maxima }}</p>
                          <p class="mt-0.5 text-xs text-marine-400">{{ e.intentosHechos }} de {{ e.intentosPermitidos }} intento(s) usado(s)</p>
                          @if (e.estadoCard === 'rendida' && e.ultimo) {
                            <p class="mt-1.5 text-xs font-semibold text-success-700">
                              Realizado — Resultado: {{ e.resultadoTexto }}
                            </p>
                          }
                        </div>
                        @if (e.estadoCard === 'rendida') {
                          <span class="badge badge-gold">Realizado</span>
                        } @else {
                          <a [routerLink]="['/estudiante/evaluaciones', e.id]" class="btn btn-primary btn-sm">▶ Rendir evaluación</a>
                        }
                      </div>
                    </li>
                  }
                </ul>
              }
            </div>
          }
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
  protected readonly items = signal<{ curso: Curso; evaluaciones: FilaEvaluacion[] }[]>([]);

  ngOnInit(): void { void this.cargar(); }

  protected async cargar(): Promise<void> {
    const user = this.auth.usuario();
    if (!user) { this.error.set('Debes iniciar sesión.'); this.cargando.set(false); return; }
    this.cargando.set(true); this.error.set(null);
    try {
      const cursos = await this.courseService.listarCursosDeEstudiante(user.id);
      const items = [] as { curso: Curso; evaluaciones: FilaEvaluacion[] }[];
      for (const curso of cursos) {
        const evals = await this.evaluationService.listarEvaluacionesCurso(curso.id).catch(() => []);
        const rows = await Promise.all(
          evals.map(async (e) => {
            const [intentos, preguntas] = await Promise.all([
              this.evaluationService.listarIntentos(e.id, user.id).catch(() => [] as IntentoEvaluacion[]),
              this.evaluationService.listarPreguntasConOpciones(e.id).catch(() => [] as any[]),
            ]);
            const intentosHechos = intentos.length;
            const intentosPermitidos = Math.max(1, e.intentos_permitidos ?? 1);
            const entregados = intentos.filter((i) => i.estado === 'entregado' || i.estado === 'expirado');
            const ultimo = entregados[0] ?? intentos[0];
            const puntosMax = preguntas.reduce((acc: number, p: any) => acc + Number(p?.puntos ?? 0), 0);
            const resultadoTexto = ultimo?.puntaje != null
              ? `${ultimo.puntaje}/${ultimo.puntaje_maximo ?? puntosMax ?? e.nota_maxima} pts`
              : 'Sin puntaje registrado aún.';
            const estadoCard: EstadoEvaluacion = intentosHechos >= intentosPermitidos ? 'rendida' : 'pendiente';
            return { ...e, intentosHechos, intentosPermitidos, estadoCard, ultimo, resultadoTexto, puntosMax };
          }),
        );
        items.push({ curso, evaluaciones: rows });
      }
      this.items.set(items);
    } catch (e) { this.error.set(e instanceof Error ? e.message : 'No se pudieron cargar las evaluaciones.'); }
    finally { this.cargando.set(false); }
  }
}
