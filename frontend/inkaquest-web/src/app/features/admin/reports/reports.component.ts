// @ts-nocheck
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { AdminService } from '../../../core/services/admin.service';
import { Curso, Matricula, Ticket, Perfil } from '../../../core/models/domain.models';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

interface FilaCurso {
  id: string;
  titulo: string;
  estado: string;
  matriculados: number;
  completadas: number;
  pendientes: number;
  porcentaje_pago: number;
}

interface FilaTicket {
  id: string;
  asunto: string;
  estado: string;
  prioridad: string;
  email: string;
  creado_en: string;
}

@Component({
  selector: 'app-admin-reports',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink, DataPanelComponent, PageHeaderComponent, StatCardComponent, StatusBadgeComponent],
  template: `
    <section class="space-y-6">
      <app-page-header
        titulo="Reportes y métricas"
        descripcion="Indicadores accionables de la plataforma, calculados solo con lo visible bajo permisos de administrador."
        [acciones]="true"
      >
        <div acciones class="flex flex-wrap gap-2">
          <button type="button" class="btn btn-outline btn-sm" (click)="cargar()" [disabled]="cargando()">Actualizar</button>
        </div>
      </app-page-header>

      <!-- Métricas globales -->
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <app-stat-card etiqueta="Usuarios" [valor]="perfiles().length" tono="brand" [icono]="true">
          <span icono><svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></span>
        </app-stat-card>
        <app-stat-card etiqueta="Estudiantes" [valor]="estudiantes().length" tono="info" [icono]="true">
          <span icono><svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2l10 4.5L12 11 2 6.5z"/><path d="M2 6.5v9L12 20l10-4.5v-9"/></svg></span>
        </app-stat-card>
        <app-stat-card etiqueta="Docentes" [valor]="docentes().length" tono="gold" [icono]="true">
          <span icono><svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4"/></svg></span>
        </app-stat-card>
        <app-stat-card etiqueta="Cursos publicados" [valor]="cursosPublicados()" tono="success" [icono]="true">
          <span icono><svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg></span>
        </app-stat-card>
        <app-stat-card etiqueta="Matrículas activas" [valor]="matriculasActivas().length" tono="brand" [icono]="true">
          <span icono><svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2l9 6-9 6-9-6z"/><path d="M5 9v10"/><path d="M19 9v10"/></svg></span>
        </app-stat-card>
        <app-stat-card etiqueta="Tickets abiertos" [valor]="ticketsAbiertos().length" tono="danger" [icono]="true">
          <span icono><svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M10 12h4M10 16h4"/></svg></span>
        </app-stat-card>
      </div>

      @if (error()) {
        <p class="rounded-lg border border-danger-200 bg-danger-50 p-3 text-sm text-danger-700" role="alert">{{ error() }}</p>
      }

      <div class="grid gap-6 xl:grid-cols-3">
        <!-- Cursos y matrícula -->
        <app-data-panel class="xl:col-span-2" [cargando]="cargando()" [error]="error()" [vacio]="filasCurso().length === 0" tituloVacio="Aún no hay cursos" descripcionVacia="Selecciona un curso publicado y con matrícula activa para ver métricas en vivo." (alReintentar)="cargar()">
          <div contenido class="space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <h2 class="text-base font-semibold text-marine-800">Cursos · Matrícula</h2>
              <a routerLink="/admin/cursos" class="btn btn-outline btn-sm">Administrar cursos</a>
            </div>
            <div class="table-wrap overflow-x-auto rounded-xl border border-surface-200">
              <table class="table">
                <thead>
                  <tr>
                    <th scope="col">Curso</th>
                    <th scope="col">Estado</th>
                    <th scope="col">Matriculados</th>
                    <th scope="col">Completados</th>
                    <th scope="col">Abandonadas</th>
                    <th scope="col">% aprobado</th>
                  </tr>
                </thead>
                <tbody>
                  @for (fila of filasCurso(); track fila.id) {
                    <tr>
                      <td class="font-medium text-marine-800">{{ fila.titulo }}</td>
                      <td><app-status-badge [estado]="fila.estado" /></td>
                      <td>{{ fila.matriculados }}</td>
                      <td>{{ fila.completadas }}</td>
                      <td>{{ fila.pendientes }}</td>
                      <td>{{ fila.porcentaje_pago }}%</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </app-data-panel>

        <!-- Tickets abiertos -->
        <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="ticketsRecientes().length === 0" tituloVacio="Sin tickets" descripcionVacia="Cuando los alumnos/docentes creen tickets de soporte, aparecerán aquí." (alReintentar)="cargar()">
          <div contenido class="space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <h2 class="text-base font-semibold text-marine-800">Tickets recientes</h2>
              <a routerLink="/admin/soporte" class="btn btn-outline btn-sm">Ver todos</a>
            </div>
            <ul class="space-y-2">
              @for (t of ticketsRecientes(); track t.id) {
                <li class="rounded-xl border border-surface-200 bg-surface-50/60 p-3">
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <p class="font-semibold text-marine-800">{{ t.asunto }}</p>
                    <app-status-badge [estado]="t.estado" />
                  </div>
                  <p class="mt-1 text-xs text-marine-500">Prioridad: {{ t.prioridad }} · {{ t.creado_en | date:'medium' }}</p>
                  <p class="mt-1 text-xs text-marine-600 line-clamp-2">{{ t.categoria ?? 'sin categoría' }}</p>
                </li>
              }
            </ul>
          </div>
        </app-data-panel>
      </div>

      @if (!cargando() && !error()) {
        <p class="text-xs text-marine-400">Datos en vivo calculados con RLS de administrador sobre <code>perfil</code>, <code>curso</code>, <code>matricula</code>, <code>ticket</code>.</p>
      }
    </section>
  `,
})
export class ReportsComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly perfiles = signal<Perfil[]>([]);
  protected readonly cursos = signal<Curso[]>([]);
  protected readonly matriculas = signal<Matricula[]>([]);
  protected readonly tickets = signal<Ticket[]>([]);

  protected readonly estudiantes = computed(() => this.perfiles().filter((p) => p.rol === 'estudiante'));
  protected readonly docentes = computed(() => this.perfiles().filter((p) => p.rol === 'docente'));
  protected readonly cursosPublicados = computed(() => this.cursos().filter((c) => c.estado === 'publicado').length);
  protected readonly matriculasActivas = computed(() => this.matriculas().filter((m) => m.estado === 'activa'));
  protected readonly matriculasCompletadas = computed(() => this.matriculas().filter((m) => m.estado === 'completada'));
  protected readonly matriculasPendientes = computed(() => this.matriculas().filter((m) => m.estado === 'pendiente_pago'));
  protected readonly ticketsAbiertos = computed(() =>
    this.tickets().filter((t) => t.estado !== 'cerrado' && t.estado !== 'resuelto'),
  );
  protected readonly ticketsRecientes = computed(() => this.tickets().slice(0, 5));

  protected readonly filasCurso = computed<FilaCurso[]>(() => {
    const cs = this.cursos();
    const ms = this.matriculas();
    const porCurso = new Map<string, Matricula[]>();
    for (const m of ms) {
      const arr = porCurso.get(m.curso_id) ?? [];
      arr.push(m);
      porCurso.set(m.curso_id, arr);
    }
    return cs.map((c) => {
      const list = porCurso.get(c.id) ?? [];
      const activas = list.filter((m) => m.estado === 'activa').length;
      const completadas = list.filter((m) => m.estado === 'completada').length;
      const pendientes = list.filter((m) => m.estado === 'pendiente_pago').length;
      const totalesPagadas = list.length;
      const pagadas = list.filter((m) => m.estado === 'activa' || m.estado === 'completada').length;
      const pct = totalesPagadas === 0 ? 0 : Math.round((pagadas / totalesPagadas) * 100);
      return { id: c.id, titulo: c.titulo, estado: c.estado, matriculados: activas + completadas + pendientes, completadas, pendientes, porcentaje_pago: pct };
    });
  });

  ngOnInit(): void { void this.cargar(); }

  protected async cargar(): Promise<void> {
    this.cargando.set(true); this.error.set(null);
    try {
      const [u, c, m, t] = await Promise.all([
        this.adminService.listarUsuarios({ limite: 1000 }),
        this.adminService.listarTodosLosCursos(),
        this.adminService.listarMatriculasAdmin(),
        this.adminService.listarTicketsAdmin(50),
      ]);
      this.perfiles.set(u);
      this.cursos.set(c);
      this.matriculas.set(m);
      this.tickets.set(t);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudieron cargar los reportes.');
    } finally {
      this.cargando.set(false);
    }
  }
}
