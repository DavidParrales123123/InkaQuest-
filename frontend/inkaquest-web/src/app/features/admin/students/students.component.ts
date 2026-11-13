import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import { AdminService } from '../../../core/services/admin.service';
import { Perfil } from '../../../core/models/domain.models';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-admin-students',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, ReactiveFormsModule, ButtonComponent, DataPanelComponent, PageHeaderComponent, StatCardComponent, StatusBadgeComponent],
  template: `
    <section class="space-y-8">
      <app-page-header
        titulo="Gestión de estudiantes"
        descripcion="Consulta perfiles de estudiantes registrados. Matrículas/progreso detallado se integrarán con backend/RPC cuando estén disponibles."
        [acciones]="true"
      >
        <div acciones><app-button variante="contorno" tamano="sm" (alPulsar)="cargar()">Actualizar</app-button></div>
      </app-page-header>

      <div class="grid gap-4 sm:grid-cols-3">
        <app-stat-card etiqueta="Estudiantes" [valor]="estudiantes().length" tono="brand" />
        <app-stat-card etiqueta="Activos" [valor]="activos()" tono="info" />
        <app-stat-card etiqueta="Pendientes/Suspendidos" [valor]="noActivos()" tono="gold" />
      </div>

      <div class="card card-body">
        <form class="grid gap-4 md:grid-cols-4" [formGroup]="filtros">
          <div class="md:col-span-2"><label class="label" for="busqueda">Búsqueda</label><input id="busqueda" class="input" formControlName="busqueda" placeholder="Nombre o correo" /></div>
          <div><label class="label" for="estado">Estado</label>
            <select id="estado" class="select" formControlName="estado">
              <option value="">Todos</option>
              <option value="activo">Activo</option>
              <option value="pendiente_verificacion">Pendiente verificación</option>
              <option value="suspendido">Suspendido</option>
              <option value="eliminado">Eliminado</option>
            </select>
          </div>
          <div class="flex items-end justify-between gap-3">
            <span class="text-sm text-marine-500">{{ filtrados().length }} resultado(s)</span>
            <button type="button" class="btn btn-outline btn-sm" (click)="limpiarFiltros()">Limpiar</button>
          </div>
        </form>
      </div>

      <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="filtrados().length === 0" (alReintentar)="cargar()">
        <div contenido class="table-wrap">
          <table class="table">
            <thead><tr><th>Nombre</th><th>Correo</th><th>Estado</th><th>XP / Nivel</th><th>Registro</th></tr></thead>
            <tbody>
              @for (u of filtrados(); track u.id) {
                <tr>
                  <td class="font-medium text-marine-800">{{ nombre(u) }}</td>
                  <td>{{ u.email }}</td>
                  <td><app-status-badge [estado]="u.estado_cuenta" /></td>
                  <td>{{ u.xp }} XP · Nv. {{ u.nivel }}</td>
                  <td>{{ u.creado_en | date: 'mediumDate' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </app-data-panel>
      <p class="text-xs text-marine-400">Datos obtenidos según permisos de administrador y RLS. Matrículas/progreso agregados requieren consultas o endpoints adicionales.</p>
    </section>
  `,
})
export class StudentsComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly fb = inject(FormBuilder);

  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly estudiantes = signal<Perfil[]>([]);
  protected readonly filtros = this.fb.nonNullable.group({ busqueda: [''], estado: [''] });

  protected readonly filtrados = computed(() => {
    const b = this.filtros.controls.busqueda.value.toLowerCase().trim();
    const e = this.filtros.controls.estado.value;
    return this.estudiantes().filter((u) => (!e || u.estado_cuenta === e) && (!b || `${u.nombre} ${u.apellido ?? ''} ${u.email}`.toLowerCase().includes(b)));
  });
  protected readonly activos = computed(() => this.estudiantes().filter((u) => u.estado_cuenta === 'activo').length);
  protected readonly noActivos = computed(() => this.estudiantes().filter((u) => u.estado_cuenta !== 'activo').length);

  ngOnInit(): void { void this.cargar(); }
  protected nombre(u: Perfil): string { return [u.nombre, u.apellido].filter(Boolean).join(' ') || u.email; }
  protected limpiarFiltros(): void { this.filtros.reset({ busqueda: '', estado: '' }); }
  protected async cargar(): Promise<void> {
    this.cargando.set(true); this.error.set(null);
    try { this.estudiantes.set(await this.adminService.listarUsuarios({ rol: 'estudiante', limite: 500 })); }
    catch (e) { this.error.set(e instanceof Error ? e.message : 'No se pudieron cargar los estudiantes.'); }
    finally { this.cargando.set(false); }
  }
}
