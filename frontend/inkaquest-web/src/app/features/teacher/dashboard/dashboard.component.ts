// @ts-nocheck
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { TeacherService } from '../../../core/services/teacher.service';
import { Actividad, Curso, DocenteCurso, Entrega, Perfil, Tarea } from '../../../core/models/domain.models';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-teacher-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DataPanelComponent, PageHeaderComponent, StatCardComponent, StatusBadgeComponent],
  template: `
    <section class="space-y-6">
      <app-page-header titulo="Panel docente" descripcion="Resumen de tus cursos asignados, estudiantes y entregas pendientes." />
      <div class="grid gap-4 sm:grid-cols-3">
        <app-stat-card etiqueta="Cursos asignados" [valor]="cursos().length" [icono]="true" tono="brand"><span icono><svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg></span></app-stat-card>
        <app-stat-card etiqueta="Estudiantes" [valor]="estudiantes().length" [icono]="true" tono="gold"><span icono><svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></span></app-stat-card>
        <app-stat-card etiqueta="Entregas por revisar" [valor]="entregas().length" [icono]="true" tono="danger"><span icono><svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/></svg></span></app-stat-card>
      </div>
      <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="false" (alReintentar)="cargar()">
        <div contenido class="grid gap-6 lg:grid-cols-2">
          <div class="card card-body">
            <h2 class="text-lg font-semibold text-marine-800">Mis cursos</h2>
            @if (cursos().length === 0) {
              <p class="mt-3 text-sm text-marine-500">No tienes cursos asignados actualmente.</p>
            } @else {
              <ul class="mt-3 space-y-2">
                @for (c of cursos(); track c.id) {
                  <li class="flex items-center justify-between rounded-button border border-surface-200 p-3">
                    <div>
                      <p class="font-medium text-marine-800">{{ c.curso.titulo }}</p>
                      <p class="text-xs text-marine-400">Responsable: {{ c.es_responsable ? 'Si' : 'No' }}</p>
                    </div>
                    <a [routerLink]="['/docente/cursos', c.curso.id]" class="link text-sm">Gestionar contenido</a>
                  </li>
                }
              </ul>
            }
          </div>
          <div class="card card-body">
            <h2 class="text-lg font-semibold text-marine-800">Entregas pendientes</h2>
            @if (entregas().length === 0) {
              <p class="mt-3 text-sm text-marine-500">No hay entregas pendientes de revisión.</p>
            } @else {
              <ul class="mt-3 space-y-2 text-sm">
                @for (e of entregas().slice(0, 8); track e.id) {
                  <li class="flex items-center justify-between rounded-button bg-surface-50 p-3">
                    <span class="truncate text-marine-700">{{ e.actividad.titulo }}</span>
                    <app-status-badge [estado]="e.estado" />
                  </li>
                }
              </ul>
              <a routerLink="/docente/tareas" class="btn btn-outline btn-sm mt-4 w-fit">Ir a tareas</a>
            }
          </div>
        </div>
      </app-data-panel>
    </section>
  `,
})
export class DashboardComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly teacherService = inject(TeacherService);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly cursos = signal<(DocenteCurso & { curso: Curso })[]>([]);
  protected readonly estudiantes = signal<Perfil[]>([]);
  protected readonly entregas = signal<(Entrega & { tarea: Tarea; actividad: Actividad })[]>([]);

  ngOnInit(): void { void this.cargar(); }
  protected async cargar(): Promise<void> {
    const user = this.auth.usuario();
    if (!user) { this.error.set('Debes iniciar sesión.'); this.cargando.set(false); return; }
    this.cargando.set(true); this.error.set(null);
    try {
      const [cursos, estudiantes, entregas] = await Promise.all([
        this.teacherService.listarMisCursos(user.id),
        this.teacherService.listarEstudiantes(user.id).catch(() => [] as Perfil[]),
        this.teacherService.listarEntregasPendientes(user.id).catch(() => [] as (Entrega & { tarea: Tarea; actividad: Actividad })[]),
      ]);
      this.cursos.set(cursos); this.estudiantes.set(estudiantes); this.entregas.set(entregas);
    } catch (e) { this.error.set(e instanceof Error ? e.message : 'No se pudo cargar el panel docente.'); }
    finally { this.cargando.set(false); }
  }
}
