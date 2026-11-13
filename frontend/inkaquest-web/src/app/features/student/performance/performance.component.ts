// @ts-nocheck
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { CourseService } from '../../../core/services/course.service';
import { GamificationService } from '../../../core/services/gamification.service';
import { ProgressService } from '../../../core/services/progress.service';
import { Curso, ProgresoCurso } from '../../../core/models/domain.models';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';

@Component({
  selector: 'app-student-performance',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DataPanelComponent, PageHeaderComponent, StatCardComponent],
  template: `
    <section class="space-y-6">
      <app-page-header titulo="Rendimiento y progreso" descripcion="Resumen de tu avance académico y actividad, basado en datos reales de cursos, progreso y gamificación." [acciones]="true">
        <div acciones><a routerLink="/estudiante/progreso" class="btn btn-outline btn-sm">Ver detalle por curso</a></div>
      </app-page-header>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <app-stat-card etiqueta="Cursos" [valor]="cursos()" [icono]="true" tono="brand"><span icono><svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg></span></app-stat-card>
        <app-stat-card etiqueta="Promedio avance" [valor]="promedio() + '%'" [icono]="true" tono="info"><span icono><svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-6 6"/></svg></span></app-stat-card>
        <app-stat-card etiqueta="XP" [valor]="xp()" [icono]="true" tono="gold"><span icono><svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></span></app-stat-card>
        <app-stat-card etiqueta="Racha (días)" [valor]="racha()" [icono]="true" tono="brand"><span icono><svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg></span></app-stat-card>
      </div>
      <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="barras().length === 0" tituloVacio="Sin datos de progreso" descripcionVacia="Aún no hay progreso registrado en tus cursos." (alReintentar)="cargar()">
        <div contenido class="space-y-4">
          <h2 class="text-lg font-semibold text-marine-800">Avance por curso</h2>
          @for (b of barras(); track b.id) {
            <div class="space-y-1">
              <div class="flex items-center justify-between text-sm"><span class="font-medium text-marine-800">{{ b.titulo }}</span><span class="text-marine-600">{{ b.porcentaje }}% · {{ b.estado }}</span></div>
              <div class="h-3 overflow-hidden rounded-full bg-surface-100"><div class="h-full rounded-full bg-brand-500" [style.width.%]="b.porcentaje"></div></div>
            </div>
          }
          <p class="text-xs text-marine-500">Los indicadores reflejan información registrada (progreso, XP/racha). Gráficos analíticos avanzados pueden requerir agregaciones adicionales del backend.</p>
        </div>
      </app-data-panel>
    </section>
  `,
})
export class PerformanceComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly progressService = inject(ProgressService);
  private readonly courseService = inject(CourseService);
  private readonly gamificationService = inject(GamificationService);

  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly cursos = signal(0);
  protected readonly promedio = signal(0);
  protected readonly xp = signal(0);
  protected readonly racha = signal(0);
  protected readonly barras = signal<{ id: string; titulo: string; porcentaje: number; estado: string }[]>([]);

  ngOnInit(): void { void this.cargar(); }

  protected async cargar(): Promise<void> {
    const user = this.auth.usuario();
    if (!user) { this.error.set('Debes iniciar sesión.'); this.cargando.set(false); return; }
    this.cargando.set(true); this.error.set(null);
    try {
      const [progresos, cursos, racha] = await Promise.all([
        this.progressService.listarMiProgreso(user.id).catch(() => [] as ProgresoCurso[]),
        this.courseService.listarCursosDeEstudiante(user.id).catch(() => [] as Curso[]),
        this.gamificationService.obtenerRacha(user.id).catch(() => null),
      ]);
      const byId = new Map(cursos.map((c: Curso) => [c.id, c.titulo]));
      const barras = progresos.map((p: ProgresoCurso) => ({ id: p.curso_id, titulo: byId.get(p.curso_id) ?? p.curso_id.slice(0, 8) + '…', porcentaje: Math.round(p.porcentaje ?? 0), estado: p.estado }));
      const promedio = barras.length ? Math.round(barras.reduce((s: number, b: { porcentaje: number }) => s + b.porcentaje, 0) / barras.length) : 0;
      this.barras.set(barras);
      this.cursos.set(cursos.length);
      this.promedio.set(promedio);
      this.xp.set(this.auth.perfil()?.xp ?? user.user_metadata?.['xp'] ?? 0);
      this.racha.set((racha as any)?.racha_actual ?? 0);
    } catch (e) { this.error.set(e instanceof Error ? e.message : 'No se pudo cargar el rendimiento.'); }
    finally { this.cargando.set(false); }
  }
}
