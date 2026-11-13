// @ts-nocheck
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { CourseService } from '../../../core/services/course.service';
import { EnrollmentService } from '../../../core/services/enrollment.service';
import { GamificationService } from '../../../core/services/gamification.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ProgressService } from '../../../core/services/progress.service';
import { Curso, Matricula, ProgresoCurso } from '../../../core/models/domain.models';
import { CourseCardComponent } from '../../../shared/components/course-card/course-card.component';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

/**
 * Panel principal del estudiante.
 */
@Component({
  selector: 'app-student-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    CourseCardComponent,
    DataPanelComponent,
    PageHeaderComponent,
    StatCardComponent,
    StatusBadgeComponent,
  ],
  template: `
    <section class="space-y-10">
      <app-page-header
        titulo="Mi panel"
        [descripcion]="'Hola, ' + nombre() + '. Aquí tienes un resumen de tu aprendizaje y progreso.'"
        [acciones]="true"
      >
        <div acciones>
          <a routerLink="/cursos" class="btn btn-primary btn-sm">Explorar catálogo</a>
        </div>
      </app-page-header>

      <div class="grid gap-6 pt-1 sm:grid-cols-2 xl:grid-cols-4 lg:gap-8">
        <app-stat-card etiqueta="Cursos matriculados" [valor]="matriculas().length" detalle="Matrículas registradas" [icono]="true" tono="brand">
          <span icono><svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/></svg></span>
        </app-stat-card>
        <app-stat-card etiqueta="XP total" [valor]="xp()" detalle="Experiencia acumulada" [icono]="true" tono="gold">
          <span icono><svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3l2.5 5 5.5.8-4 3.9.9 5.5L12 15.8 7.1 18.2 8 12.7 4 8.8l5.5-.8z"/></svg></span>
        </app-stat-card>
        <app-stat-card etiqueta="Racha" [valor]="racha()" detalle="Días consecutivos" [icono]="true" tono="danger">
          <span icono><svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3s4 3 4 7-2 5-2 5 3 1 3 4a5 5 0 0 1-10 0c0-4 5-6 5-10 0-3 0-6 0-6z"/></svg></span>
        </app-stat-card>
        <app-stat-card etiqueta="Notificaciones" [valor]="noLeidas()" detalle="Sin leer" [icono]="true" tono="info">
          <span icono><svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M18 8a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7"/><path d="M10.3 20a2 2 0 0 0 3.4 0"/></svg></span>
        </app-stat-card>
      </div>

      <app-data-panel
        [cargando]="cargando()"
        [error]="error()"
        [vacio]="false"
        (alReintentar)="cargar()"
      >
        <div contenido class="space-y-10">
          <section class="rounded-2xl border border-surface-200/70 bg-white/40 p-5 sm:p-6">
            <div class="mb-5 flex flex-wrap items-center justify-between gap-4">
              <h2 class="text-xl font-semibold text-marine-800">Mis cursos</h2>
              <div class="flex items-center gap-3">
                <a routerLink="/cursos" class="link text-sm">Explorar catálogo</a>
                <a routerLink="/estudiante/cursos" class="link text-sm">Ver todos</a>
              </div>
            </div>
            @if (cursos().length === 0) {
              <div class="card card-body text-sm text-marine-500">
                Aún no tienes cursos matriculados. <a routerLink="/cursos" class="link">Explora el catálogo</a> para comenzar.
              </div>
            } @else {
              <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                @for (curso of cursos().slice(0, 3); track curso.id) {
                  <app-course-card
                    [curso]="curso"
                    contexto="aulas"
                    [estado]="estadoMatriculaDe(curso.id)"
                    [progreso]="progresoDe(curso.id)"
                  />
                }
              </div>
            }
          </section>

          <section class="grid gap-8 lg:grid-cols-2">
            <div class="card card-body">
              <h2 class="text-lg font-semibold text-marine-800">Progreso reciente</h2>
              @if (progresos().length === 0) {
                <p class="mt-3 text-sm text-marine-500">Cuando avances en tus lecciones, tu progreso aparecerá aquí.</p>
              } @else {
                <ul class="mt-4 space-y-3">
                  @for (p of progresos().slice(0, 5); track p.id) {
                    <li class="rounded-button border border-surface-200 p-3">
                      <div class="flex items-center justify-between gap-3">
                        <a [routerLink]="['/estudiante/aula', p.curso_id]" class="text-sm font-medium text-marine-700 hover:text-brand-600">{{ tituloCurso(p.curso_id) }}</a>
                        <app-status-badge [estado]="p.estado" />
                      </div>
                      <div class="mt-2 h-2 overflow-hidden rounded-full bg-surface-100">
                        <div class="h-full rounded-full bg-brand-500" [style.width.%]="p.porcentaje"></div>
                      </div>
                      <p class="mt-1 text-xs text-marine-500">{{ p.porcentaje }}% completado · {{ p.lecciones_completadas }} lecciones</p>
                    </li>
                  }
                </ul>
              }
            </div>

            <div class="card card-body">
              <h2 class="text-lg font-semibold text-marine-800">Matrículas</h2>
              @if (matriculas().length === 0) {
                <p class="mt-3 text-sm text-marine-500">No hay matrículas registradas.</p>
              } @else {
                <ul class="mt-4 space-y-2 text-sm">
                  @for (m of matriculas().slice(0, 6); track m.id) {
                    <li class="flex items-center justify-between gap-3 rounded-button bg-surface-50 px-3 py-2">
                      <span class="truncate text-marine-700">{{ tituloCurso(m.curso_id) }}</span>
                      <div class="flex items-center gap-2">
                        <app-status-badge [estado]="m.estado" />
                        @if (m.estado === 'pendiente_pago') {
                          <a routerLink="/estudiante/pagos" class="text-xs font-semibold text-brand-700 hover:underline">Pagar</a>
                        }
                      </div>
                    </li>
                  }
                </ul>
              }
              <a routerLink="/estudiante/cursos" class="btn btn-outline btn-sm mt-4 w-fit">Ir a mis cursos</a>
            </div>
          </section>
        </div>
      </app-data-panel>
    </section>
  `,
})
export class DashboardComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly courseService = inject(CourseService);
  private readonly enrollmentService = inject(EnrollmentService);
  private readonly gamificationService = inject(GamificationService);
  private readonly notificationService = inject(NotificationService);
  private readonly progressService = inject(ProgressService);

  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly cursos = signal<Curso[]>([]);
  protected readonly matriculas = signal<Matricula[]>([]);
  protected readonly progresos = signal<ProgresoCurso[]>([]);
  protected readonly cursosPorId = signal<Record<string, Curso>>({});
  protected readonly racha = signal(0);
  protected readonly noLeidas = signal(0);

  protected readonly nombre = computed(() => {
    const p = this.auth.perfil();
    return p?.nombre || p?.email || 'estudiante';
  });
  protected readonly xp = computed(() => this.auth.perfil()?.xp ?? 0);

  /** Estado de matrícula indexado por curso (para decidir el enlace y el badge de cada tarjeta). */
  private readonly matriculasPorCurso = computed(() => {
    const mapa: Record<string, Matricula> = {};
    for (const m of this.matriculas()) mapa[m.curso_id] = m;
    return mapa;
  });

  /** Avance de curso indexado por curso. */
  private readonly progresosPorCurso = computed(() => {
    const mapa: Record<string, number> = {};
    for (const p of this.progresos()) mapa[p.curso_id] = p.porcentaje;
    return mapa;
  });

  /** Estado de matrícula del curso (null si no hay matrícula conocida). */
  protected estadoMatriculaDe(cursoId: string): string | null {
    return this.matriculasPorCurso()[cursoId]?.estado ?? null;
  }

  /** Avance porcentual del curso o null si aún no hay progreso. */
  protected progresoDe(cursoId: string): number | null {
    return this.progresosPorCurso()[cursoId] ?? null;
  }

  protected tituloCurso(cursoId: string): string {
    return this.cursosPorId()[cursoId]?.titulo ?? `Curso ${cursoId.slice(0, 8)}…`;
  }

  ngOnInit(): void {
    void this.cargar();
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
      const [cursos, matriculas, progresos, racha, noLeidas] = await Promise.all([
        this.courseService.listarCursosDeEstudiante(user.id),
        this.enrollmentService.listarMisMatriculas(),
        this.progressService.listarMiProgreso(user.id),
        this.gamificationService.obtenerRacha(user.id),
        this.notificationService.contarNoLeidas(user.id),
      ]);
      const mapa: Record<string, Curso> = {};
      for (const c of cursos) mapa[c.id] = c;
      const faltantes = Array.from(new Set(matriculas.map((m) => m.curso_id))).filter((id) => !mapa[id]);
      if (faltantes.length > 0) {
        const extras = await Promise.all(faltantes.map((id) => this.courseService.obtenerPorId(id).catch(() => null)));
        for (const c of extras) {
          if (c) mapa[c.id] = c;
        }
      }
      this.cursos.set(cursos);
      this.cursosPorId.set(mapa);
      this.matriculas.set(matriculas);
      this.progresos.set(progresos);
      this.racha.set(racha?.racha_actual ?? 0);
      this.noLeidas.set(noLeidas);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudo cargar el panel.');
    } finally {
      this.cargando.set(false);
    }
  }
}
