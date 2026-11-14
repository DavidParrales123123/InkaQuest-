import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';

import { AdminService } from '../../../core/services/admin.service';
import { Configuracion, ParametroSistema } from '../../../core/models/domain.models';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-admin-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DataPanelComponent, PageHeaderComponent],
  template: `
    <section class="space-y-6">
      <app-page-header titulo="Configuración" descripcion="Parámetros y configuración pública del sistema (solo lectura en frontend)." />
      <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="config().length === 0 && parametros().length === 0" (alReintentar)="cargar()">
        <div contenido class="grid gap-6 lg:grid-cols-2">
          <div class="card card-body">
            <h2 class="text-lg font-semibold text-marine-800">Configuración</h2>
            @if (config().length === 0) { <p class="mt-2 text-sm text-marine-500">No hay configuración visible.</p> }
            @else {
              <ul class="mt-3 space-y-2 text-sm">
                @for (c of config(); track c.id) {
                  <li class="rounded-xl bg-surface-50 p-3"><p class="font-medium">{{ c.clave }}</p><p class="text-marine-500 break-all">{{ c.valor }}</p></li>
                }
              </ul>
            }
          </div>
          <div class="card card-body">
            <h2 class="text-lg font-semibold text-marine-800">Parametros del sistema</h2>
            @if (parametros().length === 0) { <p class="mt-2 text-sm text-marine-500">No hay parametros visibles.</p> }
            @else {
              <ul class="mt-3 space-y-2 text-sm">
                @for (p of parametros(); track p.id) {
                  <li class="rounded-xl bg-surface-50 p-3"><p class="font-medium">{{ p.clave }}</p><p class="text-marine-500 break-all">{{ p.valor }}</p></li>
                }
              </ul>
            }
          </div>
        </div>
      </app-data-panel>
      <p class="text-xs text-marine-400">La edición de configuración sensible debe realizarse por canales autorizados/backend; los valores secretos no se exponen al frontend.</p>
    </section>
  `,
})
export class SettingsComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly config = signal<Configuracion[]>([]);
  protected readonly parametros = signal<ParametroSistema[]>([]);

  ngOnInit(): void { void this.cargar(); }
  protected async cargar(): Promise<void> {
    this.cargando.set(true); this.error.set(null);
    try {
      const [c, p] = await Promise.all([this.adminService.listarConfiguracion(), this.adminService.listarParametros()]);
      this.config.set(c); this.parametros.set(p);
    } catch (e) { this.error.set(e instanceof Error ? e.message : 'No se pudo cargar la configuración.'); }
    finally { this.cargando.set(false); }
  }
}
