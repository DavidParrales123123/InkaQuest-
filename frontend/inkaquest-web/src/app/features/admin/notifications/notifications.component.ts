import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';

import { AdminService } from '../../../core/services/admin.service';
import { Notificacion } from '../../../core/models/domain.models';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-admin-notifications',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, ButtonComponent, DataPanelComponent, PageHeaderComponent],
  template: `
    <section class="space-y-8">
      <app-page-header titulo="Notificaciones (admin)" descripcion="Consulta administrativa de notificaciones registradas. La creación/segmentación/envío masivo requiere backend autorizado." [acciones]="true">
        <div acciones><app-button variante="contorno" tamano="sm" (alPulsar)="cargar()">Actualizar</app-button></div>
      </app-page-header>
      <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="notificaciones().length === 0" (alReintentar)="cargar()">
        <div contenido class="table-wrap">
          <table class="table">
            <thead><tr><th>Título</th><th>Canal</th><th>Destinatario</th><th>Creada</th><th>Enviada</th></tr></thead>
            <tbody>
              @for (n of notificaciones(); track n.id) {
                <tr>
                  <td class="font-medium text-marine-800">{{ n.titulo }}</td>
                  <td>{{ n.canal }}</td>
                  <td class="font-mono text-xs">{{ n.destinatario_id ? (n.destinatario_id.slice(0,8) + '…') : '—' }}</td>
                  <td>{{ n.creado_en | date: 'short' }}</td>
                  <td>{{ n.enviada_en ? (n.enviada_en | date: 'short') : '—' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </app-data-panel>
      <p class="text-xs text-marine-400">El envío, plantillas y segmentación se gestionan en backend; aquí se muestra auditoría/listado según RLS.</p>
    </section>
  `,
})
export class NotificationsComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly notificaciones = signal<Notificacion[]>([]);

  ngOnInit(): void { void this.cargar(); }
  protected async cargar(): Promise<void> {
    this.cargando.set(true); this.error.set(null);
    try { this.notificaciones.set(await this.adminService.listarNotificacionesAdmin()); }
    catch (e) { this.error.set(e instanceof Error ? e.message : 'No se pudieron cargar las notificaciones.'); }
    finally { this.cargando.set(false); }
  }
}
