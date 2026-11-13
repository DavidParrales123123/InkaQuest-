import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import { AdminService } from '../../../core/services/admin.service';
import { Perfil } from '../../../core/models/domain.models';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-admin-users',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, ReactiveFormsModule, ButtonComponent, DataPanelComponent, PageHeaderComponent, StatusBadgeComponent],
  template: `
    <section class="space-y-6">
      <app-page-header titulo="Usuarios" descripcion="Listado de cuentas registradas y su estado." [acciones]="true">
        <div acciones><app-button variante="contorno" tamano="sm" (alPulsar)="cargar()">Actualizar</app-button></div>
      </app-page-header>
      <div class="card card-body">
        <form class="grid gap-4 md:grid-cols-4" [formGroup]="filtros">
          <div class="md:col-span-2"><label class="label" for="busqueda">Búsqueda</label><input id="busqueda" class="input" formControlName="busqueda" placeholder="Nombre o correo" /></div>
          <div><label class="label" for="rol">Rol</label><select id="rol" class="select" formControlName="rol"><option value="">Todos</option><option value="estudiante">Estudiante</option><option value="docente">Docente</option><option value="administrador">Administrador</option></select></div>
          <div class="flex items-end justify-between gap-3">
            <span class="text-sm text-marine-500">{{ filtrados().length }} de {{ usuarios().length }} usuario(s)</span>
            <button type="button" class="btn btn-outline btn-sm" (click)="limpiarFiltros()">Limpiar</button>
          </div>
        </form>
      </div>
      <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="filtrados().length === 0" (alReintentar)="cargar()">
        <div contenido class="table-wrap">
          <table class="table">
            <thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th><th>XP</th><th>Creado</th></tr></thead>
            <tbody>
              @for (u of filtrados(); track u.id) {
                <tr>
                  <td class="font-medium text-marine-800">{{ nombre(u) }}</td>
                  <td>{{ u.email }}</td>
                  <td>{{ u.rol }}</td>
                  <td><app-status-badge [estado]="u.estado_cuenta" /></td>
                  <td>{{ u.xp }}</td>
                  <td>{{ u.creado_en | date: 'mediumDate' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </app-data-panel>
      <p class="text-xs text-marine-400">Cambios sensibles de rol/estado pueden requerir validaciones adicionales en backend; la visibilidad depende de RLS de administrador.</p>
    </section>
  `,
})
export class UsersComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly fb = inject(FormBuilder);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly usuarios = signal<Perfil[]>([]);
  protected readonly filtros = this.fb.nonNullable.group({ busqueda: [''], rol: [''] });
  protected readonly filtrados = computed(() => {
    const b = this.filtros.controls.busqueda.value.toLowerCase().trim();
    const r = this.filtros.controls.rol.value;
    return this.usuarios().filter((u) => (!r || u.rol === r) && (!b || `${u.nombre} ${u.apellido ?? ''} ${u.email}`.toLowerCase().includes(b)));
  });

  ngOnInit(): void { void this.cargar(); }
  protected nombre(u: Perfil): string { return [u.nombre, u.apellido].filter(Boolean).join(' ') || u.email; }
  protected limpiarFiltros(): void { this.filtros.reset({ busqueda: '', rol: '' }); }
  protected async cargar(): Promise<void> {
    this.cargando.set(true); this.error.set(null);
    try { this.usuarios.set(await this.adminService.listarUsuarios({ limite: 500 })); }
    catch (e) { this.error.set(e instanceof Error ? e.message : 'No se pudieron cargar los usuarios.'); }
    finally { this.cargando.set(false); }
  }
}
