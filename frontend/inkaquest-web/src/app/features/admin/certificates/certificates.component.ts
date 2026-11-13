// @ts-nocheck
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';

import { AdminService } from '../../../core/services/admin.service';
import { Certificado } from '../../../core/models/domain.models';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-admin-certificates',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, ButtonComponent, DataPanelComponent, PageHeaderComponent, StatusBadgeComponent],
  template: `
    <section class="space-y-8">
      <app-page-header titulo="Certificados (admin)" descripcion="Consulta de certificados emitidos. La elegibilidad, emisión y revocación deben determinarse en backend." [acciones]="true">
        <div acciones><app-button variante="contorno" tamano="sm" (alPulsar)="cargar()">Actualizar</app-button></div>
      </app-page-header>
      <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="certificados().length === 0" (alReintentar)="cargar()">
        <div contenido class="table-wrap">
          <table class="table">
            <thead><tr><th>Código</th><th>Estado</th><th>Emitido</th><th>Expira</th><th>Verificado</th></tr></thead>
            <tbody>
              @for (c of certificados(); track c.id) {
                <tr>
                  <td class="font-mono text-sm">{{ c.codigo }}</td>
                  <td><app-status-badge [estado]="c.estado" /></td>
                  <td>{{ c.emitido_en | date: 'mediumDate' }}</td>
                  <td>{{ c.expira_en ? (c.expira_en | date: 'mediumDate') : '—' }}</td>
                  <td>{{ c.verificado ? 'Sí' : 'No' }} ({{ c.veces_verificado }})</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </app-data-panel>
      <p class="text-xs text-marine-400">Listado sujeto a permisos/RLS. Asociación de titular/curso y acciones de emisión/revocación requieren integración adicional autorizada.</p>
    </section>
  `,
})
export class CertificatesComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly certificados = signal<Certificado[]>([]);

  ngOnInit(): void { void this.cargar(); }
  protected async cargar(): Promise<void> {
    this.cargando.set(true); this.error.set(null);
    try { this.certificados.set(await this.adminService.listarCertificadosAdmin()); }
    catch (e) { this.error.set(e instanceof Error ? e.message : 'No se pudieron cargar los certificados.'); }
    finally { this.cargando.set(false); }
  }
}
