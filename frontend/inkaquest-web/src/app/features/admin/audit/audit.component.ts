import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';

import { AdminService } from '../../../core/services/admin.service';
import { AuditoriaAcceso, RegistroAccion } from '../../../core/models/domain.models';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-admin-audit',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, DataPanelComponent, PageHeaderComponent],
  template: `
    <section class="space-y-6">
      <app-page-header titulo="Auditoría" descripcion="Registro de acciones y accesos de la plataforma." />
      <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="acciones().length === 0 && accesos().length === 0" (alReintentar)="cargar()">
        <div contenido class="space-y-8">
          <div>
            <h2 class="text-lg font-semibold text-marine-800">Acciones</h2>
            @if (acciones().length === 0) { <p class="mt-2 text-sm text-marine-500">Sin registros.</p> }
            @else {
              <div class="mt-3 table-wrap"><table class="table"><thead><tr><th>Acción</th><th>Entidad</th><th>Fecha</th></tr></thead><tbody>
                @for (a of acciones(); track a.id) { <tr><td>{{ a.accion }}</td><td>{{ a.entidad_tipo || '-' }} {{ a.entidad_id ? '(' + a.entidad_id.slice(0,8) + '…)' : '' }}</td><td>{{ a.creado_en | date: 'medium' }}</td></tr> }
              </tbody></table></div>
            }
          </div>
          <div>
            <h2 class="text-lg font-semibold text-marine-800">Accesos</h2>
            @if (accesos().length === 0) { <p class="mt-2 text-sm text-marine-500">Sin registros.</p> }
            @else {
              <div class="mt-3 table-wrap"><table class="table"><thead><tr><th>Evento</th><th>IP</th><th>Fecha</th></tr></thead><tbody>
                @for (a of accesos(); track a.id) { <tr><td>{{ a.evento || '-' }}</td><td>{{ a.ip || '-' }}</td><td>{{ a.creado_en | date: 'medium' }}</td></tr> }
              </tbody></table></div>
            }
          </div>
        </div>
      </app-data-panel>
    </section>
  `,
})
export class AuditComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly acciones = signal<RegistroAccion[]>([]);
  protected readonly accesos = signal<AuditoriaAcceso[]>([]);

  ngOnInit(): void { void this.cargar(); }
  protected async cargar(): Promise<void> {
    this.cargando.set(true); this.error.set(null);
    try {
      const [a, b] = await Promise.all([this.adminService.listarAuditoria(50), this.adminService.listarAccesos(50)]);
      this.acciones.set(a); this.accesos.set(b);
    } catch (e) { this.error.set(e instanceof Error ? e.message : 'No se pudo cargar la auditoría.'); }
    finally { this.cargando.set(false); }
  }
}
