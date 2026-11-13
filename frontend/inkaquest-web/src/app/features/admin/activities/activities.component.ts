import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';

import { AdminService } from '../../../core/services/admin.service';
import { Actividad } from '../../../core/models/domain.models';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-admin-activities',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent, DataPanelComponent, PageHeaderComponent],
  template: `
    <section class="space-y-8">
      <app-page-header titulo="Gestión de actividades" descripcion="Consulta administrativa de actividades académicas. Creación/gestión avanzada requiere integración backend autorizada." [acciones]="true">
        <div acciones><app-button variante="contorno" tamano="sm" (alPulsar)="cargar()">Actualizar</app-button></div>
      </app-page-header>
      <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="actividades().length === 0" (alReintentar)="cargar()">
        <div contenido class="table-wrap">
          <table class="table">
            <thead><tr><th>Título</th><th>Tipo</th><th>Curso</th><th>Publicado</th><th>XP</th></tr></thead>
            <tbody>
              @for (a of actividades(); track a.id) {
                <tr>
                  <td class="font-medium text-marine-800">{{ a.titulo }}</td>
                  <td>{{ a.tipo }}</td>
                  <td class="font-mono text-xs">{{ a.curso_id.slice(0,8) }}…</td>
                  <td>{{ a.publicado ? 'Sí' : 'No' }}</td>
                  <td>{{ a.xp_otorgado }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </app-data-panel>
    </section>
  `,
})
export class ActivitiesComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly actividades = signal<Actividad[]>([]);

  ngOnInit(): void { void this.cargar(); }
  protected async cargar(): Promise<void> {
    this.cargando.set(true); this.error.set(null);
    try { this.actividades.set(await this.adminService.listarActividadesAdmin()); }
    catch (e) { this.error.set(e instanceof Error ? e.message : 'No se pudieron cargar las actividades.'); }
    finally { this.cargando.set(false); }
  }
}
