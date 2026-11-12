import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';

import { AuthService } from '../../../core/services/auth.service';
import { TeacherService } from '../../../core/services/teacher.service';
import { Actividad, Entrega, Tarea } from '../../../core/models/domain.models';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';

interface BarraCurso {
  titulo: string;
  total: number;
  pendientes: number;
  porcentaje: number;
}

/**
 * Analítica del docente.
 *
 * <p>Barras de entregas por curso con datos reales (mismas entregas que la
 * bandeja de calificación), porcentaje de entregas resueltas y promedio de
 * tus calificaciones.</p>
 */
@Component({
  selector: 'app-teacher-analytics',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DataPanelComponent, PageHeaderComponent, StatCardComponent],
  template: `
    <section class="space-y-6">
      <app-page-header titulo="Analítica" descripcion="Entrega de trabajos y calificaciones de tus cursos asignados." />
      <div class="grid gap-4 sm:grid-cols-4">
        <app-stat-card etiqueta="Cursos" [valor]="cursos()" [icono]="true" tono="brand"><span icono><svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg></span></app-stat-card>
        <app-stat-card etiqueta="Estudiantes" [valor]="estudiantes()" [icono]="true" tono="gold"><span icono><svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></span></app-stat-card>
        <app-stat-card etiqueta="Entregas pendientes" [valor]="pendientes()" [icono]="true" tono="danger"><span icono><svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/></svg></span></app-stat-card>
        <app-stat-card etiqueta="Promedio general" [valor]="promedio() + '%'" [icono]="true" tono="info"><span icono><svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-6 6"/></svg></span></app-stat-card>
      </div>

      <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="barras().length === 0" tituloVacio="Aún no tienes entregas" descripcionVacia="Cuando tus estudiantes entreguen, verás las métricas por curso aquí." (alReintentar)="cargar()">
        <div contenido class="grid gap-6 lg:grid-cols-12">
          <!-- Barras -->
          <div class="card card-body lg:col-span-8">
            <h2 class="text-base font-bold text-marine-800">Entregas por curso</h2>
            <p class="mt-1 text-xs text-marine-500">Pendientes vs. revisadas/total por cada curso asignado.</p>
            <ul class="mt-4 space-y-3">
              @for (b of barras(); track b.titulo) {
                <li>
                  <div class="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                    <span class="font-semibold text-marine-800">{{ b.titulo }}</span>
                    <span class="text-xs text-marine-500">{{ b.pendientes }} pendientes · {{ b.total }} totales</span>
                  </div>
                  <div class="mt-1.5 h-4 w-full overflow-hidden rounded-full bg-surface-100">
                    <div class="h-full rounded-full bg-brand-500 transition-all duration-500" [style.width.%]="b.porcentaje" role="img" [attr.aria-label]="b.titulo + ': ' + b.porcentaje + '% resueltas'"></div>
                  </div>
                </li>
              }
            </ul>
          </div>

          <!-- Resumen -->
          <div class="card card-body lg:col-span-4">
            <h2 class="text-base font-bold text-marine-800">Resumen</h2>
            <div class="mt-3 space-y-2 text-sm">
              <p class="flex items-center justify-between border-b border-surface-100 py-2"><span class="text-marine-600">Total entregas</span><strong class="text-marine-800">{{ totalEntregas() }}</strong></p>
              <p class="flex items-center justify-between border-b border-surface-100 py-2"><span class="text-marine-600">Por calificar</span><strong class="text-warning-600">{{ pendientes() }}</strong></p>
              <p class="flex items-center justify-between border-b border-surface-100 py-2"><span class="text-marine-600">Resueltas</span><strong class="text-success-600">{{ resueltas() }}</strong></p>
              <p class="flex items-center justify-between py-2"><span class="text-marine-600">Promedio general</span><strong class="text-marine-800">{{ promedio() }}%</strong></p>
            </div>
          </div>
        </div>
      </app-data-panel>
    </section>
  `,
})
export class AnalyticsComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly teacherService = inject(TeacherService);

  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly cursos = signal(0);
  protected readonly estudiantes = signal(0);
  protected readonly pendientes = signal(0);
  protected readonly resueltas = signal(0);
  protected readonly totalEntregas = signal(0);
  protected readonly promedio = signal(0);
  protected readonly barras = signal<BarraCurso[]>([]);

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
      const [cursos, estudiantes, entregas, calificaciones] = await Promise.all([
        this.teacherService.listarMisCursos(user.id).catch(() => [] as Awaited<ReturnType<TeacherService['listarMisCursos']>>),
        this.teacherService.listarEstudiantes(user.id).catch(() => [] as Awaited<ReturnType<TeacherService['listarEstudiantes']>>),
        this.teacherService.listarEntregasGestion(user.id).catch(() => [] as (Entrega & { tarea: Tarea; actividad: Actividad })[]),
        this.teacherService.listarCalificaciones(user.id).catch(() => []),
      ]);

      const porCurso = new Map<string, { total: number; pendientes: number; titulo: string }>();
      for (const e of entregas) {
        const id = e.actividad.curso_id;
        const entry = porCurso.get(id) ?? { total: 0, pendientes: 0, titulo: cursos.find((c) => c.curso.id === id)?.curso.titulo ?? '—' };
        entry.total += 1;
        if (e.estado === 'enviado' || e.estado === 'en_revision') {
          entry.pendientes += 1;
        }
        porCurso.set(id, entry);
      }

      const barras = [...porCurso.values()].map((v) => ({
        titulo: v.titulo,
        total: v.total,
        pendientes: v.pendientes,
        porcentaje: v.total === 0 ? 0 : Math.round(((v.total - v.pendientes) / v.total) * 100),
      }));

      const total = barras.reduce((s, b) => s + b.total, 0);
      const pend = barras.reduce((s, b) => s + b.pendientes, 0);
      const notas = calificaciones
        .map((c) => (c.nota_maxima ? (c.nota / c.nota_maxima) * 100 : null))
        .filter((v): v is number => v !== null && Number.isFinite(v));
      const prom = notas.length === 0 ? 0 : Math.round(notas.reduce((a, b) => a + b, 0) / notas.length);

      this.cursos.set(cursos.length);
      this.estudiantes.set(estudiantes.length);
      this.pendientes.set(pend);
      this.totalEntregas.set(total);
      this.resueltas.set(total - pend);
      this.promedio.set(prom);
      this.barras.set(barras);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudo cargar la analítica.');
    } finally {
      this.cargando.set(false);
    }
  }
}
