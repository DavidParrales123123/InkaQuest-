// @ts-nocheck
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { CourseService } from '../../../core/services/course.service';
import { GamificationService } from '../../../core/services/gamification.service';
import { ProgressService } from '../../../core/services/progress.service';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';

@Component({
  selector: 'app-student-performance',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DataPanelComponent, PageHeaderComponent, StatCardComponent],
  template: `
    <section class="space-y-6">
      <app-page-header titulo="Rendimiento y progreso" descripcion="Resumen de tu avance académico y actividad, calculado con datos en vivo de tus cursos." [acciones]="true">
        <div acciones><a routerLink="/estudiante/progreso" class="btn btn-outline btn-sm">Ver detalle por curso</a></div>
      </app-page-header>

      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <app-stat-card etiqueta="Mis cursos" [valor]="cursos()" tono="brand" [icono]="true"><span icono><svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg></span></app-stat-card>
        <app-stat-card etiqueta="Promedio avance" [valor]="promedio() + '%'" tono="info" [icono]="true"><span icono><svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-6 6"/></svg></span></app-stat-card>
        <app-stat-card etiqueta="XP acumulada" [valor]="xp()" tono="gold" [icono]="true"><span icono><svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></span></app-stat-card>
        <app-stat-card etiqueta="Racha (días)" [valor]="racha()" tono="brand" [icono]="true"><span icono><svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg></span></app-stat-card>
      </div>

      <div class="grid gap-3 sm:grid-cols-3">
        <app-stat-card etiqueta="Lecciones completadas" [valor]="lecciones()" tono="surface" />
        <app-stat-card etiqueta="Cursos completados" [valor]="completados()" tono="gold" />
        <app-stat-card etiqueta="Minutos de estudio" [valor]="minutos()" tono="info" />
      </div>

      <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="barras().length === 0" tituloVacio="Aún no tienes cursos inscritos" descripcionVacia="Matrícula en un curso y empieza a aprender: aquí verás tu avance por curso." (alReintentar)="cargar()">
        <div contenido class="space-y-5">
          <h2 class="text-lg font-semibold text-marine-800">Avance por curso</h2>
          @for (b of barras(); track b.id) {
            <article class="rounded-2xl border border-surface-200 p-4">
              <div class="flex flex-wrap items-start justify-between gap-2">
                <h3 class="font-semibold text-marine-800">{{ b.titulo }}</h3>
                <span class="badge badge-info tabular-nums">{{ b.porcentaje }}%</span>
              </div>
              <div class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-marine-500">
                <span>{{ b.leccionesCompletadas }} {{ b.leccionesCompletadas === 1 ? 'lección completada' : 'lecciones completadas' }}</span>
                <span>{{ b.minutos }} min de estudio</span>
                <span>{{ etiquetaEstado(b.estado) }}</span>
              </div>
              <div class="mt-2 h-3 overflow-hidden rounded-full bg-surface-100" aria-hidden="true">
                <div class="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400 transition-all duration-700" [style.width.%]="b.porcentaje"></div>
              </div>
            </article>
          }
          <p class="text-xs text-marine-500">Los datos reflejan tus cursos inscritos, progreso de lecciones, XP y racha — actualización automática al completar cada sesión.</p>
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
  protected readonly completados = signal(0);
  protected readonly lecciones = signal(0);
  protected readonly minutos = signal(0);
  protected readonly barras = signal<{ id: string; titulo: string; porcentaje: number; estado: string; leccionesCompletadas: number; minutos: number }[]>([]);

  ngOnInit(): void { void this.cargar(); }

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
      const [progresos, matriculados, racha] = await Promise.all([
        this.progressService.listarMiProgreso().catch(() => [] as any[]),
        this.courseService.listarCursosDeEstudiante(user.id).catch(() => [] as any[]),
        this.gamificationService.obtenerRacha(user.id).catch(() => null),
      ]);
      // Combinar matriculas con progresos (o 0% si aún no ha empezado).
      const progresosById = new Map((progresos as any[]).map((p: any) => [p.curso_id ?? p.cursoId, p]));
      const barras = (matriculados as any[]).map((c: any) => {
        const p = progresosById.get(c.id);
        const pct = Math.round(Number(p?.porcentaje ?? 0));
        return {
          id: c.id,
          titulo: c.titulo,
          porcentaje: isFinite(pct) ? pct : 0,
          estado: p?.estado ?? 'no_iniciado',
          leccionesCompletadas: Number(p?.lecciones_completadas ?? p?.leccionesCompletadas ?? 0),
          minutos: Number(p?.minutos_estudio ?? p?.minutosEstudio ?? 0),
        };
      });
      const promedio = barras.length ? Math.round(barras.reduce((s: number, b: any) => s + b.porcentaje, 0) / barras.length) : 0;
      this.barras.set(barras);
      this.cursos.set(barras.length);
      this.promedio.set(promedio);
      this.completados.set(barras.filter((b: any) => b.estado === 'completado' || b.porcentaje >= 100).length);
      this.lecciones.set(barras.reduce((s: number, b: any) => s + b.leccionesCompletadas, 0));
      this.minutos.set(barras.reduce((s: number, b: any) => s + b.minutos, 0));
      this.xp.set(this.auth.perfil()?.xp ?? user.user_metadata?.['xp'] ?? 0);
      this.racha.set((racha as any)?.racha_actual ?? (racha as any)?.rachaActual ?? 0);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudo cargar el rendimiento.');
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
}
