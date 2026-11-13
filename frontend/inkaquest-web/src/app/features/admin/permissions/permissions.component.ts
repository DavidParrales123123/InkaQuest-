// @ts-nocheck
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';

import { AdminService } from '../../../core/services/admin.service';
import { Permiso } from '../../../core/models/domain.models';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-admin-permissions',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent, DataPanelComponent, PageHeaderComponent],
  template: `
    <section class="space-y-8">
      <app-page-header titulo="Permisos" descripcion="Consulta de permisos definidos en el sistema. La autorización efectiva se aplica en backend/Supabase RLS." [acciones]="true">
        <div acciones><app-button variante="contorno" tamano="sm" (alPulsar)="cargar()">Actualizar</app-button></div>
      </app-page-header>
      <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="permisos().length === 0" (alReintentar)="cargar()">
        <div contenido class="table-wrap">
          <table class="table">
            <thead><tr><th>Código</th><th>Nombre</th><th>Módulo</th><th>Descripción</th></tr></thead>
            <tbody>
              @for (p of permisos(); track p.id) {
                <tr>
                  <td class="font-mono text-sm">{{ p.codigo }}</td>
                  <td class="font-medium text-marine-800">{{ p.nombre }}</td>
                  <td>{{ p.modulo || '-' }}</td>
                  <td class="text-marine-600">{{ p.descripcion || '-' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </app-data-panel>
      <p class="text-xs text-marine-400">La creación/edición de permisos y asignación a roles debe gestionarse por backend o herramientas administrativas autorizadas.</p>
    </section>
  `,
})
export class PermissionsComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly permisos = signal<Permiso[]>([]);

  ngOnInit(): void { void this.cargar(); }
  protected async cargar(): Promise<void> {
    this.cargando.set(true); this.error.set(null);
    try { this.permisos.set(await this.adminService.listarPermisos()); }
    catch (e) { this.error.set(e instanceof Error ? e.message : 'No se pudieron cargar los permisos.'); }
    finally { this.cargando.set(false); }
  }
}
